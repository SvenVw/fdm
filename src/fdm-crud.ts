import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type getFieldType, type FdmType } from './fdm-crud.d'

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
    const b_id_farm = nanoid()

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

/**
 * Add a new field
 *
 * @param b_id_farm - ID of the farm.
 * @param b_name - Name of the field.
 * @param b_manage_start - Start date of managing field.
 * @param b_manage_end - End date of managing field.
 * @param b_manage_type - Type of managing field.
 * @returns A Promise that resolves when the field has been added and returns the value for b_id.
 * @alpha
 */
export async function addField(fdm: FdmType, b_id_farm: schema.farmManagingTypeInsert['b_id_farm'],
    b_name: schema.fieldsTypeInsert['b_name'], b_manage_start: schema.farmManagingTypeInsert['b_manage_start'], b_manage_end: schema.farmManagingTypeInsert['b_manage_end'], b_manage_type: schema.farmManagingTypeInsert['b_manage_type']): Promise<schema.fieldsTypeInsert['b_id']> {
    // Generate an ID for the field
    const b_id = nanoid()

    // Insert field
    const fieldData = {
        b_id,
        b_name
    }
    await fdm
        .insert(schema.fields)
        .values(fieldData)

    // Insert relation between farm and field
    const farmManagingData = {
        b_id,
        b_id_farm,
        b_manage_start,
        b_manage_end,
        b_manage_type
    }
    await fdm
        .insert(schema.farmManaging)
        .values(farmManagingData)

    return b_id
}

/**
* Get the details of a specific field.
*
* @param b_id - The id of the field to be requested.
* @returns A Promise that resolves with an object that contains the details of a field.
* @alpha
*/
export async function getField(fdm: FdmType, b_id: schema.fieldsTypeSelect['b_id']): Promise<getFieldType> {
    // Get properties of the requested field
    const field = await fdm
        .select({
            b_id: schema.fields.b_id,
            b_name: schema.fields.b_name,
            b_id_farm: schema.farmManaging.b_id_farm,
            b_manage_start: schema.farmManaging.b_manage_start,
            b_manage_end: schema.farmManaging.b_manage_end,
            b_manage_type: schema.farmManaging.b_manage_type,
            created: schema.fields.created,
            updated: schema.fields.updated
        })
        .from(schema.fields)
        .innerJoin(schema.farmManaging, eq(schema.fields.b_id, schema.farmManaging.b_id))
        .where(eq(schema.fields.b_id, b_id))
        .limit(1)

    return field[0]
}

/**
 * Update the details of a field
 *
 * @param b_id - ID of the field.
 * @param b_name - Name of the field.
 * @param b_manage_start - Start date of managing field.
 * @param b_manage_end - End date of managing field.
 * @param b_manage_type - Type of managing field.
 * @returns A Promise that resolves when the field has been added and returns the value for b_id.
 * @alpha
 */
export async function updateField(fdm: FdmType, b_id: schema.fieldsTypeInsert['b_id'],
    b_name: schema.fieldsTypeInsert['b_name'], b_manage_start: schema.farmManagingTypeInsert['b_manage_start'], b_manage_end: schema.farmManagingTypeInsert['b_manage_end'], b_manage_type: schema.farmManagingTypeInsert['b_manage_type']): Promise<getFieldType> {
    const updatedField = await fdm.transaction(async (tx: FdmType) => {
        try {
            await tx.update(schema.fields)
                .set({
                    b_name,
                    updated: new Date()
                })
                .where(eq(schema.fields.b_id, b_id))

            await tx.update(schema.farmManaging)
                .set({
                    b_manage_start,
                    b_manage_end,
                    b_manage_type,
                    updated: new Date()
                })
                .where(eq(schema.farmManaging.b_id, b_id))

            const field = await tx
                .select({
                    b_id: schema.fields.b_id,
                    b_name: schema.fields.b_name,
                    b_id_farm: schema.farmManaging.b_id_farm,
                    b_manage_start: schema.farmManaging.b_manage_start,
                    b_manage_end: schema.farmManaging.b_manage_end,
                    b_manage_type: schema.farmManaging.b_manage_type,
                    created: schema.fields.created,
                    updated: schema.fields.updated
                })
                .from(schema.fields)
                .innerJoin(schema.farmManaging, eq(schema.fields.b_id, schema.farmManaging.b_id))
                .where(eq(schema.fields.b_id, b_id))
                .limit(1)
            return field[0]
        } catch (error) {
            tx.rollback()
            throw new Error('Update of field failed with error ' + error)
        }
    })

    return updatedField
}

/**
 * Get fertilizers available in catalogue
 *
 * @param fdm - 
 * @returns A Promise that resolves with an array of fertilizers and the details.
 * @alpha
 */
export async function getFertilizersFromCatalogue(fdm: FdmType): Promise<schema.fertilizersCatalogueTypeSelect[]> {

    const fertilizersCatalogue = await fdm
        .select()
        .from(schema.fertilizersCatalogue)

    return fertilizersCatalogue
}

