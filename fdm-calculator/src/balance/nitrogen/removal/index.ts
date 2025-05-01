import type { CultivationDetail, FieldInput, NitrogenRemoval } from "../types"
import { calculateNitrogenRemovalByHarvests } from "./harvest"
import { calculateNitrogenRemovalByResidue } from "./residue"

export function calculateNitrogenRemoval(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetails: CultivationDetail[],
): NitrogenRemoval {
    // Calculate the amount of Nitrogen removed by harvests
    const harvestsRemoval = calculateNitrogenRemovalByHarvests(
        cultivations,
        harvests,
        cultivationDetails,
    )

    // Calculate the amount of Nitrogen removed by crop residues
    const residuesRemoval = calculateNitrogenRemovalByResidue(
        cultivations,
        harvests,
        cultivationDetails,
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
