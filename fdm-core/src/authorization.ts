/**
 * @file This file implements the authorization logic for the FDM application.
 *
 * It provides a role-based access control (RBAC) system that is used to determine
 * whether a principal (e.g., a user) is allowed to perform a certain action on a
 * resource (e.g., a farm). The system is based on a set of predefined resources,
 * roles, actions, and permissions.
 */
import { and, eq, inArray, isNull } from "drizzle-orm"
import type {
    Action,
    Permission,
    PrincipalId,
    Resource,
    ResourceBead,
    ResourceChain,
    ResourceId,
    Role,
} from "./authorization.d"
import * as schema from "./db/schema"
import * as authZSchema from "./db/schema-authz"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { createId } from "./id"

/**
 * Defines the types of resources that can be managed by the authorization system.
 * These are the entities upon which permissions can be granted.
 * @public
 */
export const resources: Resource[] = [
    "user",
    "organization",
    "farm",
    "field",
    "cultivation",
    "fertilizer_application",
    "soil_analysis",
    "harvesting",
] as const
/**
 * Defines the roles that can be assigned to principals.
 * Each role is associated with a set of permissions.
 * @public
 */
export const roles: Role[] = ["owner", "advisor", "researcher"] as const
/**
 * Defines the actions that can be performed on resources.
 * These are the operations that are controlled by the authorization system.
 * @public
 */
export const actions: Action[] = ["read", "write", "list", "share"] as const

/**
 * A comprehensive list of permissions that defines which roles can perform which actions on which resources.
 * This is the core of the role-based access control (RBAC) system.
 * @public
 */
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

/**
 * Checks if a principal is authorized to perform a specific action on a resource.
 *
 * This function walks up the resource hierarchy (resource chain) to determine if the principal
 * has the required permissions. It also logs the check in an audit trail.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource being accessed (e.g., "farm", "field").
 * @param action The action being performed (e.g., "read", "write").
 * @param resource_id The unique identifier of the resource.
 * @param principal_id The identifier of the principal (user or system) performing the action.
 * @param origin A string indicating the origin of the request, for auditing purposes.
 * @returns A promise that resolves to `true` if the action is permitted, otherwise throws an error.
 * @throws An error if the permission is denied.
 */
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

/**
 * Retrieves the roles of a principal for a specific resource.
 *
 * This function queries the database to find the roles directly assigned to a principal for a given resource.
 * Note: This function does not currently resolve inherited roles from the resource chain.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource (e.g., "farm", "field").
 * @param resource_id The unique identifier of the resource.
 * @param principal_id The identifier of the principal.
 * @returns A promise that resolves to an array of `Role` strings.
 * @throws An error if the resource type is invalid or the database query fails.
 */
export async function getRolesOfPrincipalForResource(
    fdm: FdmType,
    resource: Resource,
    resource_id: ResourceId,
    principal_id: PrincipalId,
): Promise<Role[]> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }

            // Convert principal_id to array
            const principal_ids = Array.isArray(principal_id)
                ? principal_id
                : [principal_id]

            const result = await tx
                .select({
                    role: authZSchema.role.role,
                })
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        eq(authZSchema.role.resource_id, resource_id),
                        inArray(authZSchema.role.principal_id, principal_ids),
                        isNull(authZSchema.role.deleted),
                    ),
                )

            const roles = result.map((item: { role: string }) => item.role)

            // Make sure no duplicate roles are present
            return [...new Set(roles)]
        })
    } catch (err) {
        throw handleError(err, "Exception for getRolesOfPrincipalForResource", {
            resource: resource,
            resource_id: resource_id,
            principal_id: principal_id,
        })
    }
}

/**
 * Grants a role to a principal for a specific resource.
 *
 * This function assigns a role to a principal, creating an entry in the database. It prevents
 * duplicate roles by checking if the principal already has a role on the resource.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource (e.g., "farm", "field").
 * @param role The role to grant (e.g., "owner", "advisor").
 * @param resource_id The unique identifier of the resource.
 * @param target_id The identifier of the principal to whom the role is being granted.
 * @returns A promise that resolves when the role has been successfully granted.
 * @throws An error if the resource or role type is invalid, or if the principal already has a role.
 */
