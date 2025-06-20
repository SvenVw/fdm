import Decimal from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"

export function calculateAmmoniaEmissionsByOtherFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers["compost"] {
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

        // If the fertilizer used is not of the type other fertilizers
        if (
            fertilizerDetail.p_type === "manure" ||
            fertilizerDetail.p_type === "mineral" ||
            fertilizerDetail.p_type === "compost"
        ) {
            return {
                id: application.p_app_id,
                value: new Decimal(0),
            }
        }

        // As no calculation method is available for other fertilizers, set the emission to 0
        return {
            id: application.p_app_id,
            value: new Decimal(0),
        }
    })

    // Calculate the total amount of Nitrogen supplied by other fertilizers
    const totalValue = applications.reduce((acc, application) => {
        return acc.add(application.value)
    }, Decimal(0))

    return {
        total: totalValue,
        applications: applications,
    }
}
