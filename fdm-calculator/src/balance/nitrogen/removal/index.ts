import { Decimal } from "decimal.js"
import type { CultivationDetail, FieldInput, NitrogenRemoval } from "../types"
import { calculateNitrogenRemovalByHarvests } from "./harvest"

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

    // Calculate the total amount of Nitrogen removed
    const totalValue = harvestsRemoval.total

    const removal = {
        total: totalValue,
        harvests: harvestsRemoval,
        residues: {
            total: Decimal(0),
            harvestables: [],
        },
    }

    return removal
}
