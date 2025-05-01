import type {
    CultivationDetail,
    FieldInput,
    NitrogenSupplyFixation,
} from "../types"
import { Decimal } from "decimal.js"

export function calculateNitrogenFixation(
    cultivations: FieldInput["cultivations"],
    cultivationDetails: CultivationDetail[],
): NitrogenSupplyFixation {
    const fixations = cultivations.map((cultivation) => {
        // Get details of cultivation
        const cultivationDetail = cultivationDetails.find((detail) => {
            return detail.b_lu_catalogue === cultivation.b_lu_catalogue
        })

        if (!cultivationDetail) {
            throw new Error(
                `Cultivation ${cultivation.b_lu} has no corresponding cultivation in cultivationDetails`,
            )
        }

        // Calculate for this cultivation the amount of Nitrogen that is fixated
        if (!cultivationDetail.b_n_fixation) {
            return {
                id: cultivation.b_lu,
                value: new Decimal(0),
            }
        }

        return {
            id: cultivation.b_lu,
            value: new Decimal(cultivationDetail.b_n_fixation),
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
