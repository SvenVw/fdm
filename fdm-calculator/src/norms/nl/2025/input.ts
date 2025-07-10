import {
    getCultivations,
    getCurrentSoilData,
    type Timeframe,
    type FdmType,
    getField,
    isDerogationGrantedForYear,
} from "@svenvw/fdm-core"
import type { NL2025NormsInput } from "./types.d"

/**
 * Collects all necessary input data from the FDM to calculate the Dutch (NL) norms for the year 2025.
 *
 * This function orchestrates fetching data for a given farm, its fields, cultivations, and soil analyses,
 * and structures it into a format suitable for the various NL 2025 norm calculation functions.
 *
 * @param fdm - An initialized FdmType instance for data access.
 * @param principal_id - The ID of the principal initiating the data collection.
 * @param b_id - The unique identifier of the field for which to collect data.
 * @param timeframe - The timeframe for which to collect the data.
 * @returns A promise that resolves to an `NL2025NormsInput` object, containing all the
 *   structured data required for the norm calculations.
 */
export async function collectNL2025InputForNorms(
    fdm: FdmType,
    principal_id: string,
    b_id: string,
    timeframe: Timeframe,
): Promise<NL2025NormsInput> {
    // 1. Get the details for the field.
    const field = await getField(fdm, principal_id, b_id)

    // 2. Get the details for the farm
    const is_derogatie_bedrijf = await isDerogationGrantedForYear(
        fdm,
        principal_id,
        field.b_id_farm,
        2025,
    )

    // 3. Get the details of the cultivations
    const cultivations = await getCultivations(
        fdm,
        principal_id,
        b_id,
        timeframe,
    )

    // 4. Get the details of the soil analyses
    const soilAnalysis = await getCurrentSoilData(
        fdm,
        principal_id,
        field.b_id,
        timeframe,
    )
    const soilAnalysisPicked = {
        a_p_cc: soilAnalysis.find(
            (x: { parameter: string }) => x.parameter === "a_p_cc",
        ).value,
        a_p_al: soilAnalysis.find(
            (x: { parameter: string }) => x.parameter === "a_p_al",
        ).value,
    }

    return {
        farm: {
            is_derogatie_bedrijf,
        },
        field: field,
        cultivations: cultivations,
        soilAnalysis: soilAnalysisPicked,
    }
}
