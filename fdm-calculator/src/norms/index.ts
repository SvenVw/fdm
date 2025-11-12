/**
 * @file This module serves as a factory for accessing region- and year-specific
 * functions related to agricultural norms. It dynamically provides the correct set of
 * functions for calculating norm values and their fillings based on the specified
 * context.
 *
 * This factory pattern allows the calculator to support different regulatory frameworks
 * over time and across regions.
 *
 * @packageDocumentation
 */
import {
    aggregateNormFillingsToFarmLevel,
    aggregateNormsToFarmLevel,
} from "./farm"
import { getNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"
import { getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { collectInputForFertilizerApplicationFilling } from "./nl/2025/filling/input"
import { getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm } from "./nl/2025/filling/stikstofgebruiksnorm"
import type { NormFilling } from "./nl/2025/filling/types"
import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/value/dierlijke-mest-gebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/value/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/value/input"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/value/stikstofgebruiksnorm"

/**
 * Creates a set of functions for calculating agricultural norms for a specific region and year.
 *
 * This factory function returns an object containing the appropriate functions for:
 * - Collecting the necessary input data for norm calculations.
 * - Calculating the norms for nitrogen, manure, and phosphate.
 * - Aggregating field-level norms to the farm level.
 *
 * @param b_region - The region for which to create the functions (currently only "NL" is supported).
 * @param year - The year for which to create the functions (currently only "2025" is supported).
 * @returns An object with the relevant norm calculation functions.
 * @throws {Error} If the specified region or year is not supported.
 */
export function createFunctionsForNorms(b_region: "NL", year: "2025") {
    if (b_region === "NL") {
        if (year === "2025") {
            return {
                collectInputForNorms: collectNL2025InputForNorms,
                calculateNormForNitrogen: getNL2025StikstofGebruiksNorm,
                calculateNormForManure: getNL2025DierlijkeMestGebruiksNorm,
                calculateNormForPhosphate: getNL2025FosfaatGebruiksNorm,
                aggregateNormsToFarmLevel: aggregateNormsToFarmLevel,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}

/**
 * Creates a set of functions for calculating the "filling" of fertilizer application norms.
 *
 * "Filling" refers to the extent to which a farmer's practices meet the established norms.
 * This factory returns an object containing the appropriate functions for:
 * - Collecting the necessary input data.
 * - Calculating the norm fillings for nitrogen, manure, and phosphate.
 * - Aggregating field-level fillings to the farm level.
 *
 * @param b_region - The region for which to create the functions (currently only "NL" is supported).
 * @param year - The year for which to create the functions (currently only "2025" is supported).
 * @returns An object with the relevant norm filling calculation functions.
 * @throws {Error} If the specified region or year is not supported.
 */
export function createFunctionsForFertilizerApplicationFilling(
    b_region: "NL",
    year: "2025",
) {
    if (b_region === "NL") {
        if (year === "2025") {
            return {
                collectInputForFertilizerApplicationFilling:
                    collectInputForFertilizerApplicationFilling,
                calculateFertilizerApplicationFillingForNitrogen:
                    getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm,
                calculateFertilizerApplicationFillingForManure:
                    getNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm,
                calculateFertilizerApplicationFillingForPhosphate:
                    getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm,
                aggregateNormFillingsToFarmLevel:
                    aggregateNormFillingsToFarmLevel,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}
export type { NormFilling }
