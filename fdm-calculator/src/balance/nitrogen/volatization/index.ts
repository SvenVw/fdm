import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenVolatilization,
} from "../types"
import { calculateNitrogenVolatizationViaAmmoniaByResidue } from "./residues"
import { calculateAmmoniaEmissionsByFertilizers } from "./fertilizers"

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
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenVolatilization {
    /** Calculate the total amount of Nitrogen volatilized as Ammonia by fertilizer application */
    const fertilizers = calculateAmmoniaEmissionsByFertilizers(
        cultivations,
        fertilizerApplications,
        cultivationDetailsMap,
        fertilizerDetailsMap,
    )

    /** Calculate the total amount of Nitrogen volatilized as Ammonia by crop residues */
    const residues = calculateNitrogenVolatizationViaAmmoniaByResidue(
        cultivations,
        harvests,
        cultivationDetailsMap,
    )

    const ammonia = {
        total: fertilizers.total.add(residues.total), // Ammonia total should include fertilizers total and residues total
        fertilizers: fertilizers,
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
