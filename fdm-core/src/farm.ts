import { asc, eq, inArray } from "drizzle-orm"
import {
    checkPermission,
    getRolesOfPrincipalForResource,
    grantRole,
    listPrincipalsForResource,
    listResources,
    revokePrincipal,
    updateRole,
} from "./authorization"
import type { PrincipalId, Role } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { removeField } from "./field"
import { createId } from "./id"
import { getPrincipal, identifyPrincipal } from "./principal"
import type { Principal } from "./principal.d"

/**
 * Creates a new farm and assigns the creator as the owner.
 *
 * This function handles the creation of a new farm, including assigning it a unique identifier
 * and setting up the initial ownership permissions.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal creating the farm.
 * @param b_name_farm The name of the new farm.
 * @param b_businessid_farm The business ID of the new farm.
 * @param b_address_farm The address of the new farm.
 * @param b_postalcode_farm The postal code of the new farm.
 * @returns A promise that resolves to the unique identifier of the newly created farm.
 * @throws An error if the database transaction fails.
 */
export async function addFarm(
    fdm: FdmType,
    principal_id: string,
    b_name_farm: schema.farmsTypeInsert["b_name_farm"],
    b_businessid_farm: schema.farmsTypeInsert["b_businessid_farm"],
    b_address_farm: schema.farmsTypeInsert["b_address_farm"],
    b_postalcode_farm: schema.farmsTypeInsert["b_postalcode_farm"],
): Promise<schema.farmsTypeInsert["b_id_farm"]> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            // Generate an ID for the farm
            const b_id_farm = createId()
            // Insert the farm in the db
            const farmData = {
                b_id_farm,
                b_name_farm,
                b_businessid_farm,
                b_address_farm,
                b_postalcode_farm,
            }
            await tx.insert(schema.farms).values(farmData)

            // Grant owner role to farm
            await grantRole(tx, "farm", "owner", b_id_farm, principal_id)

            return b_id_farm
        })
    } catch (err) {
        throw handleError(err, "Exception for addFarm", {
            b_name_farm,
            b_businessid_farm,
            b_address_farm,
            b_postalcode_farm,
        })
    }
}

/**
 * Retrieves a single farm by its unique identifier.
 *
 * This function fetches the details of a farm, including the roles of the current principal
 * and the identifier of the farm's owner.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to a farm object, which includes role and owner information.
 * @throws An error if the principal does not have permission to read the farm's data or if the farm is not found.
 */
export async function getFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<{
    b_id_farm: schema.farmsTypeSelect["b_id_farm"]
    b_name_farm: schema.farmsTypeSelect["b_name_farm"]
    b_businessid_farm: schema.farmsTypeSelect["b_businessid_farm"]
    b_address_farm: schema.farmsTypeSelect["b_address_farm"]
    b_postalcode_farm: schema.farmsTypeSelect["b_postalcode_farm"]
    b_id_principal: PrincipalId
    b_id_principal_owner: PrincipalId
    roles: Role[]
}> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "read",
                b_id_farm,
                principal_id,
                "getFarm",
            )

            const results = await tx
                .select({
                    b_id_farm: schema.farms.b_id_farm,
                    b_name_farm: schema.farms.b_name_farm,
                    b_businessid_farm: schema.farms.b_businessid_farm,
                    b_address_farm: schema.farms.b_address_farm,
                    b_postalcode_farm: schema.farms.b_postalcode_farm,
                })
                .from(schema.farms)
                .where(eq(schema.farms.b_id_farm, b_id_farm))
                .limit(1)

            // Get roles on farm
            const roles = await getRolesOfPrincipalForResource(
                tx,
                "farm",
                b_id_farm,
                principal_id,
            )

            // Get all principals for the farm to find the owner
            const allPrincipals = await listPrincipalsForResource(
                tx,
                "farm",
                b_id_farm,
            )
            const ownerPrincipal = allPrincipals.find((p) => p.role === "owner")

            const farm = {
                ...results[0],
                b_id_principal: principal_id,
                b_id_principal_owner: ownerPrincipal?.principal_id || "", // Fallback if no owner is found
                roles: roles,
            }

            return farm
        })
    } catch (err) {
        throw handleError(err, "Exception for getFarm", { b_id_farm })
    }
}

