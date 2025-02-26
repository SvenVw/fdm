import type { Permission, Resource, Role, Action } from "./authorization.d"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import * as authZSchema from "./db/schema-authz"
import { and, eq, inArray, isNull } from "drizzle-orm"

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

function getRolesForAction(action: Action, resource: Resource): Role[] {
    const roles = permissions.filter((permission) => {
        return (
            permission.resource === resource &&
            permission.action.includes(action)
        )
    })

    const rolesFlat = roles.flatMap((role) => {
        return role.role
    })

    return rolesFlat
}

export async function listResources(
    fdm: FdmType,
    resource: Resource,
    action: Action,
    principal_id: string,
): Promise<string[]> {
    try {
        const roles = getRolesForAction(action, resource)

        const resources = await fdm.transaction(async (tx: FdmType) => {
            await tx
                .select({
                    resource_id: authZSchema.role.resource_id,
                })
                .from(authZSchema.role)
                .where(
                    and(eq(authZSchema.role.resource, resource)),
                    eq(authZSchema.role.principal_id, principal_id),
                    inArray(authZSchema.role.role, roles),
                    isNull(authZSchema.role.deleted),
                )
        })

        return resources.map((resource: { resource_id: string }) => resource.resource_id)
    } catch (err) {
        throw handleError(err, "Exception for listing resources", {
            resource: resource,
            principal_id: principal_id,
        })
    }
}
