import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getFertilizersType, getFertilizerType } from './fertilizer.d'

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
    properties: {
        p_id_catalogue: schema.fertilizersCatalogueTypeInsert['p_id_catalogue'],
        p_source: schema.fertilizersCatalogueTypeInsert['p_source'],
        p_name_nl: schema.fertilizersCatalogueTypeInsert['p_name_nl'],
        p_name_en: schema.fertilizersCatalogueTypeInsert['p_name_en'],
        p_description: schema.fertilizersCatalogueTypeInsert['p_description'],
        p_dm: schema.fertilizersCatalogueTypeInsert['p_dm'],
        p_density: schema.fertilizersCatalogueTypeInsert['p_density'],
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
        p_cl_rt: schema.fertilizersCatalogueTypeInsert['p_cl_cr'],
        p_type_manure: schema.fertilizersCatalogueTypeInsert['p_type_manure'],
        p_type_mineral: schema.fertilizersCatalogueTypeInsert['p_type_mineral'],
        p_type_compost: schema.fertilizersCatalogueTypeInsert['p_type_compost']
    }): Promise<void> {

    // Insert the farm in the db
    await fdm
        .insert(schema.fertilizersCatalogue)
        .values(properties)

}

/**
 * Add fertilizer to farm
 *
 * @param fdm - 
 * @param p_id_catalogue - Catalogue id of the fertilizer
 * @param b_id_farm - ID of the farm
 * @param p_amount - Amount of product that is acquired for this field
 * @param p_date_acquiring - Date on which the fertilizer is acquired
 * @returns A Promise that resolves with the if of the fertilizer
 * @alpha
 */
export async function addFertilizer(
    fdm: FdmType,
    p_id_catalogue: schema.fertilizersCatalogueTypeInsert['p_id_catalogue'],
    b_id_farm: schema.fertilizerAcquiringTypeInsert['b_id_farm'],
    p_amount: schema.fertilizerAcquiringTypeInsert['p_amount'],
    p_date_acquiring: schema.fertilizerAcquiringTypeInsert['p_date_acquiring']
): Promise<schema.fertilizerAcquiringTypeInsert['p_id']> {

    // Generate an ID for the fertilizer
    const p_id = nanoid()

    // Insert the fertilizer in the db
    const fertilizerAcquiringData = {
        b_id_farm: b_id_farm,
        p_id: p_id,
        p_amount: p_amount,
        p_date_acquiring: p_date_acquiring
    }

    const fertilizerPickingData = {
        p_id: p_id,
        p_id_catalogue: p_id_catalogue,
        p_picking_date: new Date()
    }

    await fdm.transaction(async (tx: FdmType) => {
        try {

            await tx
                .insert(schema.fertilizers)
                .values({
                    p_id: p_id
                })

            await tx
                .insert(schema.fertilizerAcquiring)
                .values(fertilizerAcquiringData)

            await tx
                .insert(schema.fertilizerPicking)
                .values(fertilizerPickingData)

        } catch (error) {
            tx.rollback()
            throw new Error('Add fertilizer failed with error ' + error)
        }
    })

    return p_id
}

/**
 * Get the details of a fertilizer
 * 
 * @param fdm 
 * @param p_id - ID of requested fertilizer
 * @returns A promise that resolves with properties of requested fertilizer
 */
