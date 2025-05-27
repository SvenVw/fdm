import type {
    FertilizerDetail,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../../types"
import { calculateNitrogenSupplyByMineralFertilizers } from "./mineral"
import { calculateNitrogenSupplyByManure } from "./manure"
import { calculateNitrogenSupplyByCompost } from "./compost"
import { calculateNitrogenSupplyByOtherFertilizers } from "./other"

/**
 * Calculates the total nitrogen supply from all fertilizer sources (mineral, manure, compost and other fertilizers).
 *
 * This function aggregates the nitrogen contributions from mineral fertilizers, manure, compost and other fertilizers
 * by calling individual calculation functions for each fertilizer type and summing their results.
 * @param fertilizerApplications - An array of fertilizer applications, each containing the application amount and a reference to the fertilizer details.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @returns An object containing the total nitrogen supplied by all fertilizers, as well as a breakdown by fertilizer type (mineral, manure, compost, other).
 */
export function calculateNitrogenSupplyByFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenSupplyFertilizers {
    // Calculate the amount of Nitrogen supplied by mineral fertilizers
    const fertilizersSupplyMineral =
        calculateNitrogenSupplyByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

    // Calculate the amount of Nitrogen supplied by manure
    const fertilizersSupplyManure = calculateNitrogenSupplyByManure(
        fertilizerApplications,
        fertilizerDetailsMap,
    )

    // Calculate the amount of Nitrogen supplied by compost
    const fertilizersSupplyCompost = calculateNitrogenSupplyByCompost(
        fertilizerApplications,
        fertilizerDetailsMap,
    )

    // Calculate the amount of Nitrogen supplied by othyer fertilizers
    const fertilizersSupplyOther = calculateNitrogenSupplyByOtherFertilizers(
        fertilizerApplications,
        fertilizerDetailsMap,
    )

    // Calculate the total amount of Nitrogen supplied by fertilizers
    const fertilizersTotal = fertilizersSupplyMineral.total
        .add(fertilizersSupplyManure.total)
        .add(fertilizersSupplyCompost.total)
        .add(fertilizersSupplyOther.total)

    const fertilizers = {
        total: fertilizersTotal,
        mineral: fertilizersSupplyMineral,
        manure: fertilizersSupplyManure,
        compost: fertilizersSupplyCompost,
        other: fertilizersSupplyOther
    }
    return fertilizers
}