/**
 * Retrieves all farms that a principal has access to.
 *
 * This function lists all farms for which the principal has read access, including information
 * about the principal's roles on each farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @returns A promise that resolves to an array of farm objects, each including role information.
 */
export async function getFarms(
    fdm: FdmType,
    principal_id: PrincipalId,
): Promise<
    {
        b_id_farm: schema.farmsTypeSelect["b_id_farm"]
        b_name_farm: schema.farmsTypeSelect["b_name_farm"]
        b_businessid_farm: schema.farmsTypeSelect["b_businessid_farm"]
        b_address_farm: schema.farmsTypeSelect["b_address_farm"]
        b_postalcode_farm: schema.farmsTypeSelect["b_postalcode_farm"]
        roles: Role[]
    }[]
> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const resources = await listResources(
                tx,
                "farm",
                "read",
                principal_id,
            )

            if (resources.length === 0) {
                return []
            }

            const results = await tx
                .select({
                    b_id_farm: schema.farms.b_id_farm,
                    b_name_farm: schema.farms.b_name_farm,
                    b_businessid_farm: schema.farms.b_businessid_farm,
                    b_address_farm: schema.farms.b_address_farm,
                    b_postalcode_farm: schema.farms.b_postalcode_farm,
                })
                .from(schema.farms)
                .where(inArray(schema.farms.b_id_farm, resources))
                .orderBy(asc(schema.farms.b_name_farm))

            const farms = await Promise.all(
                results.map(
                    async (farm: {
                        b_id_farm: schema.farmsTypeSelect["b_id_farm"]
                    }) => {
                        // Get roles on farm
                        const roles = await getRolesOfPrincipalForResource(
                            tx,
                            "farm",
                            farm.b_id_farm,
                            principal_id,
                        )

                        return {
                            ...farm,
                            roles: roles,
                        }
                    },
                ),
            )

            return farms
        })
    } catch (err) {
        throw handleError(err, "Exception for getFarms")
    }
}

/**
 * Updates the details of a farm.
 *
 * This function allows for the modification of a farm's properties. It ensures that the principal
 * making the request has the necessary permissions to update the farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm to update.
 * @param b_name_farm The new name for the farm.
 * @param b_businessid_farm The new business ID for the farm.
 * @param b_address_farm The new address for the farm.
 * @param b_postalcode_farm The new postal code for the farm.
 * @returns A promise that resolves to the updated farm object.
 * @throws An error if the principal does not have permission to update the farm or if the database transaction fails.
 */
export async function updateFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    b_name_farm: schema.farmsTypeInsert["b_name_farm"],
    b_businessid_farm: schema.farmsTypeInsert["b_businessid_farm"],
    b_address_farm: schema.farmsTypeInsert["b_address_farm"],
    b_postalcode_farm: schema.farmsTypeInsert["b_postalcode_farm"],
): Promise<schema.farmsTypeSelect> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "updateFarm",
        )
        const updatedFarm = await fdm
            .update(schema.farms)
            .set({
                b_name_farm,
                b_businessid_farm,
                b_address_farm,
                b_postalcode_farm,
                updated: new Date(),
            })
            .where(eq(schema.farms.b_id_farm, b_id_farm))
            .returning({
                b_id_farm: schema.farms.b_id_farm,
                b_name_farm: schema.farms.b_name_farm,
                b_businessid_farm: schema.farms.b_businessid_farm,
                b_address_farm: schema.farms.b_address_farm,
                b_postalcode_farm: schema.farms.b_postalcode_farm,
                created: schema.farms.created,
                updated: schema.farms.updated,
            })

        return updatedFarm[0]
    } catch (err) {
        throw handleError(err, "Exception for updateFarm", {
            b_id_farm,
            b_name_farm,
            b_businessid_farm,
            b_address_farm,
            b_postalcode_farm,
        })
    }
}

