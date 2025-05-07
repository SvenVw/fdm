import type { Harvest, HarvestableAnalysis } from "@svenvw/fdm-core"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenRemovalResidues,
} from "../types"
import Decimal from "decimal.js"

/**
 * Calculates the amount of Nitrogen removed from the field through crop residue removal.
 *
 * This function determines the nitrogen removed based on the cultivations performed, harvest yields,
 * and crop residue management practices. It uses cultivation details and harvest information to estimate
 * the amount of nitrogen present in the crop residues and accounts for its removal.
 * @param cultivations - A list of cultivations on the field.
 * @param harvests - A list of harvests from the field.
 * @param cultivationDetailsMap - The map of cultivation details.
 * @returns The NitrogenRemovalResidues object containing the total amount of Nitrogen removed and the individual cultivation values.
 */
export function calculateNitrogenRemovalByResidue(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenRemovalResidues {
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

        // If no crop residues are left or if this is not know return 0 for the amount of Nitrogen removed by crop residues
        if (!cultivation.m_cropresidue || cultivation.m_cropresidue === false) {
            return {
                id: cultivation.b_lu,
                value: new Decimal(0),
            }
        }

        // Get the (average) yield for this crop
        const yields = harvests
            .filter((x) => x.b_lu === cultivation.b_lu)
            .map((harvest: Harvest) => {
                const yields = harvest.harvestable.harvestable_analyses.map(
                    (harvestAnalyse: HarvestableAnalysis) => {
                        if (!harvestAnalyse.b_lu_yield) {
                            return undefined
                        }
                        return new Decimal(harvestAnalyse.b_lu_yield)
                    },
                )

                if (yields.length === 0) {
                    return undefined
                }

                const yieldsWithoutUndefined = yields.filter(
                    (x: Decimal | undefined) => x !== undefined,
                )

                if (yieldsWithoutUndefined === 0) {
                    return undefined
                }

                return yieldsWithoutUndefined
                    .reduce((prev: Decimal, curr: Decimal) => {
                        return prev.add(curr)
                    }, new Decimal(0))
                    .dividedBy(yieldsWithoutUndefined.length)
            })

        let b_lu_yield = yields[0]
        if (!yields || yields.length === 0) {
            b_lu_yield = new Decimal(cultivationDetail.b_lu_yield)
        } else {
            b_lu_yield = yields
                .reduce((prev: Decimal, curr: Decimal) => {
                    if (!prev || !curr) return new Decimal(0)
                    return prev.add(curr)
                }, new Decimal(0))
                .dividedBy(yields.length)
        }

        // Get the harvest for crop residues
        const b_lu_hi = new Decimal(cultivationDetail.b_lu_hi)
        const b_lu_hi_res = new Decimal(1).minus(b_lu_hi)

        // Get the Nitrogen content of the crop residues
        const b_lu_n_residue = new Decimal(cultivationDetail.b_lu_n_residue)

        // Calculate the amount of Nitrogen removed by crop residues of this cultivation
        const removal = b_lu_yield
            .times(b_lu_hi_res)
            .times(b_lu_n_residue)
            .dividedBy(new Decimal(1000)) // Convert from g N / ha to kg N / ha
            .times(-1) // Return negative value

        return {
            id: cultivation.b_lu,
            value: removal,
        }
    })

    // Aggregate the total maount of Nitrogen removed by crop residues
    const totalValue = removalsResidue.reduce((acc, residue) => {
        return acc.add(residue.value)
    }, new Decimal(0))

    return {
        total: totalValue,
        cultivations: removalsResidue,
    }
}
