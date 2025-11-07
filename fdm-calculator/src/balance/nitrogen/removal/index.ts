/**
 * @file This module calculates the total nitrogen removal from a field by considering all pathways
 * through which nitrogen is intentionally removed. It serves as an aggregator for various removal
 * processes.
 *
 * The primary function, `calculateNitrogenRemoval`, combines the nitrogen removed through crop
 * harvests and the removal of crop residues.
 *
 * @packageDocumentation
 */
import type { CultivationDetail, FieldInput, NitrogenRemoval } from "../types"
import { calculateNitrogenRemovalByHarvests } from "./harvest"
import { calculateNitrogenRemovalByResidue } from "./residue"

/**
 * Calculates the total nitrogen removal from a field.
 *
 * This function quantifies the total amount of nitrogen removed from the field by summing the
 * nitrogen exported through two main pathways:
 * 1.  **Crop Harvest**: Nitrogen contained in the harvested portion of the crops.
 * 2.  **Residue Removal**: Nitrogen contained in crop residues that are removed from the field
 *     (as opposed to being incorporated into the soil).
 *
 * It calls specialized calculators for each pathway and aggregates their results.
 *
 * @param cultivations - An array of all cultivations on the field.
 * @param harvests - An array of all harvest events.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type.
 * @returns A `NitrogenRemoval` object detailing the total and component-specific nitrogen removals.
 */
export function calculateNitrogenRemoval(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenRemoval {
    // Calculate the amount of Nitrogen removed by harvests
    const harvestsRemoval = calculateNitrogenRemovalByHarvests(
        cultivations,
        harvests,
        cultivationDetailsMap,
    )

    // Calculate the amount of Nitrogen removed by crop residues
    const residuesRemoval = calculateNitrogenRemovalByResidue(
        cultivations,
        harvests,
        cultivationDetailsMap,
    )

    // Calculate the total amount of Nitrogen removed (sum of harvest and residue removal)
    const totalValue = harvestsRemoval.total.add(residuesRemoval.total)

    const removal = {
        total: totalValue,
        harvests: harvestsRemoval,
        residues: residuesRemoval,
    }

    return removal
}
