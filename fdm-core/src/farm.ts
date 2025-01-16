import { asc, eq } from "drizzle-orm"
import { createId } from "./id"

import * as schema from "./db/schema"
import type { FdmType } from "./fdm"

/**
 * Add a new farm.
 *
 * @param b_name_farm - Name of the farm
 * @param b_businessid_farm - Business ID of the farm
 * @param b_address_farm - Address of the farm
 * @param b_postalcode_farm - Postal code of the farm
 * @returns A Promise that resolves when the farm has been added and returns the value for b_id_farm
 * @alpha
 */
export async function addFarm(
    fdm: FdmType,
    b_name_farm: schema.farmsTypeInsert["b_name_farm"],
    b_businessid_farm: schema.farmsTypeInsert["b_businessid_farm"],
    b_address_farm: schema.farmsTypeInsert["b_address_farm"],
    b_postalcode_farm: schema.farmsTypeInsert["b_postalcode_farm"],
): Promise<schema.farmsTypeInsert["b_id_farm"]> {
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
    await fdm.insert(schema.farms).values(farmData)

    return b_id_farm
}

/**
 * Get the details of a specific farm.
 *
 * @param b_id_farm - The id of the farm to be requested.
 * @returns A Promise that resolves with an object that contains the details of a farm.
 * @alpha
 */
export async function getFarm(
    fdm: FdmType,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
): Promise<schema.farmsTypeSelect> {
    const farm = await fdm
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.b_id_farm, b_id_farm))
        .limit(1)

    return farm[0]
}

/**
 * Get a list of farms and their details
 *
 * @returns A Promise that resolves with a array of objecta that contain the details of the farms.
 * @alpha
 */
export async function getFarms(
    fdm: FdmType,
): Promise<schema.farmsTypeSelect[]> {
    const farm = await fdm.select().from(schema.farms).orderBy(asc(schema.farms.b_name_farm))

    return farm
}

/**
 * Update the details of a farm.
 *
 * @param b_id_farm - The id of the farm to be updated.
 * @param b_name_farm - The new value for the name of the farm.
 * @param b_businessid_farm - The new value for the business ID of the farm.
 * @param b_address_farm - The new value for the address of the farm.
 * @param b_postalcode_farm - The new value for the postal code of the farm.
 * @returns A Promise that resolves with an object that contains the details of a farm.
 * @alpha
 */
export async function updateFarm(
    fdm: FdmType,
    b_id_farm: schema.farmsTypeInsert["b_id_farm"],
    b_name_farm: schema.farmsTypeInsert["b_name_farm"],
    b_businessid_farm: schema.farmsTypeInsert["b_businessid_farm"],
    b_address_farm: schema.farmsTypeInsert["b_address_farm"],
    b_postalcode_farm: schema.farmsTypeInsert["b_postalcode_farm"],
): Promise<schema.farmsTypeSelect> {
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
}