/**
 * Grants a role to a principal for a specific farm.
 *
 * This function is used to manage access control for a farm. It ensures that the principal
 * granting the role has the necessary "share" permission.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal granting the role.
 * @param target The identifier of the principal to whom the role is being granted.
 * @param b_id_farm The unique identifier of the farm.
 * @param role The role to grant.
 * @returns A promise that resolves when the role has been successfully granted.
 * @throws An error if the principal does not have permission or if the target principal is not found.
 */
export async function grantRoleToFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    target: string,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    role: "owner" | "advisor" | "researcher",
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "share",
                b_id_farm,
                principal_id,
                "grantRoleToFarm",
            )

            const targetDetails = await identifyPrincipal(tx, target)
            if (!targetDetails) {
                throw new Error("Target not found")
            }

            await grantRole(tx, "farm", role, b_id_farm, targetDetails.id)

            // Check if at least 1 owner is still prestent on this farm
            const owners = await listPrincipalsForResource(
                tx,
                "farm",
                b_id_farm,
            )
            const ownerCount = owners.filter((x) => x.role === "owner").length
            if (ownerCount === 0) {
                throw new Error("Farm should have at least 1 owner")
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for grantRoleToFarm", {
            b_id_farm,
            target,
            role,
        })
    }
}

/**
 * Updates the role of a principal on a specific farm.
 *
 * This function allows for the modification of a principal's role on a farm, which is essential for
 * managing access control.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the change.
 * @param target The identifier of the principal whose role is being updated.
 * @param b_id_farm The unique identifier of the farm.
 * @param role The new role to assign.
 * @returns A promise that resolves when the role has been successfully updated.
 * @throws An error if the principal does not have permission or if the target principal is not found.
 */
export async function updateRoleOfPrincipalAtFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    target: string,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    role: "owner" | "advisor" | "researcher",
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "share",
                b_id_farm,
                principal_id,
                "updateRoleOfPrincipalAtFarm",
            )

            const targetDetails = await identifyPrincipal(tx, target)
            if (!targetDetails) {
                throw new Error("Target not found")
            }

            await updateRole(tx, "farm", role, b_id_farm, targetDetails.id)

            // Check if at least 1 owner is still prestent on this farm
            const owners = await listPrincipalsForResource(
                tx,
                "farm",
                b_id_farm,
            )
            const ownerCount = owners.filter((x) => x.role === "owner").length
            if (ownerCount === 0) {
                throw new Error("Farm should have at least 1 owner")
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for updateRoleOfPrincipalAtFarm", {
            b_id_farm,
            target,
            role,
        })
    }
}

/**
 * Revokes a principal's access to a farm.
 *
 * This function removes a principal's role from a farm, effectively revoking their access.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal revoking the access.
 * @param target The identifier of the principal whose access is being revoked.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves when the principal's access has been successfully revoked.
 * @throws An error if the principal does not have permission or if the target principal is not found.
 */
export async function revokePrincipalFromFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    target: string,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "share",
                b_id_farm,
                principal_id,
                "revokePrincipalFromFarm",
            )
            const targetDetails = await identifyPrincipal(tx, target)
            if (!targetDetails) {
                throw new Error("Target not found")
            }

            await revokePrincipal(tx, "farm", b_id_farm, targetDetails.id)

            // Check if at least 1 owner is still prestent on this farm
            const owners = await listPrincipalsForResource(
                tx,
                "farm",
                b_id_farm,
            )
            const ownerCount = owners.filter((x) => x.role === "owner").length
            if (ownerCount === 0) {
                throw new Error("Farm should have at least 1 owner")
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for revokePrincipalFromFarm", {
            b_id_farm,
            target,
        })
    }
}

/**
 * Lists all principals who have a role on a specific farm.
 *
 * This function retrieves a list of all principals (users and organizations) that have been granted
 * access to a farm, along with their roles.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to an array of `Principal` objects, each with an added `role` property.
 * @throws An error if the principal does not have permission to read the farm's data.
 */
