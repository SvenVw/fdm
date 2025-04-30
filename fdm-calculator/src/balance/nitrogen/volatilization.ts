import { Decimal } from "decimal.js"
import type { NitrogenVolatilization } from "./types"

export function calculateNitrogenVolatilization(): NitrogenVolatilization {
    const volatilization = {
        total: Decimal(0),
        ammonia: {
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
            },
            residues: {
                total: Decimal(0),
                harvestables: [],
            },
            grazing: undefined,
        },
    }

    return volatilization
}
