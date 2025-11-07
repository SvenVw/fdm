/**
 * @file This module provides a high-level function to calculate nutrient doses for a specific
 * field by fetching the necessary data from the FDM core services.
 *
 * It orchestrates the process of retrieving field data, fertilizer applications, and
 * fertilizer definitions before using the `calculateDose` function to perform the calculation.
 *
 * @packageDocumentation
 */
import {
    type FdmType,
    getFertilizerApplications,
    getFertilizers,
    getField,
    type PrincipalId,
} from "@svenvw/fdm-core"
import { calculateDose } from "./calculate-dose"
import type { Dose } from "./d"

/**
 * Fetches all necessary data and calculates the total nutrient dose for a specific field.
 *
 * This function acts as a wrapper that:
 * 1.  Retrieves all fertilizer applications for the given field ID.
 * 2.  Fetches the field details to identify the parent farm.
 * 3.  Retrieves the list of all available fertilizers for that farm.
 * 4.  Calls the `calculateDose` function with the fetched data to compute the total
 *     nutrient doses.
 *
 * @param params - The input object for the calculation.
 * @param params.fdm - The FDM core data access object.
 * @param params.principal_id - The identifier of the user or system making the request.
 * @param params.b_id - The unique identifier of the field.
 * @returns A promise that resolves to the calculated `Dose` object for the field.
 * @throws {Error} If any of the data fetching steps or the final dose calculation fails.
 */
export async function getDoseForField({
    fdm,
    principal_id,
    b_id,
}: {
    fdm: FdmType
    principal_id: PrincipalId
    b_id: string
}): Promise<Dose> {
    // Get the fertilizer applications for this field
    try {
        // Get the fertilizer applications for this field
        const applications = await getFertilizerApplications(
            fdm,
            principal_id,
            b_id,
        )

        // Get the id of the farm
        const field = await getField(fdm, principal_id, b_id)
        const farmId = field.b_id_farm

        // Get the properties of the fertilizers that are used for the applications
        const fertilizers = await getFertilizers(fdm, principal_id, farmId)

        // Calculate the dose per nutrient for this field
        return calculateDose({ applications, fertilizers })
    } catch (error) {
        throw new Error(
            `Failed to calculate dose for field ${b_id}: ${error.message}`,
        )
    }
}
