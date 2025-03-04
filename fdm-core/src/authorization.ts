import { and, eq, inArray, isNull } from "drizzle-orm"
import type {
    Action,
    Permission,
    PrincipalId,
    Resource,
    ResourceChain,
    ResourceId,
    Role,
} from "./authorization.d"
import * as schema from "./db/schema"
import * as authZSchema from "./db/schema-authz"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { createId } from "./id"

export const resources: Resource[] = [
    "user",
    "organization",
    "farm",
    "field",
    "cultivation",
    "fertilizer_application",
    "soil",
    "harvesting",
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
        resource: "field",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "field",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "field",
        role: "researcher",
        action: ["read"],
    },
    {
        resource: "cultivation",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "cultivation",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "cultivation",
        role: "researcher",
        action: ["read"],
    },
    {
        resource: "harvesting",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "harvesting",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "harvesting",
        role: "researcher",
        action: ["read"],
    },
    {
        resource: "soil_analysis",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "soil_analysis",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "soil_analysis",
        role: "researcher",
        action: ["read"],
    },
    {
        resource: "fertilizer_application",
        role: "owner",
        action: ["read", "write", "list", "share"],
    },
    {
        resource: "fertilizer_application",
        role: "advisor",
        action: ["read", "write", "list"],
    },
    {
        resource: "fertilizer_application",
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
    origin: string,
): Promise<boolean> {
    const start = performance.now()

    let isAllowed = false
    let granting_resource = ""
    let granting_resource_id = ""
    try {
        const roles = getRolesForAction(action, resource)
        const chain = await getResourceChain(fdm, resource, resource_id)

        // Convert principal_id to array
        const principal_ids = Array.isArray(principal_id)
            ? principal_id
            : [principal_id]

        await fdm.transaction(async (tx: FdmType) => {
            for (const bead of chain) {
                const check = await tx
                    .select({
                        resource_id: authZSchema.role.resource_id,
                    })
                    .from(authZSchema.role)
                    .where(
                        and(
                            eq(authZSchema.role.resource, bead.resource),
                            eq(authZSchema.role.resource_id, bead.resource_id),
                            inArray(
                                authZSchema.role.principal_id,
                                principal_ids,
                            ),
                            inArray(authZSchema.role.role, roles),
                            isNull(authZSchema.role.deleted),
                        ),
                    )
                    .limit(1)

                if (check.length > 0) {
                    isAllowed = true
                    granting_resource = bead.resource
                    granting_resource_id = bead.resource_id
                    break
                }
            }
        })

        // Store check in audit
        await fdm.insert(authZSchema.audit).values({
            audit_id: createId(),
            audit_origin: origin,
            principal_id: principal_id,
            target_resource: resource,
            target_resource_id: resource_id,
            granting_resource: granting_resource,
            granting_resource_id: granting_resource_id,
            action: action,
            allowed: isAllowed,
            duration: Math.round(performance.now() - start),
        })

        if (!isAllowed) {
            throw new Error("Permission denied")
        }

        return isAllowed
    } catch (err) {
        let message = "Exception for checkPermission"
        if (err instanceof Error && err.message === "Permission denied") {
            message =
                "Principal does not have permission to perform this action"
        }
        throw handleError(err, message, {
            resource: resource,
            action: action,
            resource_id: resource_id,
            principal_id: principal_id,
        })
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
        return await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }
            if (!roles.includes(role)) {
                throw new Error("Invalid role")
            }

            const role_id = createId()
            const roleData = {
                role_id: role_id,
                resource: resource,
                resource_id: resource_id,
                principal_id: principal_id,
                role: role,
            }
            await tx.insert(authZSchema.role).values(roleData)

            return role_id
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
        return await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }
            if (!roles.includes(role)) {
                throw new Error("Invalid role")
            }

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
        const result = await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }
            if (!actions.includes(action)) {
                throw new Error("Invalid action")
            }

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
        return result.map(
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
        const chainOrder = [
            "farm",
            "field",
            "cultivation",
            "harvesting",
            "fertilizer_application",
            "soil_analysis",
        ]
        const chain = []
        if (resource === "farm") {
            const bead = {
                resource: "farm",
                resource_id: resource_id,
            }
            chain.push(bead)
        } else if (resource === "field") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.fieldAcquiring.b_id,
                })
                .from(schema.fieldAcquiring)
                .where(eq(schema.fieldAcquiring.b_id, resource_id))
                .limit(1)
            if (result.length === 0) {
                // Resource not found, return empty chain
                return []
            }
            const beads = Object.keys(result[0]).map((x) => {
                return {
                    resource: x,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else if (resource === "cultivation") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.fieldSowing.b_id,
                    cultivation: schema.cultivations.b_lu,
                })
                .from(schema.cultivations)
                .leftJoin(
                    schema.fieldSowing,
                    eq(schema.cultivations.b_lu, schema.fieldSowing.b_lu),
                )
                .leftJoin(
                    schema.fields,
                    eq(schema.fieldSowing.b_id, schema.fields.b_id),
                )
                .leftJoin(
                    schema.fieldAcquiring,
                    eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
                )
                .where(eq(schema.cultivations.b_lu, resource_id))
                .limit(1)
            if (result.length === 0) {
                // Resource not found, return empty chain
                return []
            }
            const beads = Object.keys(result[0]).map((x) => {
                return {
                    resource: x,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else if (resource === "harvesting") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.fieldSowing.b_id,
                    cultivation: schema.cultivationHarvesting.b_lu,
                    harvesting: schema.cultivationHarvesting.b_id_harvesting,
                })
                .from(schema.cultivationHarvesting)
                .leftJoin(
                    schema.cultivations,
                    eq(
                        schema.cultivationHarvesting.b_lu,
                        schema.cultivations.b_lu,
                    ),
                )
                .leftJoin(
                    schema.fieldSowing,
                    eq(schema.cultivations.b_lu, schema.fieldSowing.b_lu),
                )
                .leftJoin(
                    schema.fields,
                    eq(schema.fieldSowing.b_id, schema.fields.b_id),
                )
                .leftJoin(
                    schema.fieldAcquiring,
                    eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
                )
                .where(
                    eq(
                        schema.cultivationHarvesting.b_id_harvesting,
                        resource_id,
                    ),
                )
                .limit(1)
            if (result.length === 0) {
                // Resource not found, return empty chain
                return []
            }
            const beads = Object.keys(result[0]).map((x) => {
                return {
                    resource: x,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else if (resource === "fertilizer_application") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.fertilizerApplication.b_id,
                    fertilizer_application:
                        schema.fertilizerApplication.p_app_id,
                })
                .from(schema.fertilizerApplication)
                .leftJoin(
                    schema.fields,
                    eq(schema.fertilizerApplication.b_id, schema.fields.b_id),
                )
                .leftJoin(
                    schema.fieldAcquiring,
                    eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
                )
                .where(eq(schema.fertilizerApplication.p_app_id, resource_id))
                .limit(1)
            if (result.length === 0) {
                // Resource not found, return empty chain
                return []
            }
            const beads = Object.keys(result[0]).map((x) => {
                return {
                    resource: x,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else if (resource === "soil_analysis") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.soilSampling.b_id,
                    soil_analysis: schema.soilAnalysis.a_id,
                })
                .from(schema.soilAnalysis)
                .leftJoin(
                    schema.soilSampling,
                    eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id),
                )
                .leftJoin(
                    schema.fields,
                    eq(schema.soilSampling.b_id, schema.fields.b_id),
                )
                .leftJoin(
                    schema.fieldAcquiring,
                    eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
                )
                .where(eq(schema.soilAnalysis.a_id, resource_id))
                .limit(1)
            if (result.length === 0) {
                // Resource not found, return empty chain
                return []
            }
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
