import { and, desc, eq, inArray, isNull, or, sql } from "drizzle-orm"
import type { HelpdeskPrincipalId } from "./authorization.types"
import type { FdmHelpdeskType } from "./fdm-helpdesk.types"
import type { ImpersonationRequestFilters } from "./filter.types"
import { checkHelpdeskPermission, getHelpdeskRole } from "./authorization"
import * as schema from "./db/schema-helpdesk"
import { handleError } from "./error"
import { getImpersonationRequestWhereClause } from "./filter"
import { createId } from "./id"
import { getPageOffsetAndLimit } from "./pagination"

type ImpersonationRequest = schema.ImpersonationRequestTypeSelect

const ONE_WEEK_MS = 604_800_000
const PERMISSION_DENIED_MESSAGE = "Principal does not have permission to perform this action"

function toPrincipalIds(principal_id: HelpdeskPrincipalId) {
  return [...new Set(Array.isArray(principal_id) ? principal_id : [principal_id])]
}

/**
 * Whether the principal(s) are exactly the given principal. Several principals are only considered the
 * same if all of them are.
 */
function isPrincipal(principal_id: HelpdeskPrincipalId, expected_id: string) {
  const ids = toPrincipalIds(principal_id)
  return ids.length > 0 && ids.every((id) => id === expected_id)
}

/**
 * Gets a request by ID without any permission checks.
 *
 * @throws with the generic permission error if the request does not exist, so that callers cannot probe
 * for existing request IDs.
 */
async function getImpersonationRequestUnchecked(
  fdm: FdmHelpdeskType,
  impersonation_request_id: ImpersonationRequest["impersonation_request_id"],
): Promise<ImpersonationRequest> {
  const requests = await fdm
    .select()
    .from(schema.impersonationRequests)
    .where(eq(schema.impersonationRequests.impersonation_request_id, impersonation_request_id))
    .limit(1)
  if (requests.length === 0) {
    throw new Error(PERMISSION_DENIED_MESSAGE)
  }
  return requests[0]
}

/**
 * Creates an impersonation request for the target principal by the agent. The target principal
 * needs to accept the request before the agent is able to impersonate.
 *
 * The ticket ID is stored for auditing purposes only; it is not validated.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param agent_id ID of the agent making the request.
 * @param ticket_id ID of the ticket that the impersonation relates to.
 * @param target_principal_id ID of the principal the agent is intending to impersonate.
 * @param options Creation options.
 * @returns the impersonation request ID.
 * @throws if the principal is not an agent, is the same as the target, or the duration is not positive.
 */
export async function requestImpersonation(
  fdm: FdmHelpdeskType,
  agent_id: string,
  ticket_id: schema.ImpersonationRequestTypeInsert["ticket_id"],
  target_principal_id: schema.ImpersonationRequestTypeInsert["target_principal_id"],
  options: {
    /** Duration in milliseconds from the time of acceptance the agent will be allowed to impersonate. Defaults to 1 week (604800000ms). */
    duration?: number
    /** What the agent is planning to do while impersonating. */
    goal?: schema.ImpersonationRequestTypeSelect["goal"]
    /** Date and time of expiry for the request. Once the request is accepted it will be valid for the given duration regardless of the expiry date. Defaults to 1 week from now. */
    expires_at?: Date
  } = {},
): Promise<ImpersonationRequest["impersonation_request_id"]> {
  try {
    await checkHelpdeskPermission(fdm, "helpdesk", "read", "", agent_id, "requestImpersonation")

    if (agent_id === target_principal_id) {
      throw new Error("Agents cannot request to impersonate themselves")
    }
    const duration = options.duration ?? ONE_WEEK_MS
    if (!Number.isFinite(duration) || duration <= 0) {
      throw new Error("Invalid duration")
    }
    const expires_at = options.expires_at ?? new Date(Date.now() + ONE_WEEK_MS)

    const impersonation_request_id = createId()
    await fdm.insert(schema.impersonationRequests).values({
      impersonation_request_id,
      goal: options.goal,
      target_principal_id,
      agent_id,
      ticket_id,
      status: "pending",
      duration: sql`${duration} * interval '1 millisecond'`,
      expires_at,
    })
    return impersonation_request_id
  } catch (err) {
    throw handleError(err, "Exception for requestImpersonation", {
      agent_id,
      ticket_id,
      target_principal_id,
    })
  }
}

