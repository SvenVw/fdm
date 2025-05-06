import { Decimal } from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../../types"

/**
 * Calculates the amount of nitrogen supplied by manure applications.
 *
 * This function iterates through the provided fertilizer applications, identifies those that are of the 'manure' type,
 * and calculates the total nitrogen supplied based on the application amount and the nitrogen content of the manure.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @returns An object containing the total nitrogen supplied by manure and a list of individual manure applications with their nitrogen contributions.
 * The values are of type: NitrogenSupplyFertilizers["manure"]
 */
export function calculateNitrogenSupplyByManure(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenSupplyFertilizers["manure"] {
    const applications = fertilizerApplications.map((application) => {
        // Get fertilizerDetails of application using the Map
        const fertilizerDetail = fertilizerDetailsMap.get(
            application.p_id_catalogue,
        )

        if (!fertilizerDetail) {
            throw new Error(
                `Fertilizer application ${application.p_app_id} has no fertilizerDetails`,
            )
        }
        const p_type_manure = fertilizerDetail.p_type_manure
        const p_n_rt = new Decimal(fertilizerDetail.p_n_rt)

        // If the fertilizer used is not of the type manure
        if (p_type_manure === false) {
            return {
                id: application.p_id_catalogue,
                value: new Decimal(0),
            }
        }

        // Calculate for this application the amount of Nitrogen supplied by manure
        const p_app_amount = new Decimal(application.p_app_amount)
        const applicationValue = p_app_amount.times(p_n_rt).dividedBy(1000) // convert from g N to kg N

        return {
            id: application.p_id_catalogue,
            value: applicationValue,
        }
    })

    // Calculate the total amount of Nitrogen supplied by manure
    const totalValue = applications.reduce((acc, application) => {
        return acc.add(application.value)
    }, Decimal(0))

    return {
        total: totalValue,
        applications: applications,
    }
}
