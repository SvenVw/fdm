import { FdmCalculatorError } from "../../../error"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalanceInput,
    NitrogenSupply,
    SoilAnalysisPicked,
} from "../types"
import { calculateNitrogenSupplyByDeposition } from "./deposition"
import { calculateNitrogenSupplyByFertilizers } from "./fertilizers"
import { calculateNitrogenFixation } from "./fixation"
import { calculateNitrogenSupplyBySoilMineralization } from "./mineralization"

/**
 * Calculates the total nitrogen supply for a field, considering various sources such as fertilizers,
 * biological fixation, atmospheric deposition, and soil mineralization.
 *
 * @param field - The field for which to calculate the nitrogen supply.
 * @param cultivations - A list of cultivations on the field.
 * @param fertilizerApplications - A list of fertilizer applications on the field.
 * @param soilAnalysis - Combined soil analysis data for the field.
 * @param cultivationDetailsMap - A map containing details for each cultivation, including its nitrogen fixation value.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer, including its type and nitrogen content.
 * @param timeFrame - The time frame for which to calculate the nitrogen supply.
 * @param fdmPublicDataUrl - The base URL for accessing FDM public data, including the deposition raster dataset.
 *
 * @returns A promise that resolves with an object containing the total nitrogen supply for the field,
 *  as well as a breakdown by source (fertilizers, fixation, deposition, and mineralization).
 */
export async function calculateNitrogenSupply(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalysis: SoilAnalysisPicked,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: string,
): Promise<NitrogenSupply> {
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

        // Calculate the amount of Nitrogen supplied by deposition
        const depositionSupply = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )

        // Calculate the amount of Nitrogen supplied by mineralization from the soil
        const mineralisationSupply =
            calculateNitrogenSupplyBySoilMineralization(soilAnalysis, timeFrame)

        // Calculate the total amount of Nitrogen supplied
        const totalSupply = fertilizersSupply.total
            .add(fixationSupply.total)
            .add(depositionSupply.total)
            .add(mineralisationSupply.total)

        const supply = {
            total: totalSupply,
            fertilizers: fertilizersSupply,
            fixation: fixationSupply,
            deposition: depositionSupply,
            mineralisation: mineralisationSupply,
        }

        return supply
    } catch (error) {
        if (error instanceof FdmCalculatorError) {
            throw error
        }
        throw new FdmCalculatorError(
            `Failed to calculate nitrogen supply: ${error instanceof Error ? error.message : "Unknown error"}`,
            "CALCULATION_FAILED",
            { error },
        )
    }
}
