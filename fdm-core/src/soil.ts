/**
 * @file This file contains functions for managing soil data in the FDM.
 *
 * It provides a comprehensive set of CRUD operations for soil analyses, as well as functions
 * for retrieving current soil data and soil parameter descriptions.
 */
import { and, eq, gte, isNull, lte, or, type SQL, sql } from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { createId } from "./id"
import type {
    CurrentSoilData,
    SoilAnalysis,
    SoilParameterDescription,
    SoilParameters,
} from "./soil.d"
import type { Timeframe } from "./timeframe"

/**
 * Adds a new soil analysis to a field.
 *
 * This function records a new soil analysis, including the sampling details and the analysis results.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param a_date The date of the analysis.
 * @param a_source The source of the analysis (e.g., the lab).
 * @param b_id The unique identifier of the field.
 * @param a_depth_lower The lower depth of the soil sample.
 * @param b_sampling_date The date of the soil sample.
 * @param soilAnalysisData An object containing the analysis results (optional).
 * @param a_depth_upper The upper depth of the soil sample (optional, defaults to 0).
 * @returns A promise that resolves to the unique identifier of the new soil analysis.
 * @throws An error if the principal does not have permission or if the depth values are invalid.
 */
export async function addSoilAnalysis(
    fdm: FdmType,
    principal_id: PrincipalId,
    a_date: schema.soilAnalysisTypeInsert["a_date"],
    a_source: schema.soilAnalysisTypeInsert["a_source"],
    b_id: schema.soilSamplingTypeInsert["b_id"],
    a_depth_lower: schema.soilSamplingTypeInsert["a_depth_lower"],
    b_sampling_date: schema.soilSamplingTypeInsert["b_sampling_date"],
    // b_sampling_geometry: schema.soilSamplingTypeInsert['b_sampling_geometry'],
    soilAnalysisData?: Partial<schema.soilAnalysisTypeInsert>,
    a_depth_upper: schema.soilSamplingTypeInsert["a_depth_upper"] = 0,
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

        // Validate if a_depth_lower is beneath a_depth_upper
        if (a_depth_lower && a_depth_lower <= a_depth_upper) {
            throw new Error("a_depth_lower must be greater than a_depth_upper")
        }

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
                a_depth_upper: a_depth_upper,
                a_depth_lower: a_depth_lower,
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
            a_depth_upper,
            a_depth_lower,
            b_sampling_date,
            // b_sampling_geometry
        })
    }
}

/**
 * Updates a soil analysis.
 *
 * This function allows for the modification of an existing soil analysis record.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param a_id The unique identifier of the soil analysis to update.
 * @param soilAnalysisData An object containing the properties to update.
 * @returns A promise that resolves when the soil analysis has been successfully updated.
 * @throws An error if the principal does not have permission.
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
 * Removes a soil analysis.
 *
 * This function deletes a soil analysis and its associated sampling record.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param a_id The unique identifier of the soil analysis to remove.
 * @returns A promise that resolves when the soil analysis has been successfully removed.
 * @throws An error if the principal does not have permission.
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
 * Retrieves a single soil analysis by its unique identifier.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param a_id The unique identifier of the soil analysis.
 * @returns A promise that resolves to a `SoilAnalysis` object.
 * @throws An error if the principal does not have permission or if the analysis is not found.
 */
