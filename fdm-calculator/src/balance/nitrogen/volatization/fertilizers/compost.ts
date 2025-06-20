import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"
import { determineManureAmmoniaEmmissionFactor } from "./manure"

export function calculateAmmoniaEmissionsByCompost(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
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
        const p_nh4_rt = new Decimal(fertilizerDetail.p_nh4_rt ?? 0)

        // If the fertilizer used is not of the type compost
        if (fertilizerDetail.p_type !== "compost") {
            return {
                id: application.p_app_id,
                value: new Decimal(0),
            }
        }

        // Determine emission factor
        const emissionFactor = determineManureAmmoniaEmmissionFactor(
            application,
            cultivations,
            cultivationDetailsMap,
        )

        // Calculate for this application the amount of Nitrogen supplied by compost
        const p_app_amount = new Decimal(application.p_app_amount ?? 0)
        const applicationValue = p_app_amount
            .times(p_nh4_rt)
            .times(emissionFactor)
            .dividedBy(1000) // convert from g N to kg N

        return {
            id: application.p_app_id,
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