export async function getFertilizer(fdm: FdmType, p_id: schema.fertilizersTypeSelect['p_id']): Promise<getFertilizerType> {

    // Get properties of the requested fertilizer
    const fertilizer = await fdm
        .select({
            p_id: schema.fertilizers.p_id,
            p_name_nl: schema.fertilizersCatalogue.p_name_nl,
            p_name_en: schema.fertilizersCatalogue.p_name_en,
            p_description: schema.fertilizersCatalogue.p_description,
            p_amount: schema.fertilizerAcquiring.p_amount,
            p_date_acquiring: schema.fertilizerAcquiring.p_date_acquiring,
            p_picking_date: schema.fertilizerPicking.p_picking_date,
            p_n_rt: schema.fertilizersCatalogue.p_n_rt,
            p_n_if: schema.fertilizersCatalogue.p_n_if,
            p_n_of: schema.fertilizersCatalogue.p_n_of,
            p_n_wc: schema.fertilizersCatalogue.p_n_wc,
            p_p_rt: schema.fertilizersCatalogue.p_p_rt,
            p_k_rt: schema.fertilizersCatalogue.p_k_rt,
            p_mg_rt: schema.fertilizersCatalogue.p_mg_rt,
            p_ca_rt: schema.fertilizersCatalogue.p_ca_rt,
            p_ne: schema.fertilizersCatalogue.p_ne,
            p_s_rt: schema.fertilizersCatalogue.p_s_rt,
            p_s_wc: schema.fertilizersCatalogue.p_s_wc,
            p_cu_rt: schema.fertilizersCatalogue.p_cu_rt,
            p_zn_rt: schema.fertilizersCatalogue.p_zn_rt,
            p_na_rt: schema.fertilizersCatalogue.p_na_rt,
            p_si_rt: schema.fertilizersCatalogue.p_si_rt,
            p_b_rt: schema.fertilizersCatalogue.p_b_rt,
            p_mn_rt: schema.fertilizersCatalogue.p_mn_rt,
            p_ni_rt: schema.fertilizersCatalogue.p_ni_rt,
            p_fe_rt: schema.fertilizersCatalogue.p_fe_rt,
            p_mo_rt: schema.fertilizersCatalogue.p_mo_rt,
            p_co_rt: schema.fertilizersCatalogue.p_co_rt,
            p_as_rt: schema.fertilizersCatalogue.p_as_rt,
            p_cd_rt: schema.fertilizersCatalogue.p_cd_rt,
            p_cr_rt: schema.fertilizersCatalogue.p_cr_rt,
            p_cr_vi: schema.fertilizersCatalogue.p_cr_vi,
            p_pb_rt: schema.fertilizersCatalogue.p_pb_rt,
            p_hg_rt: schema.fertilizersCatalogue.p_hg_rt,
            p_cl_cr: schema.fertilizersCatalogue.p_cl_cr
        })
        .from(schema.fertilizers)
        .leftJoin(schema.fertilizerAcquiring, eq(schema.fertilizers.p_id, schema.fertilizerAcquiring.p_id))
        .leftJoin(schema.fertilizerPicking, eq(schema.fertilizers.p_id, schema.fertilizerPicking.p_id))
        .leftJoin(schema.fertilizersCatalogue, eq(schema.fertilizerPicking.p_id_catalogue, schema.fertilizersCatalogue.p_id_catalogue))
        .where(eq(schema.fertilizers.p_id, p_id))
        .limit(1)

    return fertilizer[0]
}

export async function getFertilizers(fdm: FdmType, b_id_farm: schema.fertilizerAcquiringTypeSelect['b_id_farm']): Promise<getFertilizersType[]> {

    const fertilizers = await fdm
        .select({
            p_id: schema.fertilizers.p_id
        })
        .from(schema.fertilizers)
        .leftJoin(schema.fertilizerAcquiring, eq(schema.fertilizers.p_id, schema.fertilizerAcquiring.p_id))
        .where(eq(schema.fertilizerAcquiring.b_id_farm, b_id_farm))


    return fertilizers
}

/**
 * Remove fertilizer from farm
 *
 * @param fdm - 
 * @param p_id - ID of the fertilizer to be remove
 * @returns A Promise that resolves when the fertilizer is removed from the farm
 * @alpha
 */
export async function removeFertilizer(
    fdm: FdmType,
    p_id: schema.fertilizerAcquiringTypeInsert['p_id']
): Promise<void> {

    await fdm.transaction(async (tx: FdmType) => {
        try {
            await tx
                .delete(schema.fertilizerAcquiring)
                .where(eq(schema.fertilizerAcquiring.p_id, p_id))

            await tx
                .delete(schema.fertilizerPicking)
                .where(eq(schema.fertilizerPicking.p_id, p_id))

            await tx
                .delete(schema.fertilizers)
                .where(eq(schema.fertilizers.p_id, p_id))
        }
        catch (error) {
            tx.rollback()
            throw new Error('Remove fertilizer failed with error ' + error)
        }
    })
}