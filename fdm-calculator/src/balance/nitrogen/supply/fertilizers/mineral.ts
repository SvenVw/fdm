import { Decimal } from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../../types"

/**
 * Calculates the amount of nitrogen supplied by mineral fertilizer applications.
 *
 * This function iterates through the provided fertilizer applications, identifies those that are of the 'mineral' type,
 * and calculates the total nitrogen supplied based on the application amount and the nitrogen content of the fertilizer.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @returns An object containing the total nitrogen supplied by mineral fertilizers and a list of individual mineral fertilizer applications with their nitrogen contributions.
 */
export function calculateNitrogenSupplyByMineralFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenSupplyFertilizers["mineral"] {
    if (fertilizerApplications.length === 0) {
        return {
            total: new Decimal(0),
            applications: [],
        }
    }
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
        const p_type_mineral = fertilizerDetail.p_type_mineral
        const p_n_rt = new Decimal(fertilizerDetail.p_n_rt).dividedBy(1000) // Convert from g N / kg to kg N / kg

        // If the fertilizer used is not of the type mineral
        if (p_type_mineral === false) {
            return {
                id: application.p_id_catalogue,
                value: new Decimal(0),
            }
        }

        /** Calculate for this application the amount of Nitrogen supplied with the mineral fertilizer */
        const p_app_amount = new Decimal(application.p_app_amount)
        const applicationValue = p_app_amount.times(p_n_rt)

        return {
            id: application.p_id_catalogue,
            value: applicationValue,
        }
    })

    /** Calculate the total amount of Nitrogen supplied by mineral fertilizers */
    const totalValue = applications.reduce((acc, application) => {
        return acc.add(application.value)
    }, Decimal(0))

    return {
        total: totalValue,
        applications: applications,
    }
}