export async function getSoilAnalysis(
    fdm: FdmType,
    principal_id: PrincipalId,
    a_id: schema.soilAnalysisTypeSelect["a_id"],
): Promise<SoilAnalysis> {
    try {
        await checkPermission(
            fdm,
            "soil_analysis",
            "read",
            a_id,
            principal_id,
            "getSoilAnalysis",
        )
        const soilAnalysis = await fdm
            .select({
                a_id: schema.soilAnalysis.a_id,
                a_date: schema.soilAnalysis.a_date,
                a_source: schema.soilAnalysis.a_source,
                a_al_ox: schema.soilAnalysis.a_al_ox,
                a_c_of: schema.soilAnalysis.a_c_of,
                a_ca_co: schema.soilAnalysis.a_ca_co,
                a_ca_co_po: schema.soilAnalysis.a_ca_co_po,
                a_caco3_if: schema.soilAnalysis.a_caco3_if,
                a_cec_co: schema.soilAnalysis.a_cec_co,
                a_clay_mi: schema.soilAnalysis.a_clay_mi,
                a_cn_fr: schema.soilAnalysis.a_cn_fr,
                a_com_fr: schema.soilAnalysis.a_com_fr,
                a_cu_cc: schema.soilAnalysis.a_cu_cc,
                a_density_sa: schema.soilAnalysis.a_density_sa,
                a_fe_ox: schema.soilAnalysis.a_fe_ox,
                a_k_cc: schema.soilAnalysis.a_k_cc,
                a_k_co: schema.soilAnalysis.a_k_co,
                a_k_co_po: schema.soilAnalysis.a_k_co_po,
                a_mg_cc: schema.soilAnalysis.a_mg_cc,
                a_mg_co: schema.soilAnalysis.a_mg_co,
                a_mg_co_po: schema.soilAnalysis.a_mg_co_po,
                a_n_pmn: schema.soilAnalysis.a_n_pmn,
                a_n_rt: schema.soilAnalysis.a_n_rt,
                a_nh4_cc: schema.soilAnalysis.a_nh4_cc,
                a_nmin_cc: schema.soilAnalysis.a_nmin_cc,
                a_no3_cc: schema.soilAnalysis.a_no3_cc,
                a_p_al: schema.soilAnalysis.a_p_al,
                a_p_cc: schema.soilAnalysis.a_p_cc,
                a_p_ox: schema.soilAnalysis.a_p_ox,
                a_p_rt: schema.soilAnalysis.a_p_rt,
                a_p_sg: schema.soilAnalysis.a_p_sg,
                a_p_wa: schema.soilAnalysis.a_p_wa,
                a_ph_cc: schema.soilAnalysis.a_ph_cc,
                a_s_rt: schema.soilAnalysis.a_s_rt,
                a_sand_mi: schema.soilAnalysis.a_sand_mi,
                a_silt_mi: schema.soilAnalysis.a_silt_mi,
                a_som_loi: schema.soilAnalysis.a_som_loi,
                a_zn_cc: schema.soilAnalysis.a_zn_cc,
                b_gwl_class: schema.soilAnalysis.b_gwl_class,
                b_soiltype_agr: schema.soilAnalysis.b_soiltype_agr,
                b_id_sampling: schema.soilSampling.b_id_sampling,
                a_depth_upper: schema.soilSampling.a_depth_upper,
                a_depth_lower: schema.soilSampling.a_depth_lower,
                b_sampling_date: schema.soilSampling.b_sampling_date,
                // b_sampling_geometry: schema.soilSampling.b_sampling_geometry,
            })
            .from(schema.soilAnalysis)
            .leftJoin(
                schema.soilSampling,
                eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id),
            )
            .where(eq(schema.soilAnalysis.a_id, a_id))

        return soilAnalysis[0] || null
    } catch (err) {
        throw handleError(err, "Exception for getSoilAnalysis", { a_id })
    }
}

/**
 * Retrieves all soil analyses for a field, optionally filtered by a timeframe.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id The unique identifier of the field.
 * @param timeframe An optional timeframe to filter the analyses.
 * @returns A promise that resolves to an array of `SoilAnalysis` objects.
 * @throws An error if the principal does not have permission.
 */
