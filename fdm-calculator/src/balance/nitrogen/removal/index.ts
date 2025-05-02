import type { CultivationDetail, FieldInput, NitrogenRemoval } from "../types"
import { calculateNitrogenRemovalByHarvests } from "./harvest"
import { calculateNitrogenRemovalByResidue } from "./residue"

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

    // Calculate the total amount of Nitrogen removed
    const totalValue = harvestsRemoval.total

    const removal = {
        total: totalValue,
        harvests: harvestsRemoval,
        residues: residuesRemoval,
    }

    return removal
}
