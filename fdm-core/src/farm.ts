import { eq } from 'drizzle-orm'
import { createId } from './id'

import * as schema from './db/schema'
import { type FdmType } from './fdm'

/**
* Add a new farm.
*
* @param b_name_farm - Name of the farm
* @param b_sector - Sector(s) for which the farm is active
* @returns A Promise that resolves when the farm has been added and returns the value for b_id_farm
* @alpha
*/
export async function addFarm(fdm: FdmType, b_name_farm: schema.farmsTypeInsert['b_name_farm'], b_sector: schema.farmsTypeInsert['b_sector']): Promise<schema.farmsTypeInsert['b_id_farm']> {
    // Generate an ID for the farm
    const b_id_farm = createId()

    // Insert the farm in the dab
    const farmData = {
        b_id_farm,
        b_name_farm,
        b_sector
    }
    await fdm
        .insert(schema.farms)
        .values(farmData)

    return b_id_farm
}

/**
* Get the details of a specific farm.
*
* @param b_id_farm - The id of the farm to be requested.
* @returns A Promise that resolves with an object that contains the details of a farm.
* @alpha
*/
export async function getFarm(fdm: FdmType, b_id_farm: schema.farmsTypeInsert['b_id_farm']): Promise<schema.farmsTypeSelect> {
    const farm = await fdm
        .select()
        .from(schema.farms)
        .where(eq(schema.farms.b_id_farm, b_id_farm))
        .limit(1)

    return farm[0]
}

/**
* Update the details of a farm.
*
* @param b_id_farm - The id of the farm to be updated.
* @param b_name_farm - The new value for the name of the farm.
* @param b_sector - The new list of sectors for which this farm is active.
* @returns A Promise that resolves with an object that contains the details of a farm.
* @alpha
*/
export async function updateFarm(fdm: FdmType, b_id_farm: schema.farmsTypeInsert['b_id_farm'], b_name_farm: schema.farmsTypeInsert['b_name_farm'], b_sector: schema.farmsTypeInsert['b_sector']): Promise<schema.farmsTypeSelect> {
    const updatedFarm = await fdm
        .update(schema.farms)
        .set({
            b_name_farm,
            b_sector,
            updated: new Date()
        })
        .where(eq(schema.farms.b_id_farm, b_id_farm))
        .returning({
            b_id_farm: schema.farms.b_id_farm,
            b_name_farm: schema.farms.b_name_farm,
            b_sector: schema.farms.b_sector,
            created: schema.farms.created,
            updated: schema.farms.updated
        })

    return updatedFarm[0]
}