/**
 * @file This module calculates the nitrogen supply from biological nitrogen fixation by crops.
 *
 * The primary function, `calculateNitrogenFixation`, determines the amount of atmospheric
 * nitrogen made available to the soil by nitrogen-fixing cultivations (e.g., legumes).
 *
 * @packageDocumentation
 */
import { Decimal } from "decimal.js"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenSupplyFixation,
} from "../types"

/**
 * Calculates the total nitrogen supplied by biological fixation from all cultivations on a field.
 *
 * This function iterates through each cultivation and, using a lookup from the `cultivationDetailsMap`,
 * finds the standard amount of nitrogen that crop type is expected to fix. It then aggregates
 * the fixation amounts from all relevant cultivations to provide a total for the field.
 *
 * @param cultivations - An array of all cultivations on the field.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type, including
 *   its nitrogen fixation rate (`b_n_fixation`).
 * @returns An object detailing the total and per-cultivation nitrogen supply from fixation.
 * @throws {Error} If cultivation details are missing for a given cultivation.
 */
export function calculateNitrogenFixation(
    cultivations: FieldInput["cultivations"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenSupplyFixation {
    if (cultivations.length === 0) {
        return {
            total: new Decimal(0),
            cultivations: [],
        }
    }
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

        // If this cultivation does not fixate Nitrogen or the value is not available, set it to 0
        if (b_n_fixation === null || b_n_fixation === undefined) {
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
