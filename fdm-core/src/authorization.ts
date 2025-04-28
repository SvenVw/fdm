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

/**
 * Checks whether the principal is authorized to perform an action on a resource.
 *
 * This function retrieves the valid roles for the specified action and resource, constructs the resource hierarchy,
 * and iterates through the chain to verify if any level grants the required permission for the principal(s). It records
 * the permission check details in the audit log and throws an error if the permission is denied.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The type of resource being accessed.
 * @param action - The action the principal intends to perform.
 * @param resource_id - The unique identifier of the specific resource.
 * @param principal_id - The principal identifier(s); supports a single ID or an array.
 * @param origin - The source origin used for audit logging the permission check.
 * @returns Resolves to true if the principal is permitted to perform the action.
 *
 * @throws {Error} When the principal does not have the required permission.
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
 * Grants a specified role to a principal for a given resource.
 *
 * This function validates that the provided resource and role are allowed. It then generates a unique role identifier and
 * inserts a new role record into the database within a transaction. If the resource or role is invalid, or if the database
 * operation fails, an error is thrown.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The target resource type for which the role is being assigned.
 * @param role - The role to be granted.
 * @param resource_id - The identifier of the resource.
 * @param target_id - The identifier of the principal receiving the role.
 *
 * @throws {Error} If the specified resource or role is invalid or if the database transaction fails.
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
 * Revokes the principal from a specified resource.
 *
 * This function revokes the role of a principal by marking the corresponding record as deleted in the database. It validates
 * that the provided resource is valid, and executes the update within a transaction. If the input
 * values are invalid or if the operation fails, an error is thrown.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The type of the resource from which the role should be revoked.
 * @param resource_id - The identifier of the resource instance.
 * @param target_id - The identifier of the principal whose role is being revoked.
 *
 * @throws {Error} If the resource is invalid, or if the revocation operation fails.
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
 * This function revokes the existing role of the principal on the resource and then grants a new role. It first validates
 * that the provided resource and role are valid. Both the revocation and granting operations are performed within a single
 * transaction to maintain database consistency.
 *
 * @param fdm - The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The type of the resource for which the role should be updated.
 * @param role - The new role to assign.
 * @param resource_id - The identifier of the specific resource.
 * @param target_id - The identifier of the principal whose role is being updated.
 * @returns A promise that resolves when the role has been updated
 * @throws {Error} If the specified resource or role is invalid or if the database transaction fails.
 *
 * @example
 * ```typescript
 * // Example usage of updateRole
 * await updateRole(fdm, "farm", "advisor", "farm123", "user456");
 * ```
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
 * Retrieves a list of resource IDs accessible by a principal for a specified action.
 *
 * This function validates the provided resource and action, retrieves the roles allowed
 * for the action on the resource, and queries the authorization schema to fetch matching
 * resource IDs. The principal identifier is normalized to an array, ensuring multiple
 * identifiers are handled consistently.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The type of resource to check access for.
 * @param action - The action based on which access permissions are determined.
 * @param principal_id - The principal's identifier or an array of identifiers.
 * @returns A promise that resolves to an array of resource IDs that the principal can access.
 * @throws {Error} If the resource or action is invalid or if the database query fails.
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
 * Retrieves a list of principals associated with a specific resource along with their roles.
 *
 * This function queries the database to find all principals that have been granted
 * any role on the given resource. It returns an array of objects, each containing the
 * principal's identifier and the role they possess for that resource.
 *
 * @param fdm - The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The type of the resource to query for associated principals.
 * @param resource_id - The identifier of the specific resource instance.
 * @returns A promise that resolves to an array of objects, each with `principal_id` and `role` properties.
 *   Returns an empty array if no principals are associated with the resource.
 *
 * @throws {Error} If the resource type is invalid or if the database operation fails.
 *
 * @example
 * ```typescript
 * // Example usage to list principals for a specific farm
 * const principals = await listPrincipalsForResource(fdm, "farm", "farm123");
 * if (principals.length > 0) {
 *   console.log("Principals associated with farm123:", principals);
 *   principals.forEach((principal) => {
 *     console.log(`- Principal ID: ${principal.principal_id}, Role: ${principal.role}`);
 *   });
 * } else {
 *   console.log("No principals associated with farm123.");
 * }
 * ```
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
 * Retrieves the roles authorized to perform a specific action on a given resource.
 *
 * This function filters the global permissions array for entries that match the specified
 * resource and include the provided action. It then extracts and returns a flattened list of roles
 * from the matching permission entries.
 *
 * @param action - The action to check permissions for.
 * @param resource - The resource associated with the action.
 * @returns An array of roles permitted to perform the specified action on the resource.
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
 * Constructs a sorted chain of related resources for a provided resource type and identifier.
 *
 * This function retrieves and assembles linked resource information from the database based on the resource type.
 * For supported resource types ("farm", "field", "cultivation", "soil_analysis", "harvesting", "fertilizer_application"),
 * it gathers associated resource identifiers and orders them following the sequence:
 * "farm", "field", "cultivation", "harvesting", "fertilizer_application", "soil_analysis". If the resource is not found,
 * an empty array is returned.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param resource - The type of the resource for which to construct the chain.
 * @param resource_id - The identifier of the resource.
 * @returns A promise that resolves to an array representing the ordered chain of resource beads.
 *
 * @throws {Error} If the resource type is not recognized or if a database error occurs.
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
