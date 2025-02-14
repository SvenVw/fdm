import {
    type FdmType,
    getFertilizerApplications,
    getFertilizers,
    getField,
} from "@svenvw/fdm-core"
import { calculateDose } from "./calculate-dose"
import type { Dose } from "./d"

/**
 * Calculates the total NPK dose applied to a specific field.
 *
 * @param fdm The FDM data object.
 * @param b_id The ID of the field.
 * @returns A Promise resolving to the total NPK dose applied to the field.
 */
export async function getDoseForField({
    fdm,
    b_id,
}: {
    fdm: FdmType
    b_id: string
}): Promise<Dose> {
    // Get the fertilizer applications for this field
    try {
        // Get the fertilizer applications for this field
        const applications = await getFertilizerApplications(fdm, b_id)

        // Get the id of the farm
        const field = await getField(fdm, b_id)
        const farmId = field.b_id_farm

        // Get the properties of the fertilizers that are used for the applications
        const fertilizers = await getFertilizers(fdm, farmId)

        // Calculate the dose per nutrient for this field
        return calculateDose({ applications, fertilizers })
    } catch (error) {
        throw new Error(
            `Failed to calculate dose for field ${b_id}: ${error.message}`,
        )
    }
}
