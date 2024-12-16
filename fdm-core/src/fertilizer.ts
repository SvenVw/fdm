import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getFertilizerType } from './fertilizer.d'


/**
 * Retrieves all fertilizers from the catalogue.
 *
 * @remarks
 * Performs a direct select query on the fertilizers catalogue table without any filtering.
 *
 * @param fdm - The Fluent Database Manager instance used for database operations
 * @returns A Promise that resolves to an array of fertilizer catalogue entries. Returns an empty array if no entries exist.
 *
 * @alpha
 */
export async function getFertilizersFromCatalogue(fdm: FdmType): Promise<schema.fertilizersCatalogueTypeSelect[]> {

    const fertilizersCatalogue = await fdm
        .select()
        .from(schema.fertilizersCatalogue)

    return fertilizersCatalogue
}


/**
 * Adds a new fertilizer entry to the fertilizers catalogue database.
 *
 * @remarks
 * This function handles the insertion of comprehensive fertilizer data including physical properties,
 * nutrient content, heavy metals, and classification information.
 *
 * @param fdm - Database manager instance for handling the insertion operation
 * @param properties - Object containing fertilizer properties:
 *   - p_id_catalogue - Unique identifier in the catalogue
 *   - p_source - Source of the fertilizer
 *   - p_name_nl - Dutch name of the fertilizer
 *   - p_name_en - English name of the fertilizer
 *   - p_description - Description of the fertilizer
 *   - p_dm - Dry matter content
 *   - p_density - Density of the fertilizer
 *   - p_om - Organic matter content
 *   - p_a - Acid content
 *   - p_hc - Hydraulic conductivity
 *   - p_eom - Effective organic matter
 *   - p_eoc - Effective organic carbon
 *   - Various nutrient contents (p_*_rt) for N, P, K, Mg, Ca, S, etc.
 *   - Heavy metal contents (p_cd_rt, p_pb_rt, etc.)
 *   - Classification flags (p_type_manure, p_type_mineral, p_type_compost)
 * 
 * @throws Will throw an error if the database insertion fails
 * @returns Promise that resolves when the fertilizer has been successfully added
 * 
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
 * Adds a fertilizer application record to a farm with associated acquiring and picking data.
 *
 * @remarks
 * This function performs a database transaction to create three related records:
 * - A base fertilizer record
 * - An acquiring record with amount and date
 * - A picking record linking to the catalogue
 *
 * @param fdm - The Farm Data Manager instance for database operations
 * @param p_id_catalogue - The catalogue identifier of the fertilizer type
 * @param b_id_farm - The identifier of the farm where fertilizer is applied
 * @param p_acquiring_amount - The quantity of fertilizer acquired
 * @param p_acquiring_date - The date when the fertilizer was acquired
 * @returns A Promise resolving to the newly generated fertilizer record ID
 * @throws Error if any part of the transaction fails during insertion
 *
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
 * Retrieves detailed information about a specific fertilizer from the database.
 *
 * @remarks
 * Fetches comprehensive fertilizer data including names, descriptions, acquiring details,
 * picking information, and various chemical composition rates (N, P, K, etc.).
 * The data is joined across multiple tables: fertilizers, fertilizerAcquiring,
 * fertilizerPicking, and fertilizersCatalogue.
 *
 * @param fdm - The database manager instance for executing queries
 * @param p_id - The unique identifier of the fertilizer to retrieve
 * @returns A Promise resolving to a single fertilizer record containing all properties
 * @throws {Error} When the database query fails
 * @throws {Error} When the fertilizer with the specified ID is not found
 *
 * @alpha
 */
export async function getFertilizer(fdm: FdmType, p_id: schema.fertilizersTypeSelect['p_id']): Promise<getFertilizerType> {
    // ... function implementation ...
}


/**
 * Retrieves detailed fertilizer information for a specific farm.
 *
 * @remarks
 * Fetches comprehensive fertilizer data including names, descriptions, acquisition details,
 * and chemical composition (nutrients, heavy metals, etc.) from multiple related tables.
 *
 * @param fdm - The Farm Data Management (FDM) instance for database operations
 * @param b_id_farm - The unique identifier of the farm
 * @returns A Promise resolving to an array of fertilizer objects containing detailed properties
 * including acquisition dates, picking dates, and chemical composition rates
 *
 * @alpha
 */
export async function getFertilizers(fdm: FdmType, b_id_farm: schema.fertilizerAcquiringTypeSelect['b_id_farm']): Promise<getFertilizerType[]> {

    const fertilizers = await fdm
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
        .where(eq(schema.fertilizerAcquiring.b_id_farm, b_id_farm))

    return fertilizers
}


