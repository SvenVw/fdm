/**
 * @file This module provides a centralized function for collecting all the necessary data
 * required for calculating the Dutch 2025 norm values. It serves as a data aggregation
 * layer, similar to its counterpart in the `filling` directory, by fetching information
 * from `fdm-core` services.
 *
 * @packageDocumentation
 */
import {
    type FdmType,
    getCultivations,
    getCurrentSoilData,
    getField,
    getGrazingIntention,
    isDerogationGrantedForYear,
    type PrincipalId,
    type Timeframe,
} from "@svenvw/fdm-core"
import type { NL2025NormsInput } from "./types.d"

/**
 * Gathers and standardizes all input data required for the 2025 norm value calculations.
 *
 * This function orchestrates the retrieval of various data points for a specific field for
 * the 2025 regulatory year, including:
 * - Field details.
 * - Farm-level status, such as derogation and grazing intention.
 * - Cultivation history.
 * - The most current soil analysis data, specifically focusing on phosphate-related values.
 *
 * It then assembles this information into a single, standardized `NL2025NormsInput` object
 * that can be consumed by the different norm value calculation functions.
 *
 * @param fdm - The FDM core data access object.
 * @param principal_id - The identifier of the user or system making the request.
 * @param b_id - The unique identifier of the field.
 * @returns A promise that resolves to the fully populated `NL2025NormsInput` object.
 */
export async function collectNL2025InputForNorms(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: string,
): Promise<NL2025NormsInput> {
    // Create timeframe for 2025
    const year = 2025
    const startOfYear = new Date(year, 0, 1)
    const endOfYear = new Date(year, 11, 31)
    const timeframe2025: Timeframe = { start: startOfYear, end: endOfYear }
    const timeframe2025Cultivation: Timeframe = {
        start: new Date(year - 1, 0, 1),
        end: endOfYear,
    }

    // 1. Get the details for the field.
    const field = await getField(fdm, principal_id, b_id)

    // 2. Get the details for the farm
    const is_derogatie_bedrijf = await isDerogationGrantedForYear(
        fdm,
        principal_id,
        field.b_id_farm,
        2025,
    )

    // 3. Get the grazing intention for the farm
    const has_grazing_intention = await getGrazingIntention(
        fdm,
        principal_id,
        field.b_id_farm,
        2025,
    )

    // 4. Get the details of the cultivations
    const cultivations = await getCultivations(
        fdm,
        principal_id,
        b_id,
        timeframe2025Cultivation,
    )

    // 4. Get the details of the soil analyses
    const soilAnalysis = await getCurrentSoilData(
        fdm,
        principal_id,
        field.b_id,
        timeframe2025,
    )
    const soilAnalysisPicked = {
        a_p_cc:
            soilAnalysis.find(
                (x: { parameter: string }) => x.parameter === "a_p_cc",
            )?.value ?? null,
        a_p_al:
            soilAnalysis.find(
                (x: { parameter: string }) => x.parameter === "a_p_al",
            )?.value ?? null,
    }

    return {
        farm: {
            is_derogatie_bedrijf,
            has_grazing_intention,
        },
        field: field,
        cultivations: cultivations,
        soilAnalysis: soilAnalysisPicked,
    }
}
