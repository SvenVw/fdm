import { desc, eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getSoilAnalysisType } from './soil.d'

/**
 * Adds a new soil analysis record, including soil sampling details.
 *
 * @param fdm The FDM database instance.
 * @param a_date The date of the soil analysis.
 * @param a_source The source of the soil analysis data.
 * @param b_id The ID of the field where the soil sample was taken.
 * @param b_depth The depth of the soil sample.
 * @param b_sampling_date The date the soil sample was taken.
 * @param b_sampling_geometry The geometry of the sampling location (e.g., point, multipoint).
 * @param soilAnalysisData Additional soil analysis data (e.g., pH, nutrient levels).
 * @returns The ID of the newly added soil analysis record.
 * @throws If there's an error during the database transaction.
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
 * Updates an existing soil analysis record.
 *
 * @param fdm The FDM database instance.
 * @param a_id The ID of the soil analysis record to update.
 * @param soilAnalysisData The data to update.  Partial updates are supported.
 * @throws If there's an error during the database transaction.
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
 * Removes a soil analysis record and associated sampling data.
 *
 * @param fdm The FDM database instance.
 * @param a_id The ID of the soil analysis record to remove.
 * @throws If there's an error during the database transaction.
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
 * Retrieves the latest soil analysis for a given field.
 *
 * @param fdm The FDM database instance.
 * @param b_id The ID of the field.
 * @returns The latest soil analysis data for the field, or null if no analysis is found.
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
        .orderBy(desc(schema.soilSampling.b_sampling_date))
        .limit(1)

    return  soilAnalysis[0] || null 
}

/**
 * Retrieves all soil analyses for a given field, ordered by date (latest first).
 *
 * @param fdm The FDM database instance.
 * @param b_id The ID of the field.
 * @returns An array of soil analysis data for the field. The array will be empty if no analyses are found.
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