export async function getSoilAnalyses(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.soilSamplingTypeSelect["b_id"],
    timeframe?: Timeframe,
): Promise<SoilAnalysis[]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getSoilAnalyses",
        )

        let whereClause: SQL | undefined
        if (timeframe?.start && timeframe.end) {
            whereClause = and(
                eq(schema.soilSampling.b_id, b_id),
                or(
                    gte(schema.soilSampling.b_sampling_date, timeframe.start),
                    isNull(schema.soilSampling.b_sampling_date),
                ),
                or(
                    lte(schema.soilSampling.b_sampling_date, timeframe.end),
                    isNull(schema.soilSampling.b_sampling_date),
                ),
            )
        } else if (timeframe?.start) {
            whereClause = and(
                eq(schema.soilSampling.b_id, b_id),
                or(
                    gte(schema.soilSampling.b_sampling_date, timeframe.start),
                    isNull(schema.soilSampling.b_sampling_date),
                ),
            )
        } else if (timeframe?.end) {
            whereClause = and(
                eq(schema.soilSampling.b_id, b_id),
                or(
                    lte(schema.soilSampling.b_sampling_date, timeframe.end),
                    isNull(schema.soilSampling.b_sampling_date),
                ),
            )
        } else {
            whereClause = eq(schema.soilSampling.b_id, b_id)
        }

        const soilAnalyses = await fdm
            .select({
                a_id: schema.soilAnalysis.a_id,
                a_date: schema.soilAnalysis.a_date,
                a_source: schema.soilAnalysis.a_source,
                a_al_ox: schema.soilAnalysis.a_al_ox,
                a_c_of: schema.soilAnalysis.a_c_of,
                a_ca_co: schema.soilAnalysis.a_ca_co,
                a_ca_co_po: schema.soilAnalysis.a_ca_co_po,
                a_caco3_if: schema.soilAnalysis.a_caco3_if,
                a_cec_co: schema.soilAnalysis.a_cec_co,
                a_clay_mi: schema.soilAnalysis.a_clay_mi,
                a_cn_fr: schema.soilAnalysis.a_cn_fr,
                a_com_fr: schema.soilAnalysis.a_com_fr,
                a_cu_cc: schema.soilAnalysis.a_cu_cc,
                a_density_sa: schema.soilAnalysis.a_density_sa,
                a_fe_ox: schema.soilAnalysis.a_fe_ox,
                a_k_cc: schema.soilAnalysis.a_k_cc,
                a_k_co: schema.soilAnalysis.a_k_co,
                a_k_co_po: schema.soilAnalysis.a_k_co_po,
                a_mg_cc: schema.soilAnalysis.a_mg_cc,
                a_mg_co: schema.soilAnalysis.a_mg_co,
                a_mg_co_po: schema.soilAnalysis.a_mg_co_po,
                a_n_pmn: schema.soilAnalysis.a_n_pmn,
                a_n_rt: schema.soilAnalysis.a_n_rt,
                a_nh4_cc: schema.soilAnalysis.a_nh4_cc,
                a_nmin_cc: schema.soilAnalysis.a_nmin_cc,
                a_no3_cc: schema.soilAnalysis.a_no3_cc,
                a_p_al: schema.soilAnalysis.a_p_al,
                a_p_cc: schema.soilAnalysis.a_p_cc,
                a_p_ox: schema.soilAnalysis.a_p_ox,
                a_p_rt: schema.soilAnalysis.a_p_rt,
                a_p_sg: schema.soilAnalysis.a_p_sg,
                a_p_wa: schema.soilAnalysis.a_p_wa,
                a_ph_cc: schema.soilAnalysis.a_ph_cc,
                a_s_rt: schema.soilAnalysis.a_s_rt,
                a_sand_mi: schema.soilAnalysis.a_sand_mi,
                a_silt_mi: schema.soilAnalysis.a_silt_mi,
                a_som_loi: schema.soilAnalysis.a_som_loi,
                a_zn_cc: schema.soilAnalysis.a_zn_cc,
                b_gwl_class: schema.soilAnalysis.b_gwl_class,
                b_soiltype_agr: schema.soilAnalysis.b_soiltype_agr,
                b_id_sampling: schema.soilSampling.b_id_sampling,
                a_depth_upper: schema.soilSampling.a_depth_upper,
                a_depth_lower: schema.soilSampling.a_depth_lower,
                b_sampling_date: schema.soilSampling.b_sampling_date,
                // b_sampling_geometry: schema.soilSampling.b_sampling_geometry,
            })
            .from(schema.soilAnalysis)
            .innerJoin(
                schema.soilSampling,
                eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id),
            )
            .where(whereClause)
            .orderBy(
                // Drizzle does not support NULL LAST argument yet
                sql`${schema.soilSampling.b_sampling_date} DESC NULLS LAST`,
            )

        return soilAnalyses
    } catch (err) {
        throw handleError(err, "Exception for getSoilAnalyses", { b_id })
    }
}