export async function grantRole(
    fdm: FdmType,
    resource: Resource,
    role: Role,
    resource_id: ResourceId,
    target_id: string,
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

            // Check if principal has already a role on this resource
            const existingRole = await tx
                .select({
                    role_id: authZSchema.role.role_id,
                })
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        eq(authZSchema.role.resource_id, resource_id),
                        eq(authZSchema.role.principal_id, target_id),
                        isNull(authZSchema.role.deleted),
                    ),
                )
                .limit(1)

            if (existingRole.length > 0) {
                throw new Error("Principal already has a role on this resource")
            }

            const role_id = createId()
            const roleData = {
                role_id: role_id,
                resource: resource,
                resource_id: resource_id,
                principal_id: target_id,
                role: role,
            }
            await tx.insert(authZSchema.role).values(roleData)
        })
    } catch (err) {
        throw handleError(err, "Exception for grantRole", {
            resource: resource,
            role: role,
            resource_id: resource_id,
            target_id: target_id,
        })
    }
}

/**
 * Revokes a principal's role from a specific resource.
 *
 * This function performs a soft delete on the role entry, marking it as deleted in the database.
 * This preserves the historical record of the role assignment while effectively removing the permission.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource (e.g., "farm", "field").
 * @param resource_id The unique identifier of the resource.
 * @param target_id The identifier of the principal whose role is being revoked.
 * @returns A promise that resolves when the role has been successfully revoked.
 * @throws An error if the resource type is invalid or the database operation fails.
 */
export async function revokePrincipal(
    fdm: FdmType,
    resource: Resource,
    resource_id: ResourceId,
    target_id: string,
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }

            // Revoke the role
            await tx
                .update(authZSchema.role)
                .set({ deleted: new Date() })
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        eq(authZSchema.role.resource_id, resource_id),
                        eq(authZSchema.role.principal_id, target_id),
                        isNull(authZSchema.role.deleted),
                    ),
                )
        })
    } catch (err) {
        throw handleError(err, "Exception for revokePrincipal", {
            resource: resource,
            resource_id: resource_id,
            principal_id: target_id,
        })
    }
}

/**
 * Updates the role of a principal for a specific resource.
 *
 * This function performs an atomic update by first revoking the principal's existing role and then
 * granting the new role. This ensures that the principal always has a valid role and prevents
 * inconsistencies.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource (e.g., "farm", "field").
 * @param role The new role to assign.
 * @param resource_id The unique identifier of the resource.
 * @param target_id The identifier of the principal whose role is being updated.
 * @returns A promise that resolves with the new role ID upon successful update.
 * @throws An error if the resource or role type is invalid, or if the database transaction fails.
 */
export async function updateRole(
    fdm: FdmType,
    resource: Resource,
    role: Role,
    resource_id: ResourceId,
    target_id: string,
): Promise<string> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }
            if (!roles.includes(role)) {
                throw new Error("Invalid role")
            }

            // Revoke the current role
            await tx
                .update(authZSchema.role)
                .set({ deleted: new Date() })
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        eq(authZSchema.role.resource_id, resource_id),
                        eq(authZSchema.role.principal_id, target_id),
                        isNull(authZSchema.role.deleted),
                    ),
                )

            // Grant the new role
            const role_id = createId()
            const roleData = {
                role_id: role_id,
                resource: resource,
                resource_id: resource_id,
                principal_id: target_id,
                role: role,
            }
            await tx.insert(authZSchema.role).values(roleData)
        })
    } catch (err) {
        throw handleError(err, "Exception for updateRole", {
            resource: resource,
            role: role,
            resource_id: resource_id,
            target_id: target_id,
        })
    }
}