export async function listPrincipalsForFarm(
    fdm: FdmType,
    principal_id: string,
    b_id_farm: string,
): Promise<Principal[]> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            await checkPermission(
                tx,
                "farm",
                "read",
                b_id_farm,
                principal_id,
                "listPrincipalsForFarm",
            )
            const principals = await listPrincipalsForResource(
                tx,
                "farm",
                b_id_farm,
            )

            // Collect details of principals
            const principalsDetails = await Promise.all(
                principals.map(async (principal) => {
                    const details = await getPrincipal(
                        tx,
                        principal.principal_id,
                    )
                    return {
                        ...details,
                        role: principal.role,
                    }
                }),
            )

            return principalsDetails
        })
    } catch (err) {
        throw handleError(err, "Exception for listPrincipalsForFarm", {
            b_id_farm,
        })
    }
}

/**
 * Checks if a principal is allowed to share a farm.
 *
 * This function is a convenience wrapper around `checkPermission` that can be used to quickly
 * determine if a principal has "share" permissions on a farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to `true` if the principal is allowed to share, otherwise `false`.
 */
export async function isAllowedToShareFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<boolean> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "share",
            b_id_farm,
            principal_id,
            "isAllowedToShareFarm",
        )
        return true
    } catch (_err) {
        return false
    }
}

/**
 * Checks if a principal is allowed to delete a farm.
 *
 * This function is a convenience wrapper around `checkPermission` that can be used to quickly
 * determine if a principal has "write" permissions on a farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to `true` if the principal is allowed to delete, otherwise `false`.
 */
export async function isAllowedToDeleteFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<boolean> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "isAllowedToDeleteFarm",
        )
        return true
    } catch (_err) {
        return false
    }
}

/**
 * Deletes a farm and all its associated data.
 *
 * This function performs a cascaded delete of a farm, which includes all its fields, cultivations,
 * fertilizer applications, and other related data. It is a critical operation that should be used with caution.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm to delete.
 * @returns A promise that resolves when the farm has been successfully deleted.
 * @throws An error if the principal does not have permission to delete the farm.
 */
