import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getFertilizersType, getFertilizerType } from './fertilizer.d'

/**
 * Retrieves all fertilizers from the catalogue.
 *
 * @param fdm The FDM instance.
 * @returns A Promise that resolves with an array of fertilizer catalogue entries.
 * @alpha
 */
export async function getFertilizersFromCatalogue(fdm: FdmType): Promise<schema.fertilizersCatalogueTypeSelect[]> {

    const fertilizersCatalogue = await fdm
        .select()
        .from(schema.fertilizersCatalogue)

    return fertilizersCatalogue
}

/**
 * Adds a new fertilizer to the catalogue.
 *
 * @param fdm The FDM instance.
 * @param properties The properties of the fertilizer to add.
 * @returns A Promise that resolves when the fertilizer has been added.
 * @throws If adding the fertilizer fails.
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
 * Adds a fertilizer application record to a farm.
 *
 * @param fdm The FDM instance.
 * @param p_id_catalogue The catalogue ID of the fertilizer.
 * @param b_id_farm The ID of the farm.
 * @param p_app_amount The amount of fertilizer applied.
 * @param p_acquiring_date The date the fertilizer was acquired.
 * @returns A Promise that resolves with the ID of the fertilizer application record.
 * @throws If adding the fertilizer application record fails.
 * @alpha
 */
export async function addFertilizer(
    fdm: FdmType,
    p_id_catalogue: schema.fertilizersCatalogueTypeInsert['p_id_catalogue'],
    b_id_farm: schema.fertilizerAcquiringTypeInsert['b_id_farm'],
    p_acquiring_amount: schema.fertilizerAcquiringTypeInsert['p_acquiring_amount'],
    p_acquiring_date: schema.fertilizerAcquiringTypeInsert['p_acquiring_date']
): Promise<schema.fertilizerAcquiringTypeInsert['p_id']> {

    // Generate an ID for the fertilizer
    const p_id = nanoid()

    // Insert the fertilizer in the db
    const fertilizerAcquiringData = {
        b_id_farm: b_id_farm,
        p_id: p_id,
        p_acquiring_amount: p_acquiring_amount,
        p_acquiring_date: p_acquiring_date
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
            throw new Error('Add fertilizer failed with error ' + error)
        }
    })

    return p_id
}

/**
 * Retrieves the details of a specific fertilizer.
 *
 * @param fdm The FDM instance.
 * @param p_id The ID of the fertilizer.
 * @returns A Promise that resolves with the fertilizer details.
 * @throws If retrieving the fertilizer details fails or the fertilizer is not found.
 * @alpha
 */
export async function getFertilizer(fdm: FdmType, p_id: schema.fertilizersTypeSelect['p_id']): Promise<getFertilizerType> {

    // Get properties of the requested fertilizer
    const fertilizer = await fdm
        .select({
            p_id: schema.fertilizers.p_id,
            p_name_nl: schema.fertilizersCatalogue.p_name_nl,
            p_name_en: schema.fertilizersCatalogue.p_name_en,
            p_description: schema.fertilizersCatalogue.p_description,
            p_acquiring_amount: schema.fertilizerAcquiring.p_acquiring_amount,
            p_acquiring_date: schema.fertilizerAcquiring.p_acquiring_date,
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

/**
 * Retrieves all fertilizer available for a given farm.
 *
 * @param fdm The FDM instance.
 * @param b_id_farm The ID of the farm.
 * @returns A Promise that resolves with an array of fertilizer IDs.
 * @alpha
 */
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
 * Removes a fertilizer from a farm.
 *
 * @param fdm The FDM instance.
 * @param p_id The ID of the fertilizer to remove.
 * @returns A Promise that resolves when the fertilizer has been removed.
 * @throws If removing the fertilizer fails.
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
            throw new Error('Remove fertilizer failed with error ' + error)
        }
    })
}

export type FertilizerApplicationType = schema.fertilizerApplicationTypeSelect;

/**
 * Adds a fertilizer application record.
 *
 * @param fdm The FDM instance.
 * @param b_id The ID of the field.
 * @param p_id The ID of the fertilizer.
 * @param p_app_amount The amount of fertilizer applied.
 * @param p_app_method The method of fertilizer application.
 * @param p_app_date The date of fertilizer application.
 * @returns A Promise that resolves with the ID of the fertilizer application record.
 * @throws If adding the fertilizer application record fails.
 */
