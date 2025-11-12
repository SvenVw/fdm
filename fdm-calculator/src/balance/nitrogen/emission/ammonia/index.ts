/**
 * @file This module calculates ammonia (`NH3`) emissions from various agricultural sources within a field.
 * It serves as a central hub for aggregating ammonia volatilization from fertilizer applications and
 * the decomposition of crop residues.
 *
 * The main function, `calculateNitrogenEmissionViaAmmonia`, integrates these sources to provide a
 * comprehensive total of ammonia emissions.
 *
 * @packageDocumentation
 */
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenEmissionAmmonia,
} from "../../types"
import { calculateNitrogenEmissionViaAmmoniaByFertilizers } from "./fertilizers"
import { calculateNitrogenEmissionViaAmmoniaByResidues } from "./residues"

/**
 * Calculates the total ammonia (`NH3`) emission from a field.
 *
 * This function quantifies ammonia volatilization by summing emissions from two primary sources:
 * 1.  **Fertilizer Applications**: Calculates emissions based on the type, amount, and application
 *     method of fertilizers.
 * 2.  **Crop Residues**: Estimates emissions from the decomposition of leftover plant material after harvest.
 *
 * It orchestrates these calculations and aggregates the results into a single, detailed object.
 * Note: Emissions from grazing are not yet implemented.
 *
 * @param cultivations - An array of cultivations on the field.
 * @param harvests - An array of harvest events.
 * @param fertilizerApplications - An array of fertilizer application events.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type.
 * @param fertilizerDetailsMap - A map providing detailed data for each fertilizer type.
 * @returns A `NitrogenEmissionAmmonia` object detailing total and source-specific ammonia emissions.
 */
export function calculateNitrogenEmissionViaAmmonia(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenEmissionAmmonia {
    /** Calculate the total amount of Nitrogen volatilized as Ammonia by fertilizer application */
    const fertilizers = calculateNitrogenEmissionViaAmmoniaByFertilizers(
        cultivations,
        fertilizerApplications,
        cultivationDetailsMap,
        fertilizerDetailsMap,
    )

    /** Calculate the total amount of Nitrogen volatilized as Ammonia by crop residues */
    const residues = calculateNitrogenEmissionViaAmmoniaByResidues(
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

    return ammonia
}