/**
 * Retrieves the most recent soil data for a field.
 *
 * This function fetches the latest available values for all soil parameters for a given field,
 * optionally within a specified timeframe.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id The unique identifier of the field.
 * @param timeframe An optional timeframe to filter the analyses.
 * @returns A promise that resolves to a `CurrentSoilData` object.
 * @throws An error if the principal does not have permission.
 */
export async function getCurrentSoilData(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.soilSamplingTypeSelect["b_id"],
    timeframe?: Timeframe,
): Promise<CurrentSoilData> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getLastSoilParameters",
        )

        // Filter out "future" analyes
        let whereClause: SQL | undefined
        if (timeframe?.end) {
            whereClause = and(
                eq(schema.soilSampling.b_id, b_id),
                or(
                    lte(schema.soilSampling.b_sampling_date, timeframe.end),
                    isNull(schema.soilSampling.b_sampling_date),
                ),
            )
        } else {
            whereClause = eq(schema.soilSampling.b_id, b_id)
        }

        const soilAnalyses = await fdm
            .select({
                a_id: schema.soilAnalysis.a_id,
                a_source: schema.soilAnalysis.a_source,
                a_al_ox: schema.soilAnalysis.a_al_ox,
                a_c_of: schema.soilAnalysis.a_c_of,
                a_ca_co: schema.soilAnalysis.a_ca_co,
                a_ca_co_po: schema.soilAnalysis.a_ca_co_po,
                a_caco3_if: schema.soilAnalysis.a_caco3_if,
                a_cec_co: schema.soilAnalysis.a_cec_co,
                a_clay_mi: schema.soilAnalysis.a_clay_mi,
                a_cn_fr: schema.soilAnalysis.a_cn_fr,
                a_com_fr: schema.soilAnalysis.a_com_fr,
                a_cu_cc: schema.soilAnalysis.a_cu_cc,
                a_density_sa: schema.soilAnalysis.a_density_sa,
                a_fe_ox: schema.soilAnalysis.a_fe_ox,
                a_k_cc: schema.soilAnalysis.a_k_cc,
                a_k_co: schema.soilAnalysis.a_k_co,
                a_k_co_po: schema.soilAnalysis.a_k_co_po,
                a_mg_cc: schema.soilAnalysis.a_mg_cc,
                a_mg_co: schema.soilAnalysis.a_mg_co,
                a_mg_co_po: schema.soilAnalysis.a_mg_co_po,
                a_n_pmn: schema.soilAnalysis.a_n_pmn,
                a_n_rt: schema.soilAnalysis.a_n_rt,
                a_nh4_cc: schema.soilAnalysis.a_nh4_cc,
                a_nmin_cc: schema.soilAnalysis.a_nmin_cc,
                a_no3_cc: schema.soilAnalysis.a_no3_cc,
                a_p_al: schema.soilAnalysis.a_p_al,
                a_p_cc: schema.soilAnalysis.a_p_cc,
                a_p_ox: schema.soilAnalysis.a_p_ox,
                a_p_rt: schema.soilAnalysis.a_p_rt,
                a_p_sg: schema.soilAnalysis.a_p_sg,
                a_p_wa: schema.soilAnalysis.a_p_wa,
                a_ph_cc: schema.soilAnalysis.a_ph_cc,
                a_s_rt: schema.soilAnalysis.a_s_rt,
                a_sand_mi: schema.soilAnalysis.a_sand_mi,
                a_silt_mi: schema.soilAnalysis.a_silt_mi,
                a_som_loi: schema.soilAnalysis.a_som_loi,
                a_zn_cc: schema.soilAnalysis.a_zn_cc,
                b_gwl_class: schema.soilAnalysis.b_gwl_class,
                b_soiltype_agr: schema.soilAnalysis.b_soiltype_agr,
                b_sampling_date: schema.soilSampling.b_sampling_date,
                a_depth_upper: schema.soilSampling.a_depth_upper,
                a_depth_lower: schema.soilSampling.a_depth_lower,
            })
            .from(schema.soilAnalysis)
            .innerJoin(
                schema.soilSampling,
                eq(schema.soilAnalysis.a_id, schema.soilSampling.a_id),
            )
            .where(whereClause)
            .orderBy(
                // Drizzle does not support NULL LAST argument yet
                sql`${schema.soilSampling.b_sampling_date} DESC NULLS LAST`,
            )

        const parameters: SoilParameters[] = [
            "a_al_ox",
            "a_c_of",
            "a_ca_co",
            "a_ca_co_po",
            "a_caco3_if",
            "a_cec_co",
            "a_clay_mi",
            "a_cn_fr",
            "a_com_fr",
            "a_cu_cc",
            "a_density_sa",
            "a_fe_ox",
            "a_k_cc",
            "a_k_co",
            "a_k_co_po",
            "a_mg_cc",
            "a_mg_co",
            "a_mg_co_po",
            "a_n_pmn",
            "a_n_rt",
            "a_nh4_cc",
            "a_nmin_cc",
            "a_no3_cc",
            "a_p_al",
            "a_p_cc",
            "a_p_ox",
            "a_p_rt",
            "a_p_sg",
            "a_p_wa",
            "a_ph_cc",
            "a_s_rt",
            "a_sand_mi",
            "a_silt_mi",
            "a_som_loi",
            "a_zn_cc",
            "b_gwl_class",
            "b_soiltype_agr",
        ]

        const currentSoilData: CurrentSoilData = parameters
            .map((parameter) => {
                const analysis = soilAnalyses.find(
                    (a) => a[parameter as keyof typeof a] !== null,
                )
                if (!analysis) return null

                return {
                    parameter,
                    value: analysis[parameter as keyof typeof analysis],
                    a_id: analysis.a_id,
                    b_sampling_date: analysis.b_sampling_date,
                    a_depth_upper: analysis.a_depth_upper,
                    a_depth_lower: analysis.a_depth_lower,
                    a_source: analysis.a_source,
                }
            })
            .filter(Boolean) as CurrentSoilData

        return currentSoilData
    } catch (err) {
        throw handleError(err, "Exception for getCurrentSoilData", { b_id })
    }
}

