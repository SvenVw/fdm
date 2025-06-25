import Decimal from "decimal.js"
import type {
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"

/**
 * Calculates the ammonia emissions from "other" fertilizer types.
 *
 * This function iterates through fertilizer applications and filters out known
 * types (manure, mineral, compost). For any remaining "other" fertilizer types,
 * the ammonia emission is currently set to 0 as no specific calculation method
 * is available.
 *
 * @param fertilizerApplications - An array of fertilizer application records.
 * @param fertilizerDetailsMap - A Map where keys are fertilizer catalogue IDs and values are detailed fertilizer information.
 * @returns An object containing the total ammonia emissions from other fertilizers and a breakdown by individual application.
 * @throws Error if a fertilizer application references a non-existent fertilizer detail.
 */
export function calculateAmmoniaEmissionsByOtherFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
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
