import { Decimal } from "decimal.js"
import type { NitrogenRemoval } from "./types"

export function calculateNitrogenRemoval(): NitrogenRemoval {
    const removal = {
        total: Decimal(0),
        harvestables: {
            total: Decimal(0),
            harvestables: [],
        },
        residues: {
            total: Decimal(0),
            harvestables: [],
        },
    }

    return removal
}
