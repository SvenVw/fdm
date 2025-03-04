import { asc, eq, inArray } from "drizzle-orm"
import { createId } from "./id"

import { checkPermission, grantRole, listResources } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"

/**
 * Creates a new farm record and assigns the "owner" role to the specified principal.
 *
 * This function starts a database transaction, generates a unique identifier for the new farm, 
 * inserts the farm details into the database, and then grants the given principal the owner role.
 *
 * @param principal_id - The identifier of the principal creating the farm.
 * @param b_name_farm - The name of the farm.
 * @param b_businessid_farm - The business identifier for the farm.
 * @param b_address_farm - The address of the farm.
 * @param b_postalcode_farm - The postal code associated with the farm.
 *
 * @returns The generated unique identifier for the new farm.
 *
 * @throws {Error} If the transaction fails to create the farm record.
 *
 * @alpha
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
 * Retrieves a farm's details after verifying that the requesting principal has read access.
 *
 * This function checks the principal's permissions before querying the database for the farm identified by the provided ID.
 *
 * @param principal_id - The identifier of the principal making the request.
 * @param b_id_farm - The unique identifier of the farm to retrieve.
 * @returns A Promise that resolves with the farm's details.
 * @throws {Error} If permission checks fail or if an error occurs while retrieving the farm.
 * @alpha
 */
export async function getFarm(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<schema.farmsTypeSelect> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getFarm",
        )

        const farm = await fdm
            .select()
            .from(schema.farms)
            .where(eq(schema.farms.b_id_farm, b_id_farm))
            .limit(1)

        return farm[0]
    } catch (err) {
        throw handleError(err, "Exception for getFarm", { b_id_farm })
    }
}

/**
 * Retrieves a list of farms accessible by the specified principal.
 *
 * This function uses authorization checks to determine which farms the principal is allowed to read, then returns the corresponding farm details ordered by name.
 *
 * @param principal_id - The identifier of the principal requesting access.
 * @returns A Promise that resolves with an array of farm detail objects.
 * @alpha
 */
export async function getFarms(
    fdm: FdmType,
    principal_id: PrincipalId,
): Promise<schema.farmsTypeSelect[]> {
    try {
        const resources = await listResources(fdm, "farm", "read", principal_id)

        const farm = await fdm
            .select()
            .from(schema.farms)
            .where(inArray(schema.farms.b_id_farm, resources))
            .orderBy(asc(schema.farms.b_name_farm))

        return farm
    } catch (err) {
        throw handleError(err, "Exception for getFarms")
    }
}

/**
 * Updates a farm's details after confirming the principal has write access.
 *
 * This function first checks if the specified principal is authorized to update the farm,
 * then updates the farm's name, business ID, address, and postal code along with a new timestamp.
 *
 * @param principal_id - ID of the principal initiating the update.
 * @param b_id_farm - Unique identifier of the farm to update.
 * @param b_name_farm - New name for the farm.
 * @param b_businessid_farm - New business ID for the farm.
 * @param b_address_farm - New address for the farm.
 * @param b_postalcode_farm - New postal code for the farm.
 * @returns A Promise resolving to the updated farm details.
 *
 * @throws {Error} If the principal lacks the necessary write permission or the update operation fails.
 *
 * @alpha
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
