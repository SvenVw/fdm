import { Decimal } from "decimal.js"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenVolatilization,
} from "../types"
import { calculateNitrogenVolatizationViaAmmoniaByResidue } from "./residues"

/**
 * Calculates the total nitrogen volatilization from a field, specifically through ammonia emissions from crop residues.
 *
 * This function orchestrates the calculation of nitrogen volatilization by calling separate functions
 * for residue volatilization, then aggregates the results. It currently only considers volatilization from residues.
 * @param cultivations - A list of cultivations on the field.
 * @param harvests - A list of harvests from the field.
 * @param cultivationDetailsMap - A map containing details for each cultivation, including its nitrogen content and residue management practices.
 * @returns The NitrogenVolatilization object containing the total amount of Nitrogen volatilized and the individual ammonia values.
 */
export function calculateNitrogenVolatilization(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenVolatilization {
    /** Calculate the total amount of Nitrogen volatilized as Ammonia */
    const residues = calculateNitrogenVolatizationViaAmmoniaByResidue(
        cultivations,
        harvests,
        cultivationDetailsMap,
    )

    const ammonia = {
        total: residues.total, // Ammonia total should include residues total
        fertilizers: {
            total: Decimal(0), // Fertilizers volatilization not yet implemented
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
        grazing: undefined, // Grazing volatilization not yet implemented
    }

    // Calculate the total amount of Nitrogen volatilized (currently only ammonia from residues)
    const totalValue = ammonia.total

    const volatilization = {
        total: totalValue,
        ammonia: ammonia,
    }

    return volatilization
}
