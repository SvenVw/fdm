import type {
    CultivationDetail,
    FieldInput,
    NitrogenSupplyFixation,
} from "../types"
import { Decimal } from "decimal.js"

export function calculateNitrogenFixation(
    cultivations: FieldInput["cultivations"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenSupplyFixation {
    const fixations = cultivations.map((cultivation) => {
        // Get details of cultivation using the Map
        const cultivationDetail = cultivationDetailsMap.get(
            cultivation.b_lu_catalogue,
        )

        if (!cultivationDetail) {
            throw new Error(
                `Cultivation ${cultivation.b_lu} has no corresponding cultivation in cultivationDetails`,
            )
        }
        const b_n_fixation = cultivationDetail.b_n_fixation

        // If this cultivation does not fixate Nitrogen set it to 0
        if (b_n_fixation) {
            return {
                id: cultivation.b_lu,
                value: new Decimal(0),
            }
        }

        // Return the amount of Nitrogen fixated by the cultivation
        return {
            id: cultivation.b_lu,
            value: new Decimal(b_n_fixation),
        }
    })

    // Calculate the total amount of Nitrogen fixated by the cultivations
    const totalValue = fixations.reduce((acc, fixation) => {
        return acc.add(fixation.value)
    }, Decimal(0))

    return {
        total: totalValue,
        cultivations: fixations,
    }
}
