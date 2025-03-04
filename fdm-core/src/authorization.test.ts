import { and, desc, eq, isNotNull, isNull } from "drizzle-orm"
import { beforeEach, describe, expect, inject, it } from "vitest"
import {
    actions,
    checkPermission,
    grantRole,
    listResources,
    resources,
    revokeRole,
    roles,
} from "./authorization"
import * as authZSchema from "./db/schema-authz"
import { addFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { createId } from "./id"

describe("Authorization Functions", () => {
    let fdm: FdmServerType
    let principal_id: string
    let farm_id: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        principal_id = createId()
        farm_id = createId()
        // Create a test farm
        const farmName = "Test Farm"
        const farmBusinessId = "123456"
        const farmAddress = "123 Farm Lane"
        const farmPostalCode = "12345"
        await addFarm(
            fdm,
            farmName,
            farmBusinessId,
            farmAddress,
            farmPostalCode,
            principal_id,
        )
    })

    describe("checkPermission", () => {
        it("should allow access if principal has the required role", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)
            await checkPermission(
                fdm,
                "farm",
                "read",
                farm_id,
                principal_id,
                "test",
            )
        })

        it("should throw an error if principal does not have the required role", async () => {
            await expect(
                checkPermission(
                    fdm,
                    "farm",
                    "read",
                    farm_id,
                    createId(),
                    "test",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error for unknown resource", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)
            await expect(
                checkPermission(
                    fdm,
                    // biome-ignore lint/suspicious/noExplicitAny: Used for testing validation
                    "unknown_resource" as any,
                    "read",
                    farm_id,
                    principal_id,
                    "test",
                ),
            ).rejects.toThrowError("Exception for checkPermission")
        })

        it("should store the audit log when a permission check is performed and allowed", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)
            await checkPermission(
                fdm,
                "farm",
                "read",
                farm_id,
                principal_id,
                "test",
            )

            const auditLogs = await fdm
                .select()
                .from(authZSchema.audit)
                .where(eq(authZSchema.audit.principal_id, principal_id))
                .orderBy(desc(authZSchema.audit.audit_timestamp))
            expect(auditLogs.length).toBeGreaterThanOrEqual(1)
            expect(auditLogs[0].target_resource).toBe("farm")
            expect(auditLogs[0].target_resource_id).toBe(farm_id)
            expect(auditLogs[0].action).toBe("read")
            expect(auditLogs[0].allowed).toBe(true)
        })

        it("should store the audit log when a permission check is performed and not allowed", async () => {
            const principal_id_new = createId()

            await expect(
                checkPermission(
                    fdm,
                    "farm",
                    "read",
                    farm_id,
                    principal_id_new,
                    "test",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )

            const auditLogs = await fdm
                .select()
                .from(authZSchema.audit)
                .where(eq(authZSchema.audit.principal_id, principal_id_new))
                .orderBy(desc(authZSchema.audit.audit_timestamp))
            expect(auditLogs.length).toBeGreaterThanOrEqual(1)
            expect(auditLogs[0].target_resource).toBe("farm")
            expect(auditLogs[0].target_resource_id).toBe(farm_id)
            expect(auditLogs[0].action).toBe("read")
            expect(auditLogs[0].allowed).toBe(false)
        })
    })

    describe("grantRole", () => {
        it("should grant a role to a principal for a resource", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)

            const roles = await fdm
                .select()
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, "farm"),
                        eq(authZSchema.role.resource_id, farm_id),
                        eq(authZSchema.role.principal_id, principal_id),
                        eq(authZSchema.role.role, "owner"),
                        isNull(authZSchema.role.deleted),
                    ),
                )
            expect(roles.length).toBe(1)
        })

        it("should handle non-unique role grants", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)

            const roles = await fdm
                .select()
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, "farm"),
                        eq(authZSchema.role.resource_id, farm_id),
                        eq(authZSchema.role.principal_id, principal_id),
                        eq(authZSchema.role.role, "owner"),
                        isNull(authZSchema.role.deleted),
                    ),
                )

            expect(roles.length).toBe(2)
        })

        it("should throw an error for invalid resource", async () => {
            await expect(
                grantRole(
                    fdm,
                    // biome-ignore lint/suspicious/noExplicitAny: Used for testing validation
                    "unknown_resource" as any,
                    "owner",
                    farm_id,
                    principal_id,
                ),
            ).rejects.toThrowError()
        })

        it("should throw an error for invalid role", async () => {
            await expect(
                grantRole(
                    fdm,
                    "farm",
                    // biome-ignore lint/suspicious/noExplicitAny: Used for testing validation
                    "unknown_role" as any,
                    farm_id,
                    principal_id,
                ),
            ).rejects.toThrowError()
        })

        it("should throw an error for invalid principal_id", async () => {
            await expect(
                // biome-ignore lint/suspicious/noExplicitAny: Used for testing validation
                grantRole(fdm, "farm", "owner", farm_id, null as any),
            ).rejects.toThrowError()
        })
    })

    describe("revokeRole", () => {
        it("should revoke a role from a principal for a resource", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)
            await revokeRole(fdm, "farm", "owner", farm_id, principal_id)

            const roles = await fdm
                .select()
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, "farm"),
                        eq(authZSchema.role.resource_id, farm_id),
                        eq(authZSchema.role.principal_id, principal_id),
                        eq(authZSchema.role.role, "owner"),
                        isNotNull(authZSchema.role.deleted),
                    ),
                )
            expect(roles.length).toBe(1)
        })

        it("should not throw an error when revoking a non-existing role", async () => {
            await revokeRole(fdm, "farm", "owner", farm_id, principal_id)
            const roles = await fdm
                .select()
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, "farm"),
                        eq(authZSchema.role.resource_id, farm_id),
                        eq(authZSchema.role.principal_id, principal_id),
                        eq(authZSchema.role.role, "owner"),
                        isNotNull(authZSchema.role.deleted),
                    ),
                )
            expect(roles.length).toBe(0)
        })

        it("should throw an error for invalid resource", async () => {
            await expect(
                revokeRole(
                    fdm,
                    // biome-ignore lint/suspicious/noExplicitAny: Used for testing validation
                    "unknown_resource" as any,
                    "owner",
                    farm_id,
                    principal_id,
                ),
            ).rejects.toThrowError()
        })

        it("should throw an error for invalid role", async () => {
            await expect(
                revokeRole(
                    fdm,
                    "farm",
                    // biome-ignore lint/suspicious/noExplicitAny: Used for testing validation
                    "unknown_role" as any,
                    farm_id,
                    principal_id,
                ),
            ).rejects.toThrowError()
        })
    })

    describe("listResources", () => {
        it("should list resources a principal has access to", async () => {
            await grantRole(fdm, "farm", "owner", farm_id, principal_id)

            const accessibleResources = await listResources(
                fdm,
                "farm",
                "read",
                principal_id,
            )
            expect(accessibleResources).toContain(farm_id)
        })

        it("should handle multiple roles", async () => {
            const principal_id_new = createId()
            const farm_id2 = createId()
            await grantRole(fdm, "farm", "owner", farm_id, principal_id_new)
            await grantRole(fdm, "farm", "advisor", farm_id2, principal_id_new)

            const accessibleResources = await listResources(
                fdm,
                "farm",
                "read",
                principal_id_new,
            )
            expect(accessibleResources.length).toBe(2)
            expect(accessibleResources).toContain(farm_id)
            expect(accessibleResources).toContain(farm_id2)
        })

        it("should handle empty list", async () => {
            const principal_id_new = createId()
            const accessibleResources = await listResources(
                fdm,
                "farm",
                "read",
                principal_id_new,
            )
            expect(accessibleResources.length).toBe(0)
        })
        it("should handle invalid resource", async () => {
            await expect(
                listResources(
                    fdm,
                    // biome-ignore lint/suspicious/noExplicitAny: Checking validation with unit test
                    "unknown_resource" as any,
                    "read",
                    principal_id,
                ),
            ).rejects.toThrowError()
        })
        it("should handle invalid action", async () => {
            await expect(
                listResources(
                    fdm,
                    "farm",
                    // biome-ignore lint/suspicious/noExplicitAny: Checking validation with unit test
                    "unknown_action" as any,
                    principal_id,
                ),
            ).rejects.toThrowError()
        })
    })

    describe("Authorization Constants", () => {
        it("should have the correct resources", () => {
            expect(resources).toEqual([
                "user",
                "organization",
                "farm",
                "field",
                "cultivation",
                "fertilizer_application",
                "soil_analysis",
                "harvesting",
            ])
        })

        it("should have the correct roles", () => {
            expect(roles).toEqual(["owner", "advisor", "researcher"])
        })

        it("should have the correct actions", () => {
            expect(actions).toEqual(["read", "write", "list", "share"])
        })
    })
})