/**
 * Cancels an impersonation request, and invalidates any active impersonation grant. Has no effect on
 * declined or expired requests, though the cancellation will still be recorded.
 *
 * Cancelling an already cancelled request keeps the original cancellation time.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param principal_id ID of the principal willing to cancel the request. Must be either an admin agent,
 * the requesting agent, or the target principal.
 * @param impersonation_request_id ID of the request to cancel.
 * @throws if the request does not exist or the principal is not allowed to cancel it.
 */
export async function cancelImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: schema.ImpersonationRequestTypeSelect["impersonation_request_id"],
) {
  try {
    const request = await getImpersonationRequestUnchecked(fdm, impersonation_request_id)

    const allowed =
      isPrincipal(principal_id, request.agent_id) ||
      isPrincipal(principal_id, request.target_principal_id) ||
      (await checkHelpdeskPermission(
        fdm,
        "helpdesk",
        "write",
        "",
        principal_id,
        "cancelImpersonation",
        false,
      ))
    if (!allowed) {
      throw new Error(PERMISSION_DENIED_MESSAGE)
    }

    await fdm
      .update(schema.impersonationRequests)
      .set({ cancelled_at: sql`now()` })
      .where(
        and(
          eq(schema.impersonationRequests.impersonation_request_id, impersonation_request_id),
          isNull(schema.impersonationRequests.cancelled_at),
        ),
      )
  } catch (err) {
    throw handleError(err, "Exception for cancelImpersonation", {
      impersonation_request_id,
    })
  }
}

/**
 * Accept the given impersonation request as the target principal. The impersonation will be valid until
 * the acceptance time plus the duration set by the agent beforehand.
 *
 * This function won't un-cancel a cancelled request. The user would need to make a new request.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param principal_id ID of the principal accepting the request. Must match the target principal ID for
 * the request.
 * @param impersonation_request_id ID of the request to accept.
 * @throws if the principal is not the target, or the request is not pending, is cancelled, or has expired.
 */
export async function acceptImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: schema.ImpersonationRequestTypeSelect["impersonation_request_id"],
) {
  try {
    await respondToImpersonation(fdm, principal_id, impersonation_request_id, "accepted")
  } catch (err) {
    throw handleError(err, "Exception for acceptImpersonation", {
      impersonation_request_id,
    })
  }
}

/**
 * Decline the given impersonation request as the target principal.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param principal_id ID of the principal declining the request. Must match the target principal ID for
 * the request.
 * @param impersonation_request_id ID of the request to decline.
 * @throws if the principal is not the target, or the request is not pending, is cancelled, or has expired.
 */
export async function declineImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: schema.ImpersonationRequestTypeSelect["impersonation_request_id"],
) {
  try {
    await respondToImpersonation(fdm, principal_id, impersonation_request_id, "declined")
  } catch (err) {
    throw handleError(err, "Exception for declineImpersonation", {
      impersonation_request_id,
    })
  }
}

/**
 * Moves a pending, uncancelled, unexpired request to the given status as the target principal. The state
 * check is part of the UPDATE so that concurrent responses cannot both succeed.
 */
