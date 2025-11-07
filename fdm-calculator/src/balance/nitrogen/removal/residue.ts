/**
 * @file This module is responsible for calculating nitrogen removal from a field that occurs
 * when crop residues are taken away after harvest.
 *
 * The primary function, `calculateNitrogenRemovalByResidue`, quantifies this removal
 * for each cultivation.
 *
 * @packageDocumentation
 */
import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenRemovalResidues,
} from "../types"

/**
 * Calculates the total nitrogen removed from a field through the removal of crop residues.
 *
 * This function estimates the amount of nitrogen exported from the field when crop residues
 * (e.g., straw, stalks) are removed rather than incorporated into the soil. The calculation
 * is performed for each cultivation and depends on:
 * - Whether the residues were actually removed (`m_cropresidue` flag).
 * - The total biomass of the residue, calculated from the harvest yield and the crop's harvest index.
 * - The nitrogen concentration of the residue (`b_lu_n_residue`).
 *
 * It aggregates the results from all relevant cultivations to provide a total for the field.
 *
 * @param cultivations - An array of all cultivations on the field.
 * @param harvests - An array of all harvest events, used to determine average yield.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type.
 * @returns An object detailing the total and per-cultivation nitrogen removal from residues.
 * @throws {Error} If cultivation details are missing for a given cultivation.
 */
export function calculateNitrogenRemovalByResidue(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenRemovalResidues {
    if (cultivations.length === 0) {
        return {
            total: new Decimal(0),
            cultivations: [],
        }
    }
    const removalsResidue = cultivations.map((cultivation) => {
        // Get details of cultivation using the Map
        const cultivationDetail = cultivationDetailsMap.get(
            cultivation.b_lu_catalogue,
        )

        if (!cultivationDetail) {
            throw new Error(
                `Cultivation ${cultivation.b_lu} has no corresponding cultivation in cultivationDetails`,
            )
        }

        // If no crop residues are left or if this is not known return 0 for the amount of Nitrogen removed by crop residues
        if (!cultivation.m_cropresidue || cultivation.m_cropresidue === false) {
            return {
                id: cultivation.b_lu,
                value: new Decimal(0),
            }
        }

        // Get the (total) yield for this crop and number of harvests
        let totalYield = new Decimal(0)
        let harvestCount = 0
        let b_lu_yield = new Decimal(0)
        for (const harvest of harvests.filter(
            (h) => h.b_lu === cultivation.b_lu,
        )) {
            let yieldForThisHarvest: Decimal | null = null
            if (
                harvest.harvestable?.harvestable_analyses &&
                harvest.harvestable.harvestable_analyses.length > 0
            ) {
                // Prioritize the specific yield if available
                const analysisWithYield =
                    harvest.harvestable.harvestable_analyses.find(
                        (analysis: { b_lu_yield: number | undefined }) =>
                            analysis.b_lu_yield !== undefined &&
                            analysis.b_lu_yield !== null,
                    )
                if (analysisWithYield) {
                    yieldForThisHarvest = new Decimal(
                        analysisWithYield.b_lu_yield,
                    )
                }
            }

            // Fallback to default yield from cultivation_catalogue
            if (yieldForThisHarvest === null) {
                yieldForThisHarvest = new Decimal(
                    cultivationDetail.b_lu_yield ?? 0,
                )
            }

            if (yieldForThisHarvest !== null) {
                totalYield = totalYield.add(yieldForThisHarvest)
                harvestCount++
            }
        }

        // Get the average yield for the cultivation
        if (harvestCount === 0) {
            // Return default yield from cultivation catalogue
            b_lu_yield = new Decimal(cultivationDetail.b_lu_yield ?? 0)
        } else {
            b_lu_yield = totalYield.dividedBy(harvestCount)
        }

        // Get the harvest for crop residues
        const b_lu_hi = new Decimal(cultivationDetail.b_lu_hi ?? 0)
        const b_lu_hi_res = new Decimal(1).minus(b_lu_hi)

        // Get the Nitrogen content of the crop residues
        const b_lu_n_residue = new Decimal(
            cultivationDetail.b_lu_n_residue ?? 0,
        )

        // If cultivation has no residues possible return 0
        if (b_lu_hi.isZero()) {
            return {
                id: cultivation.b_lu,
                value: new Decimal(0),
            }
        }

        // Calculate the amount of Nitrogen removed by crop residues of this cultivation
        const removal = b_lu_yield
            .dividedBy(b_lu_hi)
            .times(b_lu_hi_res)
            .times(b_lu_n_residue)
            .dividedBy(new Decimal(1000)) // Convert from g N / ha to kg N / ha
            .times(-1) // Return negative value

        return {
            id: cultivation.b_lu,
            value: removal,
        }
    })

    // Aggregate the total amount of Nitrogen removed by crop residues
    const totalValue = removalsResidue.reduce((acc, residue) => {
        return acc.add(residue.value)
    }, new Decimal(0))

    return {
        total: totalValue,
        cultivations: removalsResidue,
    }
}
