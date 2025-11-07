/**
 * @file This module provides a centralized function for collecting all the necessary data
 * required for the norm filling calculations for the Dutch 2025 regulations. It acts as a
 * data aggregation layer, fetching information from various `fdm-core` services and
 * assembling it into a standardized input object.
 *
 * @packageDocumentation
 */
import type { FdmType, PrincipalId, Timeframe } from "@svenvw/fdm-core"
import {
    getCultivations,
    getFertilizerApplications,
    getFertilizers,
    getField,
    getGrazingIntention,
    isOrganicCertificationValid,
} from "@svenvw/fdm-core"
import type { NL2025NormsFillingInput } from "./types"

/**
 * Gathers and standardizes all input data required for norm filling calculations.
 *
 * This function orchestrates the retrieval of various data points for a specific field
 * within the 2025 calendar year, including:
 * - Field details (to get the farm ID and centroid).
 * - Grazing intentions and organic certification status for the farm.
 * - Cultivation history for the field.
 * - Fertilizer applications on the field.
 * - Definitions of all fertilizers available on the farm.
 *
 * It then compiles this information, along with the provided phosphate usage norm, into a
 * single, standardized input object (`NL2025NormsFillingInput`) that can be used by the
 * various norm filling calculation functions.
 *
 * @param fdm - The FDM core data access object.
 * @param principal_id - The identifier of the user or system making the request.
 * @param b_id - The unique identifier of the field.
 * @param fosfaatgebruiksnorm - The phosphate usage norm (in kg/ha) for the field.
 * @returns A promise that resolves to the fully populated `NL2025NormsFillingInput` object.
 * @throws {Error} If the specified field cannot be found.
 */
export async function collectInputForFertilizerApplicationFilling(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: string,
    fosfaatgebruiksnorm: number,
): Promise<NL2025NormsFillingInput> {
    // Define the calendar year for the norms calculation.
    const year = 2025
    // Define the timeframe for data collection for the current year.
    const startOfYear = new Date(year, 0, 1) // January 1st of the specified year
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999) // December 31st of the specified year, including December 31st
    const timeframe2025: Timeframe = { start: startOfYear, end: endOfYear }

    // 1. Retrieve field details using the field ID.
    // This is crucial for obtaining the farm ID and the field's geographical centroid.
    const field = await getField(fdm, principal_id, b_id)
    if (!field) {
        throw new Error(
            `Field with id ${b_id} not found for principal ${principal_id}`,
        )
    }
    const b_id_farm = field.b_id_farm
    const b_centroid = field.b_centroid

    // 2. Retrieve the grazing intention status for the farm for the specified year.
    // This indicates whether grazing is intended on the farm, affecting certain norm calculations.
    const has_grazing_intention = await getGrazingIntention(
        fdm,
        principal_id,
        b_id_farm,
        year,
    )

    // 3. Check the organic certification status for the farm.
    // This is relevant for specific organic-rich fertilizer regulations.
    // The date is set to mid-year to ensure it falls within the certification period if applicable.
    const has_organic_certification = await isOrganicCertificationValid(
        fdm,
        principal_id,
        b_id_farm,
        new Date(year, 4, 15), // May 15th of the specified year
    )

    // 4. Retrieve all cultivations associated with the field within the defined cultivation timeframe.
    // This data is used to determine land use (e.g., bouwland/grasland).
    const cultivations = await getCultivations(
        fdm,
        principal_id,
        b_id,
        timeframe2025,
    )

    // 5. Retrieve all fertilizer applications for the farm within the current year's timeframe.
    const applications = await getFertilizerApplications(
        fdm,
        principal_id,
        b_id,
        timeframe2025,
    )
    // 6. Retrieve details of all fertilizers used on the farm.
    const fertilizers = await getFertilizers(fdm, principal_id, b_id_farm)

    // Assemble all collected data into the standardized NL2025NormsFillingInput object.
    return {
        cultivations: cultivations,
        applications: applications,
        fertilizers: fertilizers,
        has_organic_certification: has_organic_certification,
        has_grazing_intention: has_grazing_intention,
        fosfaatgebruiksnorm: fosfaatgebruiksnorm,
        b_centroid: b_centroid,
    }
}