async function respondToImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: string,
  status: "accepted" | "declined",
) {
  const request = await getImpersonationRequestUnchecked(fdm, impersonation_request_id)
  if (!isPrincipal(principal_id, request.target_principal_id)) {
    throw new Error(PERMISSION_DENIED_MESSAGE)
  }

  const updated = await fdm
    .update(schema.impersonationRequests)
    .set({
      status,
      accepted_at: status === "accepted" ? sql`now()` : undefined,
    })
    .where(
      and(
        eq(schema.impersonationRequests.impersonation_request_id, impersonation_request_id),
        eq(schema.impersonationRequests.status, "pending"),
        isNull(schema.impersonationRequests.cancelled_at),
        or(
          isNull(schema.impersonationRequests.expires_at),
          sql`${schema.impersonationRequests.expires_at} > now()`,
        ),
      ),
    )
    .returning({ id: schema.impersonationRequests.impersonation_request_id })

  if (updated.length === 0) {
    throw new Error("Impersonation request is no longer pending")
  }
}

/**
 * List the impersonation requests with the given filters, newest first.
 *
 * Agents and admins are able to list all impersonation requests. Regular users are only able to list
 * impersonation requests targeting them. In that case any ID in the targetPrincipals filter other than the
 * user's principal_id will be ignored.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param principal_id The principal identifier(s) listing the requests.
 * @param filters Filters to apply to the result
 * @returns the list of impersonation requests that match the filters.
 */
export async function getImpersonationRequests(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  filters: ImpersonationRequestFilters = {},
): Promise<ImpersonationRequest[]> {
  try {
    const isHelpdeskStaff = await checkHelpdeskPermission(
      fdm,
      "helpdesk",
      "read",
      "",
      principal_id,
      "getImpersonationRequests",
      false,
    )
    const effectiveFilters: ImpersonationRequestFilters = isHelpdeskStaff
      ? filters
      : { ...filters, targetPrincipals: toPrincipalIds(principal_id) }

    const { pageOffset, pageLimit } = getPageOffsetAndLimit(filters)
    const query = fdm
      .select()
      .from(schema.impersonationRequests)
      .where(getImpersonationRequestWhereClause(effectiveFilters))
      .orderBy(
        desc(schema.impersonationRequests.created),
        desc(schema.impersonationRequests.impersonation_request_id),
      )
      .offset(pageOffset)
    return await (pageLimit ? query.limit(pageLimit) : query)
  } catch (err) {
    throw handleError(err, "Exception for getImpersonationRequests", {
      principal_id,
    })
  }
}

/**
 * Returns the impersonation request row that is between the admin and the target principal,
 * is accepted, is not cancelled, and there is still time until the acceptance time plus the duration.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param admin_id The admin identifier(s); must have read permission for the helpdesk.
 * @param target_principal_id ID of the principal the admin is seeking to impersonate as.
 * @returns the active request that was accepted most recently, or `null` if there is none.
 * @throws if the principal does not have permission to read the helpdesk.
 */
export async function getActiveImpersonation(
  fdm: FdmHelpdeskType,
  admin_id: HelpdeskPrincipalId,
  target_principal_id: HelpdeskPrincipalId,
): Promise<ImpersonationRequest | null> {
  try {
    await checkHelpdeskPermission(fdm, "helpdesk", "read", "", admin_id, "getActiveImpersonation")
    const role = await getHelpdeskRole(fdm, admin_id)
    if (role === "user") {
      return null
    }

    const targets = toPrincipalIds(target_principal_id)
    const requests = await fdm
      .select()
      .from(schema.impersonationRequests)
      .where(
        and(
          inArray(schema.impersonationRequests.agent_id, toPrincipalIds(admin_id)),
          inArray(schema.impersonationRequests.target_principal_id, targets),
          eq(schema.impersonationRequests.status, "accepted"),
          isNull(schema.impersonationRequests.cancelled_at),
          sql`${schema.impersonationRequests.accepted_at} + ${schema.impersonationRequests.duration} > now()`,
        ),
      )
      .orderBy(desc(schema.impersonationRequests.accepted_at))
      .limit(1)
    return requests[0] ?? null
  } catch (err) {
    throw handleError(err, "Exception for getActiveImpersonation", {
      admin_id,
      target_principal_id,
    })
  }
}