/**
 * Lists the resources that a principal can access for a given action.
 *
 * This function returns a list of resource IDs that the principal is authorized to perform the
 * specified action on. It determines the allowed roles for the action and then queries for
 * all resources where the principal has one of those roles.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource to list (e.g., "farm", "field").
 * @param action The action for which to check permissions (e.g., "read", "write").
 * @param principal_id The identifier of the principal.
 * @returns A promise that resolves to an array of resource IDs.
 * @throws An error if the resource or action type is invalid, or if the database query fails.
 */
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

/**
 * Lists the principals and their roles for a specific resource.
 *
 * This function retrieves all principals that have a direct role assignment on the given resource.
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource (e.g., "farm", "field").
 * @param resource_id The unique identifier of the resource.
 * @returns A promise that resolves to an array of objects, each containing a `principal_id` and their `role`.
 * @throws An error if the resource type is invalid or the database query fails.
 */
export async function listPrincipalsForResource(
    fdm: FdmType,
    resource: Resource,
    resource_id: ResourceId,
): Promise<
    {
        principal_id: string
        role: string
    }[]
> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Validate input
            if (!resources.includes(resource)) {
                throw new Error("Invalid resource")
            }

            return await tx
                .select({
                    principal_id: authZSchema.role.principal_id,
                    role: authZSchema.role.role,
                })
                .from(authZSchema.role)
                .where(
                    and(
                        eq(authZSchema.role.resource, resource),
                        eq(authZSchema.role.resource_id, resource_id),
                        isNull(authZSchema.role.deleted),
                    ),
                )
        })
    } catch (err) {
        throw handleError(err, "Exception for listPrincipalsForResource", {
            resource: resource,
            resource_id: resource_id,
        })
    }
}

/**
 * Retrieves the roles that are permitted to perform a given action on a resource.
 *
 * This function consults the `permissions` array to find all roles that have the
 * specified action allowed for the given resource.
 *
 * @param action The action to check (e.g., "read", "write").
 * @param resource The resource in question (e.g., "farm", "field").
 * @returns An array of `Role` strings that are permitted to perform the action.
 * @internal
 */
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

/**
 * Retrieves the hierarchical chain of resources leading up to a specific resource.
 *
 * This function is crucial for permission checking, as it allows `checkPermission` to walk
 * up the resource hierarchy. For example, a "field" is a sub-resource of a "farm".
 *
 * @param fdm The FDM instance for database access.
 * @param resource The type of resource for which to get the chain.
 * @param resource_id The unique identifier of the resource.
 * @returns A promise that resolves to a `ResourceChain`, which is an array of `ResourceBead` objects.
 * @throws An error if the resource type is not supported or a database error occurs.
 * @internal
 */
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
        const chain: ResourceBead[] = []
        if (resource === "farm") {
            const bead: ResourceBead = {
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
                    resource: x as Resource,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else if (resource === "cultivation") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.cultivationStarting.b_id,
                    cultivation: schema.cultivations.b_lu,
                })
                .from(schema.cultivations)
                .leftJoin(
                    schema.cultivationStarting,
                    eq(
                        schema.cultivations.b_lu,
                        schema.cultivationStarting.b_lu,
                    ),
                )
                .leftJoin(
                    schema.fields,
                    eq(schema.cultivationStarting.b_id, schema.fields.b_id),
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
                    resource: x as Resource,
                    resource_id: result[0][x],
                }
            })
            chain.push(...beads)
        } else if (resource === "harvesting") {
            const result = await fdm
                .select({
                    farm: schema.fieldAcquiring.b_id_farm,
                    field: schema.cultivationStarting.b_id,
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
                    schema.cultivationStarting,
                    eq(
                        schema.cultivations.b_lu,
                        schema.cultivationStarting.b_lu,
                    ),
                )
                .leftJoin(
                    schema.fields,
                    eq(schema.cultivationStarting.b_id, schema.fields.b_id),
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
                    resource: x as Resource,
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
                    resource: x as Resource,
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
                    resource: x as Resource,
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
