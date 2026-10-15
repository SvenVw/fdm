import { checkHelpdeskPermission } from "./authorization"
import { HelpdeskPrincipalId } from "./authorization.types"
import * as schema from "./db/schema-helpdesk"
import { FdmHelpdeskType } from "./fdm-helpdesk.types"
import { ImpersonationRequestFilters } from "./filter.types"

type ImpersonationRequest = schema.ImpersonationRequestTypeSelect

/**
 * Creates an impersonation request for the target principal by the agent. The target principal
 * needs to accept the request before the agent is able to impersonate.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param agent_id ID of the agent making the request.
 * @param target_principal_id ID of the principal the agent is intending to impersonate.
 * @param options Creation options.
 * @returns the impersonation request ID.
 */
export async function requestImpersonation(
  fdm: FdmHelpdeskType,
  agent_id: HelpdeskPrincipalId,
  ticket_id: schema.ImpersonationRequestTypeInsert["ticket_id"],
  target_principal_id: schema.ImpersonationRequestTypeInsert["target_principal_id"],
  options: {
    /** Duration in milliseconds from the time of acceptance the agent will be allowed to impersonate. Defaults to 1 week (604800000ms). */
    duration?: number
    /** What the agent is planning to do while impersonating. */
    goal?: schema.ImpersonationRequestTypeSelect["goal"]
    /** Date and time of expiry for the request. Once the request is accepted it will be valid for the given duration regardless of the expiry date. Defaults to 1 week from now. */
    expires_at?: schema.ImpersonationRequestTypeSelect["goal"]
  },
): Promise<ImpersonationRequest["impersonation_request_id"]> {
  await checkHelpdeskPermission(fdm, "helpdesk", "read", "", agent_id, "requestImpersonation")
}

/**
 * Cancels an impersonation request, and invalidates any active impersonation grant. Has no effect on
 * declined or expired requests, though the cancellation will still be recorded.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param principal_id ID of the principal willing to cancel the request. Must be either an admin agent,
 * the requesting agent, or the target principal.
 * @param impersonation_request_id ID of the request to cancel.
 */
export async function cancelImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: schema.ImpersonationRequestTypeSelect["impersonation_request_id"],
) {}

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
 */
export async function acceptImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: schema.ImpersonationRequestTypeSelect["impersonation_request_id"],
) {}

/**
 * Decline the given impersonation request as the target principal.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param principal_id ID of the principal declining the request. Must match the target principal ID for
 * the request.
 * @param impersonation_request_id ID of the request to decline.
 */
export async function declineImpersonation(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  impersonation_request_id: schema.ImpersonationRequestTypeSelect["impersonation_request_id"],
) {}

/**
 * List the impersonation requests with the given filters.
 *
 * Regular users are only able to list impersonation requests for them. In that case any ID in the
 * targetPrincipals filter other than the user's principal_id will be ignored.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param admin_id The admin identifier(s); must have read permission for the helpdesk.
 * @param filters Filters to apply to the result
 * @returns the list of principal IDs that match the filters.
 */
export async function getImpersonationRequests(
  fdm: FdmHelpdeskType,
  principal_id: HelpdeskPrincipalId,
  filters: ImpersonationRequestFilters,
): Promise<ImpersonationRequest[]> {}

/**
 * Returns the impersonation request row that is between the admin and the target principal,
 * is accepted, and there is still time until the acceptance time plus the duration.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with
 * {@link createFdmServer} of fdm-core.
 * @param admin_id The admin identifier(s); must have read permission for the helpdesk.
 * @param target_principal_id ID of the principal the admin is seeking to impersonate as.
 */
export async function getActiveImpersonation(
  fdm: FdmHelpdeskType,
  admin_id: HelpdeskPrincipalId,
  target_principal_id: HelpdeskPrincipalId,
): Promise<ImpersonationRequest | null> {}
