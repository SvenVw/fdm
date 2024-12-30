import { desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getSoilAnalysisType } from './soil.d'

/**
 * Adds a new soil analysis record along with its associated soil sampling details.
 * 
 * @remarks
 * This function performs a transactional database operation to insert both soil analysis and sampling records.
 * It generates unique identifiers for the analysis and sampling records using nanoid.
 * 
 * @param fdm - The database transaction manager instance
 * @param a_date - The date of the soil analysis
 * @param a_source - The origin or method of soil analysis data collection
 * @param b_id - The unique identifier of the field where the soil sample was collected
 * @param b_depth - The depth at which the soil sample was taken
 * @param b_sampling_date - The date when the soil sample was collected
 * @param soilAnalysisData - Optional additional soil analysis parameters
 * 
 * @returns The unique identifier of the newly created soil analysis record
 * 
 * @throws {Error} If the database transaction fails during record insertion
 * 
 * @example
 * ```typescript
 * const newAnalysisId = await addSoilAnalysis(
 *   fdmInstance, 
 *   new Date(), 
 *   'Lab Analysis', 
 *   'field123', 
 *   '0-30cm', 
 *   new Date(),
 *   { ph: 6.5, nitrogen: 45 }
 * )
 * ```
 */
export async function addSoilAnalysis(
    fdm: FdmType,
    a_date: schema.soilAnalysisTypeInsert['a_date'],
    a_source: schema.soilAnalysisTypeInsert['a_source'],
    b_id: schema.soilSamplingTypeInsert['b_id'],
    b_depth: schema.soilSamplingTypeInsert['b_depth'],
    b_sampling_date: schema.soilSamplingTypeInsert['b_sampling_date'],
    // b_sampling_geometry: schema.soilSamplingTypeInsert['b_sampling_geometry'],
    soilAnalysisData?: Partial<schema.soilAnalysisTypeInsert>
): Promise<schema.soilAnalysisTypeSelect['a_id']> {

    const a_id = nanoid()
    const b_id_sampling = nanoid()

    await fdm.transaction(async (tx: FdmType) => {
        try {

            // Insert soil analysis data
            await tx
                .insert(schema.soilAnalysis)
                .values({
                    a_id: a_id,
                    a_date: a_date,
                    a_source: a_source,
                    ...soilAnalysisData
                })

            // Insert soil sampling data
            await tx
                .insert(schema.soilSampling)
                .values({
                    b_id_sampling: b_id_sampling,
                    b_id: b_id,
                    a_id: a_id,
                    b_depth: b_depth,
                    b_sampling_date: b_sampling_date,
                    // b_sampling_geometry: b_sampling_geometry,
                })
        }
        catch (error) {
            throw new Error(`Failed to add soil analysis: ${error}`)
        }
    })

    return a_id
}

/**
 * Updates an existing soil analysis record and its associated sampling data.
 * 
 * @remarks
 * Performs a database transaction to update both the soil analysis and soil sampling records.
 * Supports partial updates of the soil analysis data.
 * 
 * @param fdm - The database transaction instance for performing updates
 * @param a_id - The unique identifier of the soil analysis record to be updated
 * @param soilAnalysisData - Partial data to update in the soil analysis record
 * 
 * @throws {Error} If the database transaction fails during the update process
 * 
 * @example
 * ```typescript
 * await updateSoilAnalysis(fdmInstance, 'soil_analysis_123', { 
 *   a_ph: 6.5, 
 *   a_organic_matter: 4.2 
 * });
 * ```
 */
export async function updateSoilAnalysis(
    fdm: FdmType,
    a_id: schema.soilAnalysisTypeSelect['a_id'],
    soilAnalysisData: Partial<schema.soilAnalysisTypeInsert>
): Promise<void> {

    const updated = new Date()
    await fdm.transaction(async (tx: FdmType) => {
        try {
            await tx.update(schema.soilAnalysis)
                .set({ updated: updated, ...soilAnalysisData })
                .where(eq(schema.soilAnalysis.a_id, a_id))


            await tx.update(schema.soilSampling)
                .set({ updated: updated })
                .where(eq(schema.soilSampling.a_id, a_id))

        } catch (error) {
            throw new Error(`Failed to update soil analysis: ${error}`)
        }

    })
}

/**
 * Removes a soil analysis record and its associated sampling data from the database.
 * 
 * @param fdm - The database transaction instance for performing database operations
 * @param a_id - The unique identifier of the soil analysis record to be deleted
 * @throws {Error} If the deletion process fails during the database transaction
 * 
 * @remarks
 * This function performs a cascading deletion of both soil analysis and soil sampling records
 * within a single database transaction. It ensures that related records are removed atomically.
 */
