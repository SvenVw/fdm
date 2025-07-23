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
 * @returns A promise that resolves to an `NL2025NormsInput` object, containing all the
 *   structured data required for the norm calculations.
 */
export async function collectNL2025InputForNorms(
    fdm: FdmType,
    principal_id: string,
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

    // 3. Get the details of the cultivations
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
        },
        field: field,
        cultivations: cultivations,
        soilAnalysis: soilAnalysisPicked,
    }
}
