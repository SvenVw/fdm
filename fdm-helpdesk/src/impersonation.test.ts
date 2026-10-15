import { eq, sql } from "drizzle-orm"
import { describe, expect } from "vitest"
import { addAdminAgent, addAgent } from "./agent"
import * as schema from "./db/schema-helpdesk"
import { createId } from "./id"
import {
  acceptImpersonation,
  cancelImpersonation,
  declineImpersonation,
  getActiveImpersonation,
  getImpersonationRequests,
  requestImpersonation,
} from "./impersonation"
import { test, truncateAllTables } from "./test-util"

test.beforeEach(async ({ fdm }) => {
  await truncateAllTables(fdm)
})

describe("Impersonation requests", () => {
  let admin_id: string
  let agent_id: string
  let other_agent_id: string
  let user_id: string
  let other_user_id: string
  let ticket_id: string

  test.beforeEach(async ({ fdm }) => {
    admin_id = createId()
    await addAdminAgent(fdm, admin_id, "Admin Agent")
    agent_id = createId()
    await addAgent(fdm, admin_id, agent_id, "Support Agent")
    other_agent_id = createId()
    await addAgent(fdm, admin_id, other_agent_id, "Other Support Agent")
    user_id = createId()
    other_user_id = createId()
    ticket_id = createId()
  })

  async function getRow(fdm: Parameters<typeof getImpersonationRequests>[0], id: string) {
    const rows = await fdm
      .select()
      .from(schema.impersonationRequests)
      .where(eq(schema.impersonationRequests.impersonation_request_id, id))
    return rows[0]
  }

  async function makeAccepted(fdm: Parameters<typeof getImpersonationRequests>[0], by = agent_id) {
    const id = await requestImpersonation(fdm, by, ticket_id, user_id)
    await acceptImpersonation(fdm, user_id, id)
    return id
  }

  describe("requestImpersonation", () => {
    test("should create a pending request with defaults", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      const row = await getRow(fdm, id)
      expect(row).toMatchObject({
        agent_id,
        ticket_id,
        target_principal_id: user_id,
        status: "pending",
        goal: null,
        accepted_at: null,
        cancelled_at: null,
      })
      expect(row.duration).toMatch(/^(7 days|168:00:00)$/)
      const weekFromNow = Date.now() + 604_800_000
      expect(Math.abs((row.expires_at?.getTime() ?? 0) - weekFromNow)).toBeLessThan(60_000)
    })

    test("should store custom options", async ({ fdm }) => {
      const expires_at = new Date(Date.now() + 3_600_000)
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id, {
        duration: 7_200_000,
        goal: "Check the field list",
        expires_at,
      })
      const row = await getRow(fdm, id)
      expect(row.duration).toBe("02:00:00")
      expect(row.goal).toBe("Check the field list")
      expect(row.expires_at?.getTime()).toBe(expires_at.getTime())
    })

    test("should not let non-agents request impersonation", async ({ fdm }) => {
      await expect(requestImpersonation(fdm, user_id, ticket_id, other_user_id)).rejects.toThrow(
        "Principal does not have permission to perform this action",
      )
    })

    test("should not let agents impersonate themselves", async ({ fdm }) => {
      await expect(requestImpersonation(fdm, agent_id, ticket_id, agent_id)).rejects.toThrow(
        "Exception for requestImpersonation",
      )
    })

    test("should reject non-positive durations", async ({ fdm }) => {
      for (const duration of [0, -1, Number.NaN]) {
        await expect(
          requestImpersonation(fdm, agent_id, ticket_id, user_id, { duration }),
        ).rejects.toThrow("Exception for requestImpersonation")
      }
    })
  })

  describe("acceptImpersonation", () => {
    test("should let the target accept", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await acceptImpersonation(fdm, user_id, id)
      const row = await getRow(fdm, id)
      expect(row.status).toBe("accepted")
      expect(row.accepted_at).toBeInstanceOf(Date)
    })

    test("should not let others accept", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      for (const principal of [other_user_id, agent_id, admin_id]) {
        await expect(acceptImpersonation(fdm, principal, id)).rejects.toThrow(
          "Principal does not have permission to perform this action",
        )
      }
      expect((await getRow(fdm, id)).status).toBe("pending")
    })

    test("should not accept an unknown request", async ({ fdm }) => {
      await expect(acceptImpersonation(fdm, user_id, createId())).rejects.toThrow(
        "Principal does not have permission to perform this action",
      )
    })

    test("should not accept twice", async ({ fdm }) => {
      const id = await makeAccepted(fdm)
      await expect(acceptImpersonation(fdm, user_id, id)).rejects.toThrow(
        "Exception for acceptImpersonation",
      )
    })

    test("should not accept a declined request", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await declineImpersonation(fdm, user_id, id)
      await expect(acceptImpersonation(fdm, user_id, id)).rejects.toThrow(
        "Exception for acceptImpersonation",
      )
    })

    test("should not accept a cancelled request", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await cancelImpersonation(fdm, agent_id, id)
      await expect(acceptImpersonation(fdm, user_id, id)).rejects.toThrow(
        "Exception for acceptImpersonation",
      )
      expect((await getRow(fdm, id)).status).toBe("pending")
    })

    test("should not accept an expired request", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id, {
        expires_at: new Date(Date.now() - 1000),
      })
      await expect(acceptImpersonation(fdm, user_id, id)).rejects.toThrow(
        "Exception for acceptImpersonation",
      )
    })
  })

  describe("declineImpersonation", () => {
    test("should let the target decline", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await declineImpersonation(fdm, user_id, id)
      const row = await getRow(fdm, id)
      expect(row.status).toBe("declined")
      expect(row.accepted_at).toBeNull()
    })

    test("should not let others decline", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      for (const principal of [other_user_id, agent_id, admin_id]) {
        await expect(declineImpersonation(fdm, principal, id)).rejects.toThrow(
          "Principal does not have permission to perform this action",
        )
      }
    })

    test("should only decline pending requests", async ({ fdm }) => {
      const id = await makeAccepted(fdm)
      await expect(declineImpersonation(fdm, user_id, id)).rejects.toThrow(
        "Exception for declineImpersonation",
      )
      expect((await getRow(fdm, id)).status).toBe("accepted")
    })
  })

  describe("cancelImpersonation", () => {
    test("should let the requesting agent, the target and admins cancel", async ({ fdm }) => {
      for (const principal of [agent_id, user_id, admin_id]) {
        const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
        await cancelImpersonation(fdm, principal, id)
        expect((await getRow(fdm, id)).cancelled_at).toBeInstanceOf(Date)
      }
    })

    test("should not let other agents or users cancel", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      for (const principal of [other_agent_id, other_user_id]) {
        await expect(cancelImpersonation(fdm, principal, id)).rejects.toThrow(
          "Principal does not have permission to perform this action",
        )
      }
      expect((await getRow(fdm, id)).cancelled_at).toBeNull()
    })

    test("should invalidate an active impersonation", async ({ fdm }) => {
      const id = await makeAccepted(fdm)
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).not.toBeNull()
      await cancelImpersonation(fdm, user_id, id)
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).toBeNull()
    })

    test("should record cancellation of a declined request and keep its status", async ({
      fdm,
    }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await declineImpersonation(fdm, user_id, id)
      await cancelImpersonation(fdm, agent_id, id)
      const row = await getRow(fdm, id)
      expect(row.status).toBe("declined")
      expect(row.cancelled_at).toBeInstanceOf(Date)
    })

    test("should keep the first cancellation time", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await cancelImpersonation(fdm, agent_id, id)
      const first = (await getRow(fdm, id)).cancelled_at
      await cancelImpersonation(fdm, user_id, id)
      expect((await getRow(fdm, id)).cancelled_at).toEqual(first)
    })

    test("should reject unknown requests", async ({ fdm }) => {
      await expect(cancelImpersonation(fdm, admin_id, createId())).rejects.toThrow(
        "Principal does not have permission to perform this action",
      )
    })
  })

  describe("getImpersonationRequests", () => {
    test("should let agents and admins list every request", async ({ fdm }) => {
      const a = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      const b = await requestImpersonation(fdm, other_agent_id, ticket_id, other_user_id)
      for (const principal of [agent_id, admin_id]) {
        const ids = (await getImpersonationRequests(fdm, principal, {})).map(
          (r) => r.impersonation_request_id,
        )
        expect(ids).toHaveLength(2)
        expect(ids).toEqual(expect.arrayContaining([a, b]))
      }
    })

    test("should only list a user's own requests, ignoring spoofed filters", async ({ fdm }) => {
      const mine = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      await requestImpersonation(fdm, agent_id, ticket_id, other_user_id)
      const result = await getImpersonationRequests(fdm, user_id, {
        targetPrincipals: [other_user_id],
      })
      expect(result.map((r) => r.impersonation_request_id)).toEqual([mine])
    })

    test("should filter by agent, target and dates", async ({ fdm }) => {
      const a = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      const b = await requestImpersonation(fdm, other_agent_id, ticket_id, other_user_id)
      const ids = async (filters: Parameters<typeof getImpersonationRequests>[2]) =>
        (await getImpersonationRequests(fdm, admin_id, filters)).map(
          (r) => r.impersonation_request_id,
        )

      expect(await ids({ agents: [agent_id] })).toEqual([a])
      expect(await ids({ targetPrincipals: [other_user_id] })).toEqual([b])

      await fdm
        .update(schema.impersonationRequests)
        .set({ created: new Date("2020-01-01T00:00:00Z") })
        .where(eq(schema.impersonationRequests.impersonation_request_id, a))
      expect(await ids({ toDate: new Date("2021-01-01T00:00:00Z") })).toEqual([a])
      expect(await ids({ fromDate: new Date("2021-01-01T00:00:00Z") })).toEqual([b])
    })

    test("should paginate newest first", async ({ fdm }) => {
      const created: string[] = []
      for (let i = 0; i < 3; i++) {
        const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
        await fdm
          .update(schema.impersonationRequests)
          .set({ created: sql`now() + ${i} * interval '1 minute'` })
          .where(eq(schema.impersonationRequests.impersonation_request_id, id))
        created.push(id)
      }
      const newestFirst = [...created].reverse()
      const page1 = await getImpersonationRequests(fdm, admin_id, { pageLimit: 2 })
      const page2 = await getImpersonationRequests(fdm, admin_id, { pageLimit: 2, pageOffset: 2 })
      expect(page1.map((r) => r.impersonation_request_id)).toEqual(newestFirst.slice(0, 2))
      expect(page2.map((r) => r.impersonation_request_id)).toEqual(newestFirst.slice(2))
    })
  })

  describe("getActiveImpersonation", () => {
    test("should return null while pending or declined", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id)
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).toBeNull()
      await declineImpersonation(fdm, user_id, id)
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).toBeNull()
    })

    test("should return the accepted request", async ({ fdm }) => {
      const id = await makeAccepted(fdm)
      const active = await getActiveImpersonation(fdm, agent_id, user_id)
      expect(active?.impersonation_request_id).toBe(id)
    })

    test("should not return it for other agents or targets", async ({ fdm }) => {
      await makeAccepted(fdm)
      expect(await getActiveImpersonation(fdm, other_agent_id, user_id)).toBeNull()
      expect(await getActiveImpersonation(fdm, agent_id, other_user_id)).toBeNull()
    })

    test("should return null once the duration has passed", async ({ fdm }) => {
      const id = await requestImpersonation(fdm, agent_id, ticket_id, user_id, {
        duration: 3_600_000,
      })
      await acceptImpersonation(fdm, user_id, id)
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).not.toBeNull()
      await fdm
        .update(schema.impersonationRequests)
        .set({ accepted_at: new Date(Date.now() - 2 * 3_600_000) })
        .where(eq(schema.impersonationRequests.impersonation_request_id, id))
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).toBeNull()
    })

    test("should stay valid after request expiry once accepted", async ({ fdm }) => {
      const id = await makeAccepted(fdm)
      await fdm
        .update(schema.impersonationRequests)
        .set({ expires_at: new Date(Date.now() - 1000) })
        .where(eq(schema.impersonationRequests.impersonation_request_id, id))
      expect(await getActiveImpersonation(fdm, agent_id, user_id)).not.toBeNull()
    })

    test("should return the most recently accepted request", async ({ fdm }) => {
      const first = await makeAccepted(fdm)
      await fdm
        .update(schema.impersonationRequests)
        .set({ accepted_at: new Date(Date.now() - 60_000) })
        .where(eq(schema.impersonationRequests.impersonation_request_id, first))
      const second = await makeAccepted(fdm)
      const active = await getActiveImpersonation(fdm, agent_id, user_id)
      expect(active?.impersonation_request_id).toBe(second)
    })

    test("should require helpdesk read permission", async ({ fdm }) => {
      await expect(getActiveImpersonation(fdm, user_id, other_user_id)).rejects.toThrow(
        "Principal does not have permission to perform this action",
      )
    })
  })
})
