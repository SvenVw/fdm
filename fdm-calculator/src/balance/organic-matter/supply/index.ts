import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    OrganicMatterBalanceInput,
    OrganicMatterSupply,
} from "../types.d"
import { calculateOrganicMatterSupplyByFertilizers } from "./fertilizers"
import { calculateOrganicMatterSupplyByCultivations } from "./cultivation"
import { calculateOrganicMatterSupplyByResidues } from "./residues"

/**
 * Calculates the total organic matter supply for a field, considering various sources such as fertilizers,
 * cultivations, and residues.
 *
 * @param cultivations - A list of cultivations on the field.
 * @param fertilizerApplications - A list of fertilizer applications on the field.
 * @param cultivationDetailsMap - A map containing details for each cultivation.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer.
 * @param timeFrame - The time frame for which to calculate the organic matter supply.
 *
 * @returns An object containing the total organic matter supply for the field,
 *  as well as a breakdown by source (fertilizers, cultivations, and residues).
 */
export function calculateOrganicMatterSupply(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    timeFrame: OrganicMatterBalanceInput["timeFrame"],
): OrganicMatterSupply {
    try {
        // Calculate the amount of Organic Matter supplied by fertilizers
        const fertilizersSupply = calculateOrganicMatterSupplyByFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        // Calculate the amount of Organic Matter supplied by cultivations
        const cultivationsSupply = calculateOrganicMatterSupplyByCultivations(
            cultivations,
            cultivationDetailsMap,
        )

        // Calculate the amount of Organic Matter supplied by residues
        const residuesSupply = calculateOrganicMatterSupplyByResidues(
            cultivations,
            cultivationDetailsMap,
            timeFrame,
        )

        // Calculate the total amount of Organic Matter supplied
        const totalSupply = fertilizersSupply.total
            .plus(cultivationsSupply.total)
            .plus(residuesSupply.total)

        return {
            total: totalSupply,
            fertilizers: fertilizersSupply,
            cultivations: cultivationsSupply,
            residues: residuesSupply,
        }
    } catch (error) {
        console.error("Error calculating organic matter supply:", error)
        throw new Error(
            `Failed to calculate organic matter supply: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
    }
}
