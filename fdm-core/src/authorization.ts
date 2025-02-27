import type {
    Permission,
    Resource,
    Role,
    Action,
    PrincipalId,
    ResourceChain,
    ResourceId,
} from "./authorization.d"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import * as schema from "./db/schema"
import * as authZSchema from "./db/schema-authz"
import { and, eq, inArray, isNull } from "drizzle-orm"
import { createId } from "./id"

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

export async function checkPermission(
    fdm: FdmType,
    resource: Resource,
    action: Action,
    resource_id: string,
    principal_id: PrincipalId,
): Promise<void> {
    const start = performance.now()

    let isAllowed = false
    let granting_resource = ""
    let granting_resource_id = ""
    try {
        const roles = getRolesForAction(action, resource)

        const chain = await getResourceChain(fdm, resource, resource_id)

        await fdm.transaction(async (tx: FdmType) => {
            for (const bead of chain) {
                const check = await tx
                    .select({
                        resource_id: authZSchema.role.resource_id,
                    })
                    .from(authZSchema.role)
                    .where(
                        and(eq(authZSchema.role.resource, bead.resource)),
                        eq(authZSchema.role.resource_id, bead.resource_id),
                        inArray(authZSchema.role.principal_id, [
                            ...principal_id,
                        ]),
                        inArray(authZSchema.role.role, roles),
                        isNull(authZSchema.role.deleted),
                    )
                    .limit(1)

                if (check.length > 0) {
                    isAllowed = true
                    granting_resource = bead.resource
                    granting_resource_id = bead.resource_id
                    break
                }
            }

            // Store check in audit
            await tx.insert(authZSchema.audit).values({
                audit_id: createId(),
                principal_id: principal_id,
                target_resource: resource,
                target_resource_id: resource_id,
                granting_resource: granting_resource,
                granting_resource_id: granting_resource_id,
                action: action,
                allowed: isAllowed,
                duration: Math.round(performance.now() - start),
            })
        })
    } catch (err) {
        throw handleError(err, "Exception for checkPermission", {
            resource: resource,
            action: action,
            resource_id: resource_id,
            principal_id: principal_id,
        })
    }

    if (!isAllowed) {
        throw new Error(
            "Principal does not have permission to perform this action",
        )
    }
}

export async function grantRole(
    fdm: FdmType,
    resource: Resource,
    role: Role,
    resource_id: ResourceId,
    principal_id: string,
): Promise<void> {
    try {
        await fdm.transaction(async (tx: FdmType) => {
            const roleData = {
                role_id: createId(),
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

export async function revokeRole(
    fdm: FdmType,
    resource: Resource,
    role: Role,
    resource_id: ResourceId,
    principal_id: string,
): Promise<void> {
    try {
        await fdm.transaction(async (tx: FdmType) => {
            await tx
                .update(authZSchema.role)
                .set({ deleted: new Date() })
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        eq(authZSchema.role.resource_id, resource_id),
                        eq(authZSchema.role.principal_id, principal_id),
                        eq(authZSchema.role.role, role),
                        isNull(authZSchema.role.deleted),
                    ),
                )
        })
    } catch (err) {
        throw handleError(err, "Exception for revoking role", {
            resource: resource,
            role: role,
            resource_id: resource_id,
            principal_id: principal_id,
        })
    }
}

export async function listResources(
    fdm: FdmType,
    resource: Resource,
    action: Action,
    principal_id: PrincipalId,
): Promise<string[]> {
    try {
        // Get the roles for the action
        const roles = getRolesForAction(action, resource)

        // Convert principal_id to array
        const principal_ids = Array.isArray(principal_id)
            ? principal_id
            : [principal_id]

        // Query the resources available
        const resources = await fdm.transaction(async (tx: FdmType) => {
            return await tx
                .select({
                    resource_id: authZSchema.role.resource_id,
                })
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        inArray(authZSchema.role.principal_id, principal_ids),
                        inArray(authZSchema.role.role, roles),
                        isNull(authZSchema.role.deleted),
                    ),
                )
        })
        return resources.map(
            (resource: { resource_id: string }) => resource.resource_id,
        )
    } catch (err) {
        throw handleError(err, "Exception for listing resources", {
            resource: resource,
            action: action,
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

async function getResourceChain(
    fdm: FdmType,
    resource: Resource,
    resource_id: ResourceId,
): Promise<ResourceChain> {
    try {
        const chainOrder = ["farm", "field"]
        const chain = []
        if (resource === "farm") {
            const bead = {
                resource: "farm",
                resource_id: resource_id,
            }
            chain.push(bead)
        } else if (resource === "field") {
            const result = fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.fieldAcquiring.b_id,
                })
                .from(schema.fieldAcquiring)
                .where(eq(schema.fieldAcquiring.b_id, resource_id))
                .limit(1)
            const beads = Object.keys(result[0]).map((x) => {
                return {
                    resource: x,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else {
            throw new Error("Resource is not known")
        }

        // Order the chain by the chainOrder
        chain.sort((a, b) => {
            const indexA = chainOrder.indexOf(a.resource)
            const indexB = chainOrder.indexOf(b.resource)
            return indexA - indexB
        })

        return chain
    } catch (err) {
        throw handleError(err, "Exception for getting resource chain", {
            resource: resource,
            resource_id: resource_id,
        })
    }
}
