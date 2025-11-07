/**
 * @file This module serves as the central aggregator for calculating the total nitrogen supply
 * to a field. It integrates various nitrogen input pathways to provide a comprehensive overview
 * of nitrogen sources.
 *
 * The primary function, `calculateNitrogenSupply`, orchestrates calls to specialized
 * calculators for fertilizers, biological fixation, and soil mineralization, and combines
 * these with pre-calculated atmospheric deposition data.
 *
 * @packageDocumentation
 */
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalanceInput,
    NitrogenSupply,
    SoilAnalysisPicked,
} from "../types"
import { calculateNitrogenSupplyByFertilizers } from "./fertilizers"
import { calculateNitrogenFixation } from "./fixation"
import { calculateNitrogenSupplyBySoilMineralization } from "./mineralization"

/**
 * Calculates the total nitrogen supply for a single field from all relevant sources.
 *
 * This function acts as an orchestrator, summing the nitrogen inputs from:
 * 1.  **Fertilizers**: Nitrogen from applied mineral and organic fertilizers.
 * 2.  **Biological Fixation**: Nitrogen fixed from the atmosphere by leguminous crops.
 * 3.  **Atmospheric Deposition**: Nitrogen deposited on the field from the atmosphere (pre-calculated).
 * 4.  **Soil Mineralization**: Nitrogen released from the decomposition of soil organic matter.
 *
 * It calls dedicated functions for each component and aggregates them into a `NitrogenSupply` object.
 *
 * @param cultivations - An array of the field's cultivations.
 * @param fertilizerApplications - An array of fertilizer applications.
 * @param soilAnalysis - The consolidated soil analysis data for the field.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type.
 * @param fertilizerDetailsMap - A map providing detailed data for each fertilizer type.
 * @param depositionSupply - The pre-calculated nitrogen supply from atmospheric deposition.
 * @param timeFrame - The time period for which the supply is being calculated.
 * @returns A `NitrogenSupply` object detailing the total and source-specific nitrogen inputs.
 * @throws {Error} If any of the underlying supply calculations fail.
 */
export function calculateNitrogenSupply(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalysis: SoilAnalysisPicked,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    depositionSupply: NitrogenSupply["deposition"],
    timeFrame: NitrogenBalanceInput["timeFrame"],
): NitrogenSupply {
    try {
        // Calculate the amount of Nitrogen supplied by fertilizers
        const fertilizersSupply = calculateNitrogenSupplyByFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        // Calculate the amount of Nitrogen fixated by the cultivations
        const fixationSupply = calculateNitrogenFixation(
            cultivations,
            cultivationDetailsMap,
        )

        // Calculate the amount of Nitrogen supplied by mineralization from the soil
        const mineralisationSupply =
            calculateNitrogenSupplyBySoilMineralization(
                cultivations,
                soilAnalysis,
                cultivationDetailsMap,
                timeFrame,
            )

        // Calculate the total amount of Nitrogen supplied
        const totalSupply = fertilizersSupply.total
            .add(fixationSupply.total)
            .add(depositionSupply.total)
            .add(mineralisationSupply.total)

        return {
            total: totalSupply,
            fertilizers: fertilizersSupply,
            fixation: fixationSupply,
            deposition: depositionSupply,
            mineralisation: mineralisationSupply,
        }
    } catch (error) {
        console.error("Error calculating nitrogen supply:", error)
        throw new Error(
            `Failed to calculate nitrogen supply: ${error instanceof Error ? error.message : "Unknown error"}`,
        )
    }
}