/**
 * Removes a fertilizer and its associated records from the farm database.
 *
 * @remarks
 * This function performs a cascading delete operation within a transaction,
 * removing records from fertilizerAcquiring, fertilizerPicking, and fertilizers tables.
 *
 * @param fdm - The Farm Database Manager instance for database operations
 * @param p_id - The unique identifier of the fertilizer to remove
 * @returns A Promise that resolves when all related fertilizer records are deleted
 * @throws Error when the database operation fails, with the original error message
 *
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
 * Adds a fertilizer application record to the database after validating field and fertilizer existence.
 *
 * @param fdm - The Farm Data Manager (FDM) database instance
 * @param b_id - The unique identifier of the field where fertilizer is applied
 * @param p_id - The unique identifier of the fertilizer product
 * @param p_app_amount - The quantity of fertilizer applied
 * @param p_app_method - The method used for fertilizer application
 * @param p_app_date - The date when the fertilizer was applied
 * @returns A Promise that resolves to the newly created fertilizer application ID (p_app_id)
 * @throws Error if the specified field or fertilizer doesn't exist in the database
 * @throws Error if the database insertion fails, with the original error as the cause
 */
export async function addFertilizerApplication(
    fdm: FdmType,
    b_id: schema.fertilizerApplicationTypeInsert['b_id'],
    p_id: schema.fertilizerApplicationTypeInsert['p_id'],
    p_app_amount: schema.fertilizerApplicationTypeInsert['p_app_amount'],
    p_app_method: schema.fertilizerApplicationTypeInsert['p_app_method'],
    p_app_date: schema.fertilizerApplicationTypeInsert['p_app_date']
): Promise<schema.fertilizerApplicationTypeInsert['p_app_id']> {

    // Validate that the field exists
    const fieldExists = await fdm.select().from(schema.fields).where(eq(schema.fields.b_id, b_id)).limit(1);
    if (fieldExists.length === 0) {
        throw new Error(`Field with b_id ${b_id} does not exist`);
    }

    // Validate that the fertilizer exists
    const fertilizerExists = await fdm.select().from(schema.fertilizers).where(eq(schema.fertilizers.p_id, p_id)).limit(1);
    if (fertilizerExists.length === 0) {
        throw new Error(`Fertilizer with p_id ${p_id} does not exist`);
    }

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
        throw new Error(`Failed to add fertilizer application: ${error instanceof Error ? error.message : String(error)}`, { cause: error });
    }

    return p_app_id;
}




/**
 * Updates an existing fertilizer application record in the database.
 *
 * @param fdm - Database manager instance for executing the update operation
 * @param p_app_id - Unique identifier of the fertilizer application record
 * @param b_id - Field identifier where the fertilizer was applied
 * @param p_id - Fertilizer product identifier
 * @param p_app_amount - Quantity of fertilizer applied
 * @param p_app_method - Method used for applying the fertilizer
 * @param p_app_date - Date when the fertilizer was applied
 * @returns Promise that resolves when the update is complete
 * @throws Error if the database update operation fails
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
            .set({ b_id, p_id, p_app_amount, p_app_method, p_app_date })
            .where(eq(schema.fertilizerApplication.p_app_id, p_app_id));
    } catch (error) {
        throw new Error(`Failed to update fertilizer application: ${error}`);
    }
}


/**
 * Removes a fertilizer application record from the database.
 *
 * @param fdm - The Farm Data Manager (FDM) instance used for database operations
 * @param p_app_id - The unique identifier of the fertilizer application record to remove
 * @returns A Promise that resolves when the record has been successfully deleted
 * @throws Error when the database operation fails, with details about the failure
 *
 * @remarks
 * This function performs a soft delete operation using the FDM's delete method
 * on the fertilizer_application table.
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
 * Retrieves a single fertilizer application record from the database by its ID.
 *
 * @param fdm - The Farm Data Manager (FDM) database instance used for the query
 * @param p_app_id - The unique identifier of the fertilizer application record
 * @returns A Promise that resolves to the fertilizer application record if found, or null if no record exists
 * @throws Error when database query fails, with the original error message included
 *
 * @example
 * ```ts
 * const application = await getFertilizerApplication(fdm, "123");
 * if (application) {
 *   console.log(application);
 * }
 * ```
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
 * Retrieves all fertilizer applications for a given field from the database.
 *
 * @param fdm - The Farm Data Manager (FDM) instance used for database operations
 * @param b_id - The unique identifier of the field to query fertilizer applications for
 * @returns A Promise that resolves to an array of fertilizer application records. Returns an empty array if no records are found
 * @throws Error with message "Failed to get fertilizer applications" if the database query fails
 *
 * @example
 * ```ts
 * const applications = await getFertilizerApplications(fdm, "field123");
 * ```
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