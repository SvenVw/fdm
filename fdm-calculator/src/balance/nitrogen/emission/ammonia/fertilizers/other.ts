import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../../types"
import { determineManureAmmoniaEmissionFactor } from "./manure"

/**
 * Calculates the ammonia emissions from "other" fertilizer types.
 *
 * This function iterates through fertilizer applications and filters out known
 * types (manure, mineral, compost). For any remaining "other" fertilizer types,
 * the ammonia emission is currently calculated like manure and other organic fertilizers.
 *
 * @param cultivations - An array of cultivation records for the field.
 * @param fertilizerApplications - An array of fertilizer application records.
 * @param cultivationDetailsMap - A Map where keys are cultivation IDs and values are detailed cultivation information.
 * @param fertilizerDetailsMap - A Map where keys are fertilizer catalogue IDs and values are detailed fertilizer information.
 * @returns An object containing the total ammonia emissions from other fertilizers and a breakdown by individual application.
 * @throws Error if a fertilizer application references a non-existent fertilizer detail.
 */
export function calculateNitrogenEmissionViaAmmoniaByOtherFertilizers(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers["other"] {
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

        // Determine emission factor
        const emissionFactor = determineManureAmmoniaEmissionFactor(
            application,
            cultivations,
            cultivationDetailsMap,
        )

        // Calculate for this application the amount of Nitrogen supplied by manure
        const p_app_amount = new Decimal(application.p_app_amount ?? 0)
        const applicationValue = p_app_amount
            .times(p_nh4_rt)
            .times(emissionFactor)
            .dividedBy(1000) // convert from g N to kg N
            .times(-1) // Return negative value

        return {
            id: application.p_app_id,
            value: applicationValue,
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
