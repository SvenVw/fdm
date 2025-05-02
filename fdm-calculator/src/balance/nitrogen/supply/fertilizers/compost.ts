import { Decimal } from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../../types"

export function calculateNitrogenSupplyByCompost(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenSupplyFertilizers["compost"] {
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

        const p_type_compost = fertilizerDetail.p_type_compost
        const p_n_rt = new Decimal(fertilizerDetail.p_n_rt).times(1000) // Convert from g N / kg to kg N / kg

        // If the fertilizer used is not of the type compost
        if (p_type_compost === false) {
            return {
                id: application.p_id_catalogue,
                value: new Decimal(0),
            }
        }

        // Calculate for this application the amount of Nitrogen supplied by compost
        const p_app_amount = new Decimal(application.p_app_amount)
        const applicationValue = p_app_amount.times(p_n_rt)

        return {
            id: application.p_id_catalogue,
            value: applicationValue,
        }
    })

    // Calculate the total amount of Nitrogen supplied by compost
    const totalValue = applications.reduce((acc, application) => {
        return acc.add(application.value)
    }, Decimal(0))

    return {
        total: totalValue,
        applications: applications,
    }
}
