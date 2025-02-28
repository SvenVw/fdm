import { desc, eq } from "drizzle-orm"
import { createId } from "./id"

import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { getSoilAnalysisType } from "./soil.d"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import { check } from "drizzle-orm/mysql-core"

/**
 * Adds a new soil analysis record, including soil sampling details.
 *
 * @param fdm The FDM database instance.
 * @param principal_id - The id of the principal that is adding the soil analysis
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
    principal_id: PrincipalId,
    a_date: schema.soilAnalysisTypeInsert["a_date"],
    a_source: schema.soilAnalysisTypeInsert["a_source"],
    b_id: schema.soilSamplingTypeInsert["b_id"],
    b_depth: schema.soilSamplingTypeInsert["b_depth"],
    b_sampling_date: schema.soilSamplingTypeInsert["b_sampling_date"],
    // b_sampling_geometry: schema.soilSamplingTypeInsert['b_sampling_geometry'],
    soilAnalysisData?: Partial<schema.soilAnalysisTypeInsert>,
): Promise<schema.soilAnalysisTypeSelect["a_id"]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "write",
            b_id,
            principal_id,
            "addSoilAnalysis",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            const a_id = createId()
            const b_id_sampling = createId()

            // Insert soil analysis data
            await tx.insert(schema.soilAnalysis).values({
                a_id: a_id,
                a_date: a_date,
                a_source: a_source,
                ...soilAnalysisData,
            })

            // Insert soil sampling data
            await tx.insert(schema.soilSampling).values({
                b_id_sampling: b_id_sampling,
                b_id: b_id,
                a_id: a_id,
                b_depth: b_depth,
                b_sampling_date: b_sampling_date,
                // b_sampling_geometry: b_sampling_geometry,
            })

            return a_id
        })
    } catch (err) {
        throw handleError(err, "Exception for addSoilAnalysis", {
            a_date,
            a_source,
            b_id,
            b_depth,
            b_sampling_date,
            // b_sampling_geometry
        })
    }
}

/**
 * Updates an existing soil analysis record.
 *
 * @param fdm The FDM database instance.
 * @param principal_id - The id of the principal that is updating the soil analysis
 * @param a_id The ID of the soil analysis record to update.
 * @param soilAnalysisData The data to update.  Partial updates are supported.
 * @throws If there's an error during the database transaction.
 */
export async function updateSoilAnalysis(
    fdm: FdmType,
    principal_id: PrincipalId,
    a_id: schema.soilAnalysisTypeSelect["a_id"],
    soilAnalysisData: Partial<schema.soilAnalysisTypeInsert>,
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "soil_analysis",
            "write",
            a_id,
            principal_id,
            "updateSoilAnalysis",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            const updated = new Date()

            await tx
                .update(schema.soilAnalysis)
                .set({ updated: updated, ...soilAnalysisData })
                .where(eq(schema.soilAnalysis.a_id, a_id))

            await tx
                .update(schema.soilSampling)
                .set({ updated: updated })
                .where(eq(schema.soilSampling.a_id, a_id))
        })
    } catch (err) {
        handleError(err, "Exception for updateSoilAnalysis", {
            a_id,
            ...soilAnalysisData,
        })
    }
}

/**
 * Removes a soil analysis record and associated sampling data.
 *
 * @param fdm The FDM database instance.
 * @param principal_id - The id of the principal that is removing the soil analysis
 * @param a_id The ID of the soil analysis record to remove.
 * @throws If there's an error during the database transaction.
 */
export async function removeSoilAnalysis(
    fdm: FdmType,
    principal_id: PrincipalId,
    a_id: schema.soilAnalysisTypeSelect["a_id"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "soil_analysis",
            "write",
            a_id,
            principal_id,
            "removeSoilAnalysis",
        )
        return await fdm.transaction(async (tx: FdmType) => {
            await tx
                .delete(schema.soilSampling)
                .where(eq(schema.soilSampling.a_id, a_id))

            await tx
                .delete(schema.soilAnalysis)
                .where(eq(schema.soilAnalysis.a_id, a_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for removeSoilAnalysis", { a_id })
    }
}

/**
 * Retrieves the latest soil analysis for a given field.
 *
 * @param fdm The FDM database instance.
 * @param principal_id - The id of the principal that is requesting the soil analysis
 * @param b_id The ID of the field.
 * @returns The latest soil analysis data for the field, or null if no analysis is found.
 */
export async function getSoilAnalysis(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.soilSamplingTypeSelect["b_id"],
): Promise<getSoilAnalysisType> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getSoilAnalysis",
        )
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
            .innerJoin(
                schema.soilSampling,
                eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id),
            )
            .where(eq(schema.soilSampling.b_id, b_id))
            .orderBy(desc(schema.soilAnalysis.created)) // TOOD add coalesce with column `updated` when drizzle supports it
            .limit(1)

        return soilAnalysis[0] || null
    } catch (err) {
        throw handleError(err, "Exception for getSoilAnalysis", { b_id })
    }
}

/**
 * Retrieves all soil analyses for a given field, ordered by date (latest first).
 *
 * @param fdm The FDM database instance.
 * @param principal_id - The id of the principal that is requesting the soil analyses
 * @param b_id The ID of the field.
 * @returns An array of soil analysis data for the field. The array will be empty if no analyses are found.
 */
export async function getSoilAnalyses(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.soilSamplingTypeSelect["b_id"],
): Promise<getSoilAnalysisType[]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getSoilAnalyses",
        )

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
            .innerJoin(
                schema.soilSampling,
                eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id),
            )
            .where(eq(schema.soilSampling.b_id, b_id))
            .orderBy(desc(schema.soilSampling.b_sampling_date))

        return soilAnalyses
    } catch (err) {
        throw handleError(err, "Exception for getSoilAnalyses", { b_id })
    }
}