export async function removeFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "removeFarm",
        )

        await fdm.transaction(async (tx: FdmType) => {
            // Step 1: Get all fields for the given farm
            const fields = await tx
                .select({ b_id: schema.fieldAcquiring.b_id })
                .from(schema.fieldAcquiring)
                .where(eq(schema.fieldAcquiring.b_id_farm, b_id_farm))

            // Step 2: Remove each field and its associated data
            if (fields.length > 0) {
                const fieldIds = fields.map(
                    (f: { b_id: schema.fieldsTypeSelect["b_id"] }) => f.b_id,
                )
                for (const fieldId of fieldIds) {
                    await removeField(tx, principal_id, fieldId)
                }
            }

            // Step 3: Delete farm-specific data
            // Get all fertilizer IDs associated with this farm
            const fertilizerIdsToDelete = await tx
                .select({ p_id: schema.fertilizerAcquiring.p_id })
                .from(schema.fertilizerAcquiring)
                .where(eq(schema.fertilizerAcquiring.b_id_farm, b_id_farm))

            // Delete fertilizer acquiring records
            await tx
                .delete(schema.fertilizerAcquiring)
                .where(eq(schema.fertilizerAcquiring.b_id_farm, b_id_farm))

            // Delete fertilizer picking records associated with this farm's custom fertilizers
            await tx
                .delete(schema.fertilizerPicking)
                .where(eq(schema.fertilizerPicking.p_id_catalogue, b_id_farm))

            // Delete fertilizer picking records associated with acquired fertilizers of this farm
            if (fertilizerIdsToDelete.length > 0) {
                const pIds = fertilizerIdsToDelete.map(
                    (f: { p_id: schema.fertilizersTypeSelect["p_id"] }) =>
                        f.p_id,
                )
                await tx
                    .delete(schema.fertilizerPicking)
                    .where(inArray(schema.fertilizerPicking.p_id, pIds))
            }

            // Get all derogation IDs associated with this farm
            const derogationIdsToDelete = await tx
                .select({
                    b_id_derogation: schema.derogationApplying.b_id_derogation,
                })
                .from(schema.derogationApplying)
                .where(eq(schema.derogationApplying.b_id_farm, b_id_farm))

            // Delete derogation applying records
            await tx
                .delete(schema.derogationApplying)
                .where(eq(schema.derogationApplying.b_id_farm, b_id_farm))

            // Delete derogations that were associated with this farm
            if (derogationIdsToDelete.length > 0) {
                const bIdsDerogation = derogationIdsToDelete.map(
                    (d: {
                        b_id_derogation: schema.derogationsTypeSelect["b_id_derogation"]
                    }) => d.b_id_derogation,
                )
                await tx
                    .delete(schema.derogations)
                    .where(
                        inArray(
                            schema.derogations.b_id_derogation,
                            bIdsDerogation,
                        ),
                    )
            }

            // Get all organic certification IDs associated with this farm
            const organicCertificationIdsToDelete = await tx
                .select({
                    b_id_organic:
                        schema.organicCertificationsHolding.b_id_organic,
                })
                .from(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_farm,
                        b_id_farm,
                    ),
                )

            // Delete organic certifications holding records
            await tx
                .delete(schema.organicCertificationsHolding)
                .where(
                    eq(
                        schema.organicCertificationsHolding.b_id_farm,
                        b_id_farm,
                    ),
                )

            // Delete organic certifications that were associated with this farm
            if (organicCertificationIdsToDelete.length > 0) {
                const bIdsOrganic = organicCertificationIdsToDelete.map(
                    (o: {
                        b_id_organic: schema.organicCertificationsTypeSelect["b_id_organic"]
                    }) => o.b_id_organic,
                )
                await tx
                    .delete(schema.organicCertifications)
                    .where(
                        inArray(
                            schema.organicCertifications.b_id_organic,
                            bIdsOrganic,
                        ),
                    )
            }

            await tx
                .delete(schema.intendingGrazing)
                .where(eq(schema.intendingGrazing.b_id_farm, b_id_farm))
            await tx
                .delete(schema.fertilizerCatalogueEnabling)
                .where(
                    eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm),
                )
            await tx
                .delete(schema.cultivationCatalogueSelecting)
                .where(
                    eq(
                        schema.cultivationCatalogueSelecting.b_id_farm,
                        b_id_farm,
                    ),
                )

            // Delete custom fertilizers from the catalogue that belong to this farm
            await tx
                .delete(schema.fertilizersCatalogue)
                .where(eq(schema.fertilizersCatalogue.p_source, b_id_farm))

            // Delete fertilizers if they are no longer associated with any farm
            if (fertilizerIdsToDelete.length > 0) {
                const pIds = fertilizerIdsToDelete.map(
                    (f: { p_id: schema.fertilizersTypeSelect["p_id"] }) =>
                        f.p_id,
                )
                const stillReferencedFertilizers = await tx
                    .select({ p_id: schema.fertilizerAcquiring.p_id })
                    .from(schema.fertilizerAcquiring)
                    .where(inArray(schema.fertilizerAcquiring.p_id, pIds))

                const referencedPIds = new Set(
                    stillReferencedFertilizers.map(
                        (f: { p_id: schema.fertilizersTypeSelect["p_id"] }) =>
                            f.p_id,
                    ),
                )
                const fertilizersToRemove = pIds.filter(
                    (p_id: schema.fertilizersTypeSelect["p_id"]) =>
                        !referencedPIds.has(p_id),
                )

                if (fertilizersToRemove.length > 0) {
                    await tx
                        .delete(schema.fertilizers)
                        .where(
                            inArray(
                                schema.fertilizers.p_id,
                                fertilizersToRemove,
                            ),
                        )
                }
            }

            // Step 4: Revoke all principals from the farm
            const principals = await listPrincipalsForResource(
                tx,
                "farm",
                b_id_farm,
            )
            for (const principal of principals) {
                await revokePrincipal(
                    tx,
                    "farm",
                    b_id_farm,
                    principal.principal_id,
                )
            }

            // Step 5: Finally, delete the farm itself
            await tx
                .delete(schema.farms)
                .where(eq(schema.farms.b_id_farm, b_id_farm))
        })
    } catch (err) {
        throw handleError(err, "Exception for removeFarm", { b_id_farm })
    }
}
