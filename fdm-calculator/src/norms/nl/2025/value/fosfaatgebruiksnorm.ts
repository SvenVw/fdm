/**
 * @file This module calculates the usage norm for phosphate (`fosfaatgebruiksnorm`) for the
 * Dutch regulations of 2025. The norm is differentiated based on the soil's phosphate
 * status, which is determined from soil analysis data, and the type of land use
 * (grassland or arable land).
 *
 * @packageDocumentation
 */
import { withCalculationCache } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import pkg from "../../../../package"
import { fosfaatNormsData } from "./fosfaatgebruiksnorm-data"
import { determineNL2025Hoofdteelt } from "./hoofdteelt"
import type {
    FosfaatGebruiksnormResult,
    FosfaatKlasse,
    NL2025NormsInput,
} from "./types.d"

/**
 * Determines if a given cultivation code represents a type of grassland.
 *
 * @param b_lu_catalogue - The cultivation catalogue code to check.
 * @returns `true` if the code corresponds to a grassland type, otherwise `false`.
 * @internal
 */
function isCultivationGrasland(b_lu_catalogue: string): boolean {
    const graslandCodes = ["nl_265", "nl_266", "nl_331", "nl_332", "nl_335"]

    if (graslandCodes.includes(b_lu_catalogue)) {
        return true
    }

    return false
}

/**
 * Determines the phosphate status class of the soil.
 *
 * This function implements the official RVO tables for classifying soil phosphate status
 * (from "Arm" to "Hoog") based on P-CaCl2 and P-Al soil analysis values. Separate
 * classification logic is applied for grassland and arable land.
 *
 * @param a_p_cc - The P-CaCl2 value from the soil analysis.
 * @param a_p_al - The P-Al value from the soil analysis.
 * @param is_grasland - A boolean indicating if the land is grassland.
 * @returns The determined phosphate class (`FosfaatKlasse`).
 * @internal
 */
function getFosfaatKlasse(
    a_p_cc: number,
    a_p_al: number,
    is_grasland: boolean,
): FosfaatKlasse {
    // Round P-AL to whole number and convert to Decimal for precise comparisons
    const pAl = new Decimal(a_p_al).toDecimalPlaces(0)

    // Round P-CaCl2 to 1 digit and convert to Decimal for precise comparisons
    const pCc = new Decimal(a_p_cc).toDecimalPlaces(1)

    if (is_grasland) {
        // Logic for Grasland (Table 1)
        if (pCc.lessThan(0.8)) {
            if (pAl.lessThan(21)) return "Arm"
            if (pAl.lessThanOrEqualTo(45)) return "Laag"
            if (pAl.lessThanOrEqualTo(55)) return "Neutraal"
            return "Ruim" // pAl.greaterThan(new Decimal(55))
        }
        if (pCc.lessThanOrEqualTo(1.4)) {
            if (pAl.lessThan(21)) return "Arm"
            if (pAl.lessThanOrEqualTo(30)) return "Laag"
            if (pAl.lessThanOrEqualTo(45)) return "Neutraal"
            return "Ruim" // pAl.greaterThan(new Decimal(45))
        }
        if (pCc.lessThanOrEqualTo(2.4)) {
            if (pAl.lessThan(21)) return "Laag"
            if (pAl.lessThanOrEqualTo(30)) return "Neutraal"
            if (pAl.lessThanOrEqualTo(55)) return "Ruim"
            return "Hoog" // pAl.greaterThan(new Decimal(55))
        }
        if (pCc.lessThanOrEqualTo(3.4)) {
            if (pAl.lessThan(21)) return "Neutraal"
            if (pAl.lessThanOrEqualTo(45)) return "Ruim"
            return "Hoog" // pAl.greaterThan(new Decimal(45))
        }
        // pCc.greaterThan(new Decimal(3.4))
        if (pAl.lessThan(31)) return "Ruim"
        return "Hoog" // pAl.greaterThanOrEqualTo(new Decimal(31))
    }

    // Logic for Bouwland (Table 2)
    if (pCc.lessThan(0.8)) {
        if (pAl.lessThan(46)) return "Arm"
        return "Laag" // pAl.greaterThanOrEqualTo(new Decimal(46))
    }
    if (pCc.lessThanOrEqualTo(1.4)) {
        if (pAl.lessThan(46)) return "Arm"
        if (pAl.lessThanOrEqualTo(55)) return "Laag"
        return "Neutraal" // pAl.greaterThan(new Decimal(55))
    }
    if (pCc.lessThanOrEqualTo(2.4)) {
        if (pAl.lessThan(31)) return "Arm"
        if (pAl.lessThanOrEqualTo(45)) return "Laag"
        if (pAl.lessThanOrEqualTo(55)) return "Neutraal"
        return "Ruim" // pAl.greaterThan(new Decimal(55))
    }
    if (pCc.lessThanOrEqualTo(3.4)) {
        if (pAl.lessThan(21)) return "Arm"
        if (pAl.lessThanOrEqualTo(30)) return "Laag"
        if (pAl.lessThanOrEqualTo(45)) return "Neutraal"
        if (pAl.lessThanOrEqualTo(55)) return "Ruim"
        return "Hoog" // pAl.greaterThan(new Decimal(55))
    }
    // pCc.greaterThan(new Decimal(3.4))
    if (pAl.lessThan(31)) return "Laag"
    if (pAl.lessThanOrEqualTo(45)) return "Neutraal"
    if (pAl.lessThanOrEqualTo(55)) return "Ruim"
    return "Hoog" // pAl.greaterThan(new Decimal(55))
}

