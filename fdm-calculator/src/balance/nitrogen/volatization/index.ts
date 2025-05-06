import { Decimal } from "decimal.js"
import type { CultivationDetail, FieldInput, NitrogenVolatilization } from "../types"
import { calculateNitrogenVolatizationViaAmmoniaByResidue } from "./residues"

export function calculateNitrogenVolatilization(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetails: Map<string, CultivationDetail>,
): NitrogenVolatilization {

    // Calculate the total amount of Nitrogen volatilized as Ammonia
    const residues = calculateNitrogenVolatizationViaAmmoniaByResidue(cultivations, harvests, cultivationDetails)

    const ammonia = {
        total: Decimal(0),
        fertilizers: {
            total: Decimal(0),
            mineral: {
                total: Decimal(0),
                applications: [],
            },
            manure: {
                total: Decimal(0),
                applications: [],
            },
        },
        residues: residues,
        grazing: undefined,
    }

    // Calculate the total ammount of Nitrogen volatilized
    const totalValue = ammonia.total

    const volatilization = {
        total: totalValue,
        ammonia: ammonia,
    }

    return volatilization
}
