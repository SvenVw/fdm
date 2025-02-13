import {
    type FdmType,
    getFertilizerApplications,
    getFertilizers,
    getField,
} from "@svenvw/fdm-core"
import { calculateDose } from "./calculate-dose"
import type { Dose } from "./d"

export async function getDoseForField({
    fdm,
    b_id,
}: {
    fdm: FdmType
    b_id: string
}): Promise<Dose> {
    // Get the fertilizer applications for this field
    const applications = await getFertilizerApplications(fdm, b_id)

    // Get the id of the farm
    const field = await getField(fdm, b_id)
    const b_id_farm = field.b_id_farm

    // Get the properties of the fertilizers that are used for the applications
    const fertilizers = await getFertilizers(fdm, b_id_farm)

    // Calculate the dose per nutrient for this fields
    const doses = calculateDose({ applications, fertilizers })

    return doses
}
