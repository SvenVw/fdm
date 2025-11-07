/**
 * @file This is the main entry point for the `@svenvw/fdm-calculator` package.
 * It exports all the public functions and types that are intended to be used by
 * consumers of this library.
 *
 * The exports are organized by feature area, such as nitrogen balance, nutrient doses,
 * regulatory norms, and nutrient advice.
 *
 * @packageDocumentation
 */
import pkg from "./package"
export const fdmCalculator = pkg
export {
    calculateNitrogenBalance,
    getNitrogenBalance,
} from "./balance/nitrogen/index"
export { collectInputForNitrogenBalance } from "./balance/nitrogen/input"
export type {
    FieldInput,
    NitrogenBalanceFieldNumeric,
    NitrogenBalanceFieldResultNumeric,
    NitrogenBalanceInput,
    NitrogenBalanceNumeric,
    NitrogenEmissionAmmoniaFertilizersNumeric,
    NitrogenEmissionAmmoniaNumeric,
    NitrogenEmissionAmmoniaResiduesNumeric,
    NitrogenRemovalHarvestsNumeric,
    NitrogenRemovalNumeric,
    NitrogenRemovalResiduesNumeric,
    NitrogenSupplyFertilizersNumeric,
    NitrogenSupplyFixationNumeric,
    NitrogenSupplyMineralizationNumeric,
    NitrogenSupplyNumeric,
} from "./balance/nitrogen/types"
export { calculateDose } from "./doses/calculate-dose"
export type { Dose } from "./doses/d"
export { getDoseForField } from "./doses/get-dose-field"
export {
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
} from "./norms"
export type {
    AggregatedNormFillingsToFarmLevel,
    AggregatedNormsToFarmLevel,
    InputAggregateNormFillingsToFarmLevel,
    InputAggregateNormsToFarmLevel,
} from "./norms/farm"
export type { NormFilling } from "./norms/nl/2025/filling/types"
export {
    isFieldInGWGBGebied,
    isFieldInNatura2000Gebied,
} from "./norms/nl/2025/value/dierlijke-mest-gebruiksnorm"
export {
    getRegion,
    isFieldInNVGebied,
} from "./norms/nl/2025/value/stikstofgebruiksnorm"
export type {
    GebruiksnormResult,
    NL2025NormsInput,
} from "./norms/nl/2025/value/types"
export {
    getNutrientAdvice,
    requestNutrientAdvice,
} from "./nutrient-advice"
export type {
    NutrientAdvice,
    NutrientAdviceInputs,
    NutrientAdviceResponse,
} from "./nutrient-advice/types"
