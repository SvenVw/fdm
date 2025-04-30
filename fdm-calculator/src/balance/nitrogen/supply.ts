import { Decimal } from "decimal.js"
import type { NitrogenSupply } from "./types"

export function calculateNitrogenSupply(): NitrogenSupply {
    const supply = {
        total: Decimal(0),
        fertilizers: {
            total: Decimal(0),
            mineral: {
                total: Decimal(0),
                applications: [],
            },
            organic: {
                total: Decimal(0),
                applications: [],
            },
            manure: {
                total: Decimal(0),
                applications: [],
            },
            compost: {
                total: Decimal(0),
                applications: [],
            },
        },
        fixation: {
            total: Decimal(0),
            cultivations: [],
        },
        deposition: Decimal(0),
        mineralisation: Decimal(0),
    }

    return supply
}