export async function removeSoilAnalysis(
    fdm: FdmType,
    a_id: schema.soilAnalysisTypeSelect['a_id'],
): Promise<void> {
    await fdm.transaction(async (tx: FdmType) => {
        try {
            await tx
                .delete(schema.soilSampling)
                .where(eq(schema.soilSampling.a_id, a_id))

            await tx
                .delete(schema.soilAnalysis)
                .where(eq(schema.soilAnalysis.a_id, a_id))


        } catch (error) {
            throw new Error(`Failed to remove soil analysis: ${error}`)
        }
    })
}

/**
 * Retrieves the latest soil analysis for a specified field.
 * 
 * @remarks
 * Performs a database query to fetch the most recent soil analysis record for a given field by joining soil analysis and sampling tables.
 * 
 * @param fdm - The database transaction or connection instance
 * @param b_id - The unique identifier of the field to retrieve soil analysis for
 * @returns The most recent soil analysis record or null if no analysis exists for the field
 * 
 * @throws {Error} If there are issues executing the database query
 * 
 * @example
 * ```typescript
 * const latestAnalysis = await getSoilAnalysis(fdmInstance, 'field123');
 * if (latestAnalysis) {
 *   console.log('Latest soil analysis date:', latestAnalysis.a_date);
 * }
 * ```
 */
export async function getSoilAnalysis(
    fdm: FdmType,
    b_id: schema.soilSamplingTypeSelect['b_id']
): Promise<getSoilAnalysisType> {
    const soilAnalysis = await fdm
        .select({
            a_id: schema.soilAnalysis.a_id,
            a_date: schema.soilAnalysis.a_date,
            a_source: schema.soilAnalysis.a_source,
            a_p_al: schema.soilAnalysis.a_p_al,
            a_p_cc: schema.soilAnalysis.a_p_cc,
            a_som_loi: schema.soilAnalysis.a_som_loi,
            b_gwl_class: schema.soilAnalysis.b_gwl_class,
            b_soiltype_agr: schema.soilAnalysis.b_soiltype_agr,
            b_id_sampling: schema.soilSampling.b_id_sampling,
            b_depth: schema.soilSampling.b_depth,
            b_sampling_date: schema.soilSampling.b_sampling_date,
            // b_sampling_geometry: schema.soilSampling.b_sampling_geometry,
        })
        .from(schema.soilAnalysis)
        .innerJoin(schema.soilSampling, eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id))
        .where(eq(schema.soilSampling.b_id, b_id))
        .orderBy(desc(schema.soilAnalysis.created)) // TOOD add coalesce with column `updated` when drizzle supports it
        .limit(1)

    return soilAnalysis[0] || null
}

/**
 * Retrieves all soil analyses for a specified field, sorted by sampling date in descending order.
 * 
 * @remarks
 * This function performs a database query joining soil analysis and soil sampling tables to fetch comprehensive soil analysis data for a given field.
 * 
 * @param fdm - The database transaction or connection instance
 * @param b_id - The unique identifier of the field for which soil analyses are to be retrieved
 * @returns An array of soil analysis records, with the most recent sampling date first. Returns an empty array if no analyses are found for the field.
 * 
 * @throws {Error} Throws an error if the database query fails
 * 
 * @example
 * ```typescript
 * const fieldSoilAnalyses = await getSoilAnalyses(fdmInstance, 'field123');
 * // Returns array of soil analysis records for field 'field123'
 * ```
 */
export async function getSoilAnalyses(
    fdm: FdmType,
    b_id: schema.soilSamplingTypeSelect['b_id']
): Promise<getSoilAnalysisType[]> {
    const soilAnalyses = await fdm
        .select({
            a_id: schema.soilAnalysis.a_id,
            a_date: schema.soilAnalysis.a_date,
            a_source: schema.soilAnalysis.a_source,
            a_p_al: schema.soilAnalysis.a_p_al,
            a_p_cc: schema.soilAnalysis.a_p_cc,
            a_som_loi: schema.soilAnalysis.a_som_loi,
            b_gwl_class: schema.soilAnalysis.b_gwl_class,
            b_soiltype_agr: schema.soilAnalysis.b_soiltype_agr,
            b_id_sampling: schema.soilSampling.b_id_sampling,
            b_depth: schema.soilSampling.b_depth,
            b_sampling_date: schema.soilSampling.b_sampling_date,
            // b_sampling_geometry: schema.soilSampling.b_sampling_geometry,
        })
        .from(schema.soilAnalysis)
        .innerJoin(schema.soilSampling, eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id))
        .where(eq(schema.soilSampling.b_id, b_id))
        .orderBy(desc(schema.soilSampling.b_sampling_date))


    return soilAnalyses
}
