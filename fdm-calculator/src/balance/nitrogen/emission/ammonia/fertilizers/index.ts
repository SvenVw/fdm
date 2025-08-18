import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../../types"
import { calculateNitrogenEmissionViaAmmoniaByCompost } from "./compost"
import { calculateNitrogenEmissionViaAmmoniaByManure } from "./manure"
import { calculateNitrogenEmissionViaAmmoniaByMineralFertilizers } from "./mineral"
import { calculateNitrogenEmissionViaAmmoniaByOtherFertilizers } from "./other"

/**
 * Calculates the total ammonia emission from all fertilizer sources (mineral, manure, compost and other fertilizers).
 *
 * This function aggregates the nitrogen contributions from mineral fertilizers, manure, compost and other fertilizers
 * by calling individual calculation functions for each fertilizer type and summing their results.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @returns An object containing the total ammonia emitted by all fertilizers, as well as a breakdown by fertilizer type (mineral, manure, compost, other).
 */
export function calculateNitrogenEmissionViaAmmoniaByFertilizers(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers {
    // Calculate the amount of ammonia emitted by mineral fertilizers
    const fertilizersAmmoniaEmissionsMineral =
        calculateNitrogenEmissionViaAmmoniaByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

    // Calculate the amount of ammonia emitted by manure
    const fertilizersAmmoniaEmissionsManure =
        calculateNitrogenEmissionViaAmmoniaByManure(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

    // Calculate the amount of ammonia emitted by compost
    const fertilizersAmmoniaEmissionsCompost =
        calculateNitrogenEmissionViaAmmoniaByCompost(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

    // Calculate the amount of ammonia emitted by other fertilizers
    const fertilizersAmmoniaEmissionsByOtherFertilizers =
        calculateNitrogenEmissionViaAmmoniaByOtherFertilizers(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

    // Calculate the total amount of ammonia emitted by fertilizers
    const fertilizersTotal = fertilizersAmmoniaEmissionsMineral.total
        .add(fertilizersAmmoniaEmissionsManure.total)
        .add(fertilizersAmmoniaEmissionsCompost.total)
        .add(fertilizersAmmoniaEmissionsByOtherFertilizers.total)

    const fertilizers = {
        total: fertilizersTotal,
        mineral: fertilizersAmmoniaEmissionsMineral,
        manure: fertilizersAmmoniaEmissionsManure,
        compost: fertilizersAmmoniaEmissionsCompost,
        other: fertilizersAmmoniaEmissionsByOtherFertilizers,
    }
    return fertilizers
}