export async function addFertilizerApplication(
    fdm: FdmType,
    b_id: schema.fertilizerApplicationTypeInsert['b_id'],
    p_id: schema.fertilizerApplicationTypeInsert['p_id'],
    p_app_amount: schema.fertilizerApplicationTypeInsert['p_app_amount'],
    p_app_method: schema.fertilizerApplicationTypeInsert['p_app_method'],
    p_app_date: schema.fertilizerApplicationTypeInsert['p_app_date']
): Promise<schema.fertilizerApplicationTypeInsert['p_app_id']> {
    const p_app_id = nanoid();

    try {
        await fdm.insert(schema.fertilizerApplication).values({
            p_app_id,
            b_id,
            p_id,
            p_app_amount,
            p_app_method,
            p_app_date,
        });
    } catch (error) {
        throw new Error(`Failed to add fertilizer application: ${error}`);
    }

    return p_app_id;
}



/**
 * Updates a fertilizer application record.
 *
 * @param fdm The FDM instance.
 * @param p_app_id The ID of the fertilizer application record to update.
 * @param b_id The ID of the field.
 * @param p_id The ID of the fertilizer.
 * @param p_app_amount The amount of fertilizer applied.
 * @param p_app_method The method of fertilizer application.
 * @param p_app_date The date of fertilizer application.
 * @returns A Promise that resolves when the record has been updated.
 * @throws If updating the record fails.
 */
export async function updateFertilizerApplication(
    fdm: FdmType,
    p_app_id: schema.fertilizerApplicationTypeInsert['p_app_id'],
    b_id: schema.fertilizerApplicationTypeInsert['b_id'],
    p_id: schema.fertilizerApplicationTypeInsert['p_id'],
    p_app_amount: schema.fertilizerApplicationTypeInsert['p_app_amount'],
    p_app_method: schema.fertilizerApplicationTypeInsert['p_app_method'],
    p_app_date: schema.fertilizerApplicationTypeInsert['p_app_date']
): Promise<void> {
    try {
        await fdm
            .update(schema.fertilizerApplication)
            .set({b_id, p_id, p_app_amount, p_app_method, p_app_date})
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id));
    } catch (error) {
        throw new Error(`Failed to update fertilizer application: ${error}`);
    }
}

/**
 * Removes a fertilizer application record.
 *
 * @param fdm The FDM instance.
 * @param p_app_id The ID of the fertilizer application record to remove.
 * @returns A Promise that resolves when the record has been removed.
 * @throws If removing the record fails.
 */
export async function removeFertilizerApplication(
    fdm: FdmType,
    p_app_id: schema.fertilizerApplicationTypeInsert['p_app_id']
): Promise<void> {
    try {
        await fdm
            .delete(schema.fertilizerApplication)
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id));
    } catch (error) {
        throw new Error(`Failed to remove fertilizer application: ${error}`);
    }
}


/**
 * Retrieves a fertilizer application record.
 *
 * @param fdm The FDM instance.
 * @param p_app_id The ID of the fertilizer application record to retrieve.
 * @returns A Promise that resolves with the fertilizer application record, or null if not found.
 * @throws If retrieving the record fails.
 */
export async function getFertilizerApplication(
    fdm: FdmType,
    p_app_id: schema.fertilizerApplicationTypeSelect['p_app_id']
): Promise<FertilizerApplicationType | null> {
    try {
        const result = await fdm
            .select()
            .from(schema.fertilizerApplication)
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id));

        return result[0] || null;
    } catch (error) {
        throw new Error(`Failed to get fertilizer application: ${error}`);
    }
}



/**
 * Retrieves all fertilizer applications for a given field
 *
 * @param fdm The FDM instance.
 * @param b_id The ID of the field.
 * @returns A Promise that resolves with an array of fertilizer application records.
 * @throws If retrieving the records fails.
 */
export async function getFertilizerApplications(
    fdm: FdmType,
    b_id: schema.fertilizerApplicationTypeSelect['b_id'],
): Promise<FertilizerApplicationType[]> {

    try {
        const fertilizerApplications = await fdm
            .select()
            .from(schema.fertilizerApplication)
            .where(eq(schema.fertilizerApplication.b_id, b_id));
        return fertilizerApplications;
    } catch (error) {
        throw new Error(`Failed to get fertilizer applications: ${error}`);
    }
}