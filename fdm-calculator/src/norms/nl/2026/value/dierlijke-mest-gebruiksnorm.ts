import { withCalculationCache } from "@svenvw/fdm-core"
import pkg from "../../../../package"
import type { DierlijkeMestGebruiksnormResult } from "norms/nl/types"

/**
 * Determines the 'gebruiksnorm' (usage standard) for nitrogen from animal manure
 * for a given farm and parcel in the Netherlands for the year 2026.
 *
 * This function implements the rules and norms specified by the RVO for 2026.
 *
 * @param input - An object containing all necessary parameters for the calculation.
 *   See {@link DierlijkeMestGebruiksnormInput} for details.
 * @returns An object of type `DierlijkeMestGebruiksnormResult` containing the determined
 *   nitrogen usage standard (`normValue`) and a `normSource` string explaining the rule applied.
 *
 * @remarks
 * The rules for 2026 are as follows:
 * - **Standard Norm**: The norm is 170 kg N/ha from animal manure.
 */
export async function calculateNL2026DierlijkeMestGebruiksNorm(): Promise<DierlijkeMestGebruiksnormResult> {
    let normValue: number
    let normSource: string

    normValue = 170
    normSource = "Standaard - geen derogatie"

    return { normValue, normSource }
}

/**
 * Memoized version of {@link calculateNL2026DierlijkeMestGebruiksNorm}.
 *
 * This function is wrapped with `withCalculationCache` to optimize performance by caching
 * results based on the input and the current calculator version.
 *
 * @param {NL2026NormsInput} input - An object containing all necessary parameters for the calculation.
 * @returns {Promise<DierlijkeMestGebruiksnormResult>} An object of type `DierlijkeMestGebruiksnormResult` containing the determined
 *   nitrogen usage standard (`normValue`) and a `normSource` string explaining the rule applied.
 */
export const getNL2026DierlijkeMestGebruiksNorm = withCalculationCache(
    calculateNL2026DierlijkeMestGebruiksNorm,
    "calculateNL2026DierlijkeMestGebruiksNorm",
    pkg.calculatorVersion,
)
