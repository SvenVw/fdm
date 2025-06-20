import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmoniaFertilizers,
} from "../../types"
// import { calculateNitrogenVolatilizationByCompost } from "./compost"
import { calculateAmmoniaEmissionsByManure } from "./manure"
// import { calculateNitrogenVolatilizationByMineralFertilizers } from "./mineral"
// import { calculateNitrogenVolatilizationByOtherFertilizers } from "./other"

/**
 * Calculates the total ammonia emission from all fertilizer sources (mineral, manure, compost and other fertilizers).
 *
 * This function aggregates the nitrogen contributions from mineral fertilizers, manure, compost and other fertilizers
 * by calling individual calculation functions for each fertilizer type and summing their results.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @returns An object containing the total ammonia emitted by all fertilizers, as well as a breakdown by fertilizer type (mineral, manure, compost, other).
 */
export function calculateAmmoniaEmissionsByFertilizers(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmoniaFertilizers {
    // Calculate the amount of ammonia emitted by mineral fertilizers
    // const fertilizersVolatilizationMineral =
    //     calculateNitrogenVolatilizationByMineralFertilizers(
    //         fertilizerApplications,
    //         fertilizerDetailsMap,
    //     )

    // Calculate the amount of ammonia emitted by manure
    const fertilizersAmmoniaEmissionsManure = calculateAmmoniaEmissionsByManure(
        cultivations,
        fertilizerApplications,
        cultivationDetailsMap,
        fertilizerDetailsMap,
    )

    // // Calculate the amount of ammonia emitted by compost
    // const fertilizersVolatilizationCompost =
    //     calculateNitrogenVolatilizationByCompost(
    //         fertilizerApplications,
    //         fertilizerDetailsMap,
    //     )

    // // Calculate the amount of ammonia emitted by othyer fertilizers
    // const fertilizersVolatilizationOther =
    //     calculateNitrogenVolatilizationByOtherFertilizers(
    //         fertilizerApplications,
    //         fertilizerDetailsMap,
    //     )

    // Calculate the total amount of ammonia emitted by fertilizers
    const fertilizersTotal = fertilizersAmmoniaEmissionsnMineral.total
        .add(fertilizersAmmoniaEmissionsManure.total)
        .add(fertilizersVolatilizationCompost.total)
        .add(fertilizersVolatilizationOther.total)

    const fertilizers = {
        total: fertilizersTotal,
        mineral: fertilizersVolatilizationMineral,
        manure: fertilizersAmmoniaEmissionsManure,
        compost: fertilizersVolatilizationCompost,
        other: fertilizersVolatilizationOther,
    }
    return fertilizers
}