/**
 * Add fertilizer to the catalogue
 *
 * @param fdm - 
 * @returns A Promise that resolves with the catalogue id of the fertilizer
 * @alpha
 */
export async function addFertilizerToCatalogue(
    fdm: FdmType,
    p_source: schema.fertilizersCatalogueTypeInsert['p_source'],
    p_name_nl: schema.fertilizersCatalogueTypeInsert['p_name_nl'],
    p_name_en: schema.fertilizersCatalogueTypeInsert['p_name_en'],
    p_description: schema.fertilizersCatalogueTypeInsert['p_description'],
    properties: {
        p_dm: schema.fertilizersCatalogueTypeInsert['p_dm'],
        p_om: schema.fertilizersCatalogueTypeInsert['p_om'],
        p_a: schema.fertilizersCatalogueTypeInsert['p_a'],
        p_hc: schema.fertilizersCatalogueTypeInsert['p_hc'],
        p_eom: schema.fertilizersCatalogueTypeInsert['p_eom'],
        p_eoc: schema.fertilizersCatalogueTypeInsert['p_eoc'],
        p_c_rt: schema.fertilizersCatalogueTypeInsert['p_c_rt'],
        p_c_of: schema.fertilizersCatalogueTypeInsert['p_c_of'],
        p_c_if: schema.fertilizersCatalogueTypeInsert['p_c_if'],
        p_c_fr: schema.fertilizersCatalogueTypeInsert['p_c_fr'],
        p_cn_of: schema.fertilizersCatalogueTypeInsert['p_cn_of'],
        p_n_rt: schema.fertilizersCatalogueTypeInsert['p_n_rt'],
        p_n_if: schema.fertilizersCatalogueTypeInsert['p_n_if'],
        p_n_of: schema.fertilizersCatalogueTypeInsert['p_n_of'],
        p_n_wc: schema.fertilizersCatalogueTypeInsert['p_n_wc'],
        p_p_rt: schema.fertilizersCatalogueTypeInsert['p_p_rt'],
        p_k_rt: schema.fertilizersCatalogueTypeInsert['p_k_rt'],
        p_mg_rt: schema.fertilizersCatalogueTypeInsert['p_mg_rt'],
        p_ca_rt: schema.fertilizersCatalogueTypeInsert['p_ca_rt'],
        p_ne: schema.fertilizersCatalogueTypeInsert['p_ne'],
        p_s_rt: schema.fertilizersCatalogueTypeInsert['p_s_rt'],
        p_s_wc: schema.fertilizersCatalogueTypeInsert['p_s_wc'],
        p_cu_rt: schema.fertilizersCatalogueTypeInsert['p_cu_rt'],
        p_zn_rt: schema.fertilizersCatalogueTypeInsert['p_zn_rt'],
        p_na_rt: schema.fertilizersCatalogueTypeInsert['p_na_rt'],
        p_si_rt: schema.fertilizersCatalogueTypeInsert['p_si_rt'],
        p_b_rt: schema.fertilizersCatalogueTypeInsert['p_b_rt'],
        p_mn_rt: schema.fertilizersCatalogueTypeInsert['p_mn_rt'],
        p_ni_rt: schema.fertilizersCatalogueTypeInsert['p_ni_rt'],
        p_fe_rt: schema.fertilizersCatalogueTypeInsert['p_fe_rt'],
        p_mo_rt: schema.fertilizersCatalogueTypeInsert['p_mo_rt'],
        p_co_rt: schema.fertilizersCatalogueTypeInsert['p_co_rt'],
        p_as_rt: schema.fertilizersCatalogueTypeInsert['p_as_rt'],
        p_cd_rt: schema.fertilizersCatalogueTypeInsert['p_cd_rt'],
        pr_cr_rt: schema.fertilizersCatalogueTypeInsert['p_cr_rt'],
        p_cr_vi: schema.fertilizersCatalogueTypeInsert['p_cr_vi'],
        p_pb_rt: schema.fertilizersCatalogueTypeInsert['p_pb_rt'],
        p_hg_rt: schema.fertilizersCatalogueTypeInsert['p_hg_rt'],
        p_cl_rt: schema.fertilizersCatalogueTypeInsert['p_cl_cr']
    }): Promise<schema.fertilizersCatalogueTypeInsert['p_id_catalogue']> {

    // Generate an ID for the farm
    const p_id_catalogue = nanoid()

    // Insert the farm in the db
    const fertilizerData = {
        p_id_catalogue: p_id_catalogue,
        p_source: p_source,
        p_name_nl: p_name_nl,
        p_name_en: p_name_en,
        p_description: p_description,
        ...properties
    }

    await fdm
        .insert(schema.fertilizersCatalogue)
        .values(fertilizerData)

    return p_id_catalogue

}