/**
 * Calculates the phosphate usage norm for a specific field for the year 2025.
 *
 * This function determines the maximum permissible amount of phosphate (as P2O5) that can be
 * applied to a field. The process involves:
 * 1.  Determining the primary cultivation (`hoofdteelt`) for the year.
 * 2.  Classifying the land as either grassland or arable land based on the primary cultivation.
 * 3.  Determining the soil's phosphate status class using the `getFosfaatKlasse` function.
 * 4.  Looking up the appropriate norm value in `fosfaatNormsData` based on the land type
 *     and phosphate class.
 *
 * @param input - A standardized object containing cultivation and soil analysis data for the field.
 * @returns A promise that resolves to an object containing the calculated `normValue` (in kg P2O5/ha)
 *   and the determined `normSource` (which includes the land type and phosphate class).
 * @throws {Error} If essential soil analysis data (P-Al or P-CaCl2) is missing.
 * @throws {Error} If no norm value can be found for the determined phosphate class.
 */
export async function calculateNL2025FosfaatGebruiksNorm(
    input: NL2025NormsInput,
): Promise<FosfaatGebruiksnormResult> {
    const cultivations = input.cultivations
    const a_p_cc = input.soilAnalysis.a_p_cc
    const a_p_al = input.soilAnalysis.a_p_al

    if (!a_p_al || !a_p_cc) {
        throw new Error(
            "Missing soil analysis data for NL 2025 Fosfaatgebruiksnorm",
        )
    }

    const b_lu_catalogue = determineNL2025Hoofdteelt(cultivations)
    const is_grasland = isCultivationGrasland(b_lu_catalogue)

    // Determine the phosphate class based on soil analysis values and land type.
    const fosfaatKlasse = getFosfaatKlasse(a_p_cc, a_p_al, is_grasland)

    // Retrieve the base norms for the determined phosphate class.
    const normsForKlasse = fosfaatNormsData[0][fosfaatKlasse]

    if (!normsForKlasse) {
        throw new Error(`No phosphate norms found for class ${fosfaatKlasse}.`)
    }

    // Select the specific norm based on whether it's grassland or arable land.
    const normValue = is_grasland
        ? normsForKlasse.grasland
        : normsForKlasse.bouwland
    const normSource = is_grasland
        ? `Grasland: ${fosfaatKlasse}`
        : `Bouwland: ${fosfaatKlasse}`

    return { normValue, normSource }
}

/**
 * A cached version of the `calculateNL2025FosfaatGebruiksNorm` function.
 *
 * This function enhances performance by caching the results of the norm calculation.
 * The cache key is generated based on the function's input and the calculator's version,
 * ensuring that the cache is invalidated when the underlying logic or data changes.
 *
 * @param input - A standardized object containing cultivation and soil analysis data for the field.
 * @returns A promise that resolves to an object containing the calculated `normValue` (in kg P2O5/ha)
 *   and the determined `normSource`.
 */
export const getNL2025FosfaatGebruiksNorm = withCalculationCache(
    calculateNL2025FosfaatGebruiksNorm,
    "calculateNL2025FosfaatGebruiksNorm",
    pkg.calculatorVersion,
)