/**
 * Retrieves descriptions for all available soil parameters.
 *
 * This function provides metadata for each soil parameter, such as its name, unit, and type.
 *
 * @param locale The locale for the descriptions (currently only "NL-nl" is supported).
 * @returns An array of `SoilParameterDescription` objects.
 * @throws An error if an unsupported locale is provided.
 */
export function getSoilParametersDescription(
    locale = "NL-nl",
): SoilParameterDescription {
    if (locale !== "NL-nl") throw new Error("Unsupported locale")
    const soilParameterDescription: SoilParameterDescription = [
        {
            parameter: "a_source",
            unit: "",
            name: "Laboratorium",
            type: "enum",
            description: "Laboratorium dat de analyse heeft gedaan",
            options: schema.soilAnalysisSourceOptions,
        },
        {
            parameter: "a_id",
            unit: "",
            name: "ID",
            type: "text",
            description: "Analyse ID",
        },
        {
            parameter: "b_sampling_date",
            unit: "",
            name: "Datum",
            type: "date",
            description: "Datum van monstername",
        },
        {
            parameter: "a_depth_upper",
            unit: "cm",
            name: "Bemonsterde laag (bovenkant)",
            type: "numeric",
            description: "Diepte vanaf waar is bemonsterd",
        },
        {
            parameter: "a_depth_lower",
            unit: "cm",
            name: "Bemonsterde laag (onderkant)",
            type: "numeric",
            description: "Diepte tot waar is bemonsterd",
        },
        {
            parameter: "a_al_ox",
            unit: "mmol Al/kg",
            name: "Al-ox",
            type: "numeric",
            description: "Aluminium geëxtraheerd met oxalaat",
        },
        {
            parameter: "a_c_of",
            unit: "g C/g",
            name: "C-organisch",
            type: "numeric",
            description: "Organisch koolstogehalte",
        },
        {
            parameter: "a_ca_co",
            unit: "mmol+/kg",
            name: "Ca-bodemvoorraad",
            type: "numeric",
            description: "Calcium, totale bodemvoorraad",
        },
        {
            parameter: "a_ca_co_po",
            unit: "%",
            name: "Ca-bezetting",
            type: "numeric",
            description: "Calcium bezettingsgraad",
        },
        {
            parameter: "a_caco3_if",
            unit: "%",
            name: "Koolzure kalk",
            type: "numeric",
            description: "Koolzure kalk",
        },
        {
            parameter: "a_cec_co",
            unit: "mmol+/kg",
            name: "Klei-humus",
            type: "numeric",
            description: "CEC",
        },
        {
            parameter: "a_clay_mi",
            unit: "%",
            name: "Klei (<2 μm)",
            type: "numeric",
            description: "Kleigehalte",
        },
        {
            parameter: "a_cn_fr",
            unit: "-",
            name: "C/N-ratio",
            type: "numeric",
            description: "Koolstof / Stikstof ratio",
        },
        {
            parameter: "a_com_fr",
            unit: "-",
            name: "C/OS-ratio",
            type: "numeric",
            description: "Koolstof / Organische stof ratio",
        },
        {
            parameter: "a_cu_cc",
            unit: "µg Cu/kg",
            name: "Cu-plantbeschikbaar",
            type: "numeric",
            description: "Koper, plantbeschikbaar",
        },
        {
            parameter: "a_density_sa",
            unit: "g/cm³",
            name: "Dichtheid",
            type: "numeric",
            description: "Bulkdichtheid",
        },
        {
            parameter: "a_fe_ox",
            unit: "mmol Fe/kg",
            name: "Fe-ox",
            type: "numeric",
            description: "IJzer geëxtraheerd met oxalaat",
        },
        {
            parameter: "a_k_cc",
            unit: "mg K/kg",
            name: "K-plantbeschikbaar",
            type: "numeric",
            description: "Kalium, plantbeschikbaar",
        },
        {
            parameter: "a_k_co",
            unit: "mmol+/kg",
            name: "K-bodemvoorraad",
            type: "numeric",
            description: "Kalium, totale bodemvoorraad",
        },
        {
            parameter: "a_k_co_po",
            unit: "%",
            name: "K-bezetting",
            type: "numeric",
            description: "Kalium bezettingsgraad",
        },
        {
            parameter: "a_mg_cc",
            unit: "mg Mg/kg",
            name: "Mg-plantbeschikbaar",
            type: "numeric",
            description: "Magnesium, plantbeschikbaar",
        },
        {
            parameter: "a_mg_co",
            unit: "mmol+ Mg/kg",
            name: "Mg-bodemvoorraad",
            type: "numeric",
            description: "Magnesium, totale bodemvoorraad",
        },
        {
            parameter: "a_mg_co_po",
            unit: "%",
            name: "Mg-bezetting",
            type: "numeric",
            description: "Magnesium bezettingsgraad",
        },
        {
            parameter: "a_n_pmn",
            unit: "mg N/kg",
            name: "Microbiële activiteit",
            type: "numeric",
            description: "Microbiële activiteit",
        },
        {
            parameter: "a_n_rt",
            unit: "mg N/g",
            name: "N-totale bodemvoorraad",
            type: "numeric",
            description: "Stikstof, totale bodemvoorraad",
        },
        {
            parameter: "a_nh4_cc",
            unit: "mg N/l",
            name: "Ammonium-N",
            type: "numeric",
            description: "Ammonium (NH4-N)",
        },
        {
            parameter: "a_nmin_cc",
            unit: "kg N/ha",
            name: "N-voorraad",
            type: "numeric",
            description: "Beschikbare stikstofvoorraad",
        },
        {
            parameter: "a_no3_cc",
            unit: "mg N/l",
            name: "Nitraat-N",
            type: "numeric",
            description: "Nitraat (NO3-N)",
        },
        {
            parameter: "a_p_al",
            unit: "mg P2O5/100 g",
            name: "P-Al",
            type: "numeric",
            description: "Totaal fosfaatgehalte",
        },
        {
            parameter: "a_p_cc",
            unit: "mg P/kg",
            name: "P-plantbeschikbaar",
            type: "numeric",
            description: "Fosfor, plantbeschikbaar",
        },
        {
            parameter: "a_p_ox",
            unit: "mmol P/kg",
            name: "P-ox",
            type: "numeric",
            description: "Fosfor geëxtraheerd met oxalaat",
        },
        {
            parameter: "a_p_rt",
            unit: "g P/kg",
            name: "P-bodemvoorraad",
            type: "numeric",
            description: "Fosfor, totale bodemvoorraad",
        },
        {
            parameter: "a_p_sg",
            unit: "%",
            name: "FVG",
            type: "numeric",
            description: "Fosforverzadigingsgraad",
        },
        {
            parameter: "a_p_wa",
            unit: "mg P2O5/l",
            name: "Pw-getal",
            type: "numeric",
            description: "Fosfaat geëxtraheerd met water",
        },
        {
            parameter: "a_ph_cc",
            unit: "-",
            name: "Zuurgraad (pH)",
            type: "numeric",
            description: "Zuurgraad gemeten met CaCl2-extractie",
        },
        {
            parameter: "a_s_rt",
            unit: "mg S/kg",
            name: "S-totale bodemvoorraad",
            type: "numeric",
            description: "Zwavel, totale bodemvoorraad",
        },
        {
            parameter: "a_sand_mi",
            unit: "%",
            name: "Zand (>50 μm)",
            type: "numeric",
            description: "Zandgehalte",
        },
        {
            parameter: "a_silt_mi",
            unit: "%",
            name: "Silt (2-50 μm)",
            type: "numeric",
            description: "Siltgehalte",
        },
        {
            parameter: "a_som_loi",
            unit: "%",
            name: "OS",
            type: "numeric",
            description: "Organische stof",
        },
        {
            parameter: "a_zn_cc",
            unit: "µg Zn/kg",
            name: "Zn-plantbeschikbaar",
            type: "numeric",
            description: "Zink, plantbeschikbaar",
        },
        {
            parameter: "b_gwl_class",
            unit: "",
            name: "GWT",
            type: "enum",
            description: "Grondwatertrap",
            options: schema.gwlClassesOptions,
        },
        {
            parameter: "b_soiltype_agr",
            unit: "",
            name: "Bodemtype",
            type: "enum",
            description: "Agrarisch bodemtype",
            options: schema.soilTypesOptions,
        },
    ]

    return soilParameterDescription
}
