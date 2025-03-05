import { desc, eq } from "drizzle-orm"
import { createId } from "./id"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { getSoilAnalysisType } from "./soil.d"

/**
 * Adds a new soil analysis record along with its soil sampling details.
 *
 * This function verifies that the principal has write access to the specified field, then creates new entries
 * in the soil analysis and soil sampling tables within a database transaction. The ID of the newly created soil
 * analysis record is returned.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The identifier of the principal performing the operation.
 * @param a_date - The date when the soil analysis was performed.
 * @param a_source - The source of the soil analysis data.
 * @param b_id - The identifier of the field where the soil sample was collected.
 * @param b_depth - The depth at which the soil sample was taken.
 * @param b_sampling_date - The date when the soil sample was collected.
 * @param soilAnalysisData - Optional additional data for the soil analysis (e.g., pH, nutrient levels).
 * @returns The ID of the newly added soil analysis record.
 * @throws {Error} If the database transaction fails.
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
 * Updates an existing soil analysis record and the related soil sampling timestamp.
 *
 * This function first verifies whether the principal has write permission for the specified soil
 * analysis record. It then executes a transaction to update the soil analysis entry with the provided
 * changes and refreshes the corresponding soil sampling record's update timestamp.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - Identifier of the principal performing the update.
 * @param a_id - The unique identifier of the soil analysis record to update.
 * @param soilAnalysisData - Object containing the fields to update; supports partial updates.
 * @throws {Error} If the database transaction fails or the permission check does not pass.
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
        throw handleError(err, "Exception for updateSoilAnalysis", {
            a_id,
            ...soilAnalysisData,
        })
    }
}

/**
 * Removes a soil analysis record and its associated sampling data.
 *
 * Verifies that the principal has write permissions, then executes a transaction to delete
 * the corresponding entries from both the soil sampling and soil analysis tables.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal performing the removal.
 * @param a_id - The ID of the soil analysis record to remove.
 *
 * @throws {Error} If the operation fails due to permission issues or database errors.
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
 * Retrieves the most recent soil analysis record for a specified field.
 *
 * This function validates that the requesting principal has the necessary read permissions for the field before querying for the latest soil analysis data based on the creation timestamp.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The unique ID of the principal requesting the soil analysis.
 * @param b_id - The identifier of the field.
 * @returns The latest soil analysis record for the field, or null if no record exists.
 * @throws {Error} If an error occurs during permission verification or data retrieval.
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
 * Retrieves all soil analysis records for a specified field, sorted by sampling date in descending order.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The identifier of the principal requesting the data.
 * @param b_id - The identifier of the field.
 * @returns An array of soil analysis records with corresponding soil sampling details. Returns an empty array if no records are found.
 *
 * @throws {Error} If the principal lacks read permissions for the field or if the database query fails.
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
