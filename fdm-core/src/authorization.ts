import type { Permission, Resource, Role, Action } from "./authorization.d"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import * as authZSchema from "./db/schema-authz"

export const resources: Resource[] = [
    "user",
    "organization",
    "farm",
    "field",
    "cultivation",
    "fertilizer",
    "soil",
    "harvest",
] as const
export const roles: Role[] = ["owner", "advisor", "researcher"] as const
export const actions: Action[] = ["read", "write", "list", "share"] as const

export const permissions: Permission[] = [
    {
        resource: "farm",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "farm",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "farm",
        role: "researcher",
        action: ["read"],
    },
    {
        resource: "user",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "organization",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "organization",
        role: "advisor",
        action: ["read"],
    },
]

export async function grantRole(
    fdm: FdmType,
    resource: Resource,
    role: Role,
    resource_id: string,
    principal_id: string,
) {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const roleData = {
                resource: resource,
                resource_id: resource_id,
                principal_id: principal_id,
                role: role,
            }
            await tx.insert(authZSchema.role).values(roleData)
        })
    } catch (err) {
        throw handleError(err, "Exception for granting role", {
            resource: resource,
            role: role,
            resource_id: resource_id,
            principal_id: principal_id,
        })
    }
}
