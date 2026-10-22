/**
 * Browser-safe entry point of `@nmi-agro/fdm-calculator`.
 *
 * This entry only exports pure functions that do not depend on the database, the file system or
 * other server-only modules, so it can be imported in client-side code:
 *
 * ```ts
 * import { aggregateNutrientAdviceToFarmLevel } from "@nmi-agro/fdm-calculator/browser"
 * ```
 *
 * Everything exported here is also exported from the main entry point.
 *
 * @module browser
 */
export { calculateNitrogenBalancesFieldToFarm } from "./balance/nitrogen/aggregate"
export { calculateNitrogenBalanceField } from "./balance/nitrogen/field"
export type {
  FieldInput,
  NitrogenBalanceFieldInput,
  NitrogenBalanceFieldNumeric,
  NitrogenBalanceFieldResultNumeric,
  NitrogenBalanceNumeric,
} from "./balance/nitrogen/types"
export { calculateDose } from "./doses/calculate-dose"
export type { Dose } from "./doses/d"
export type {
  AggregatedNormFillingsToFarmLevel,
  AggregatedNormsToFarmLevel,
  InputAggregateNormFillingsToFarmLevel,
  InputAggregateNormsToFarmLevel,
} from "./norms/farm"
export { aggregateNormFillingsToFarmLevel, aggregateNormsToFarmLevel } from "./norms/farm"
export type {
  FertilizerApplicationFillingInputByYear,
  FertilizerApplicationFillings,
} from "./norms/filling"
export { calculateFertilizerApplicationFillingsWithRegion } from "./norms/filling"
export type { RegionKey } from "./norms/nl/2025/value/types"
export type { GebruiksnormResult, NormFilling } from "./norms/nl/types"
export type {
  AggregatedNutrientAdvice,
  InputAggregateNutrientAdviceToFarmLevel,
  NutrientAdviceAggregationMode,
  NutrientDoseAndAdvice,
} from "./nutrient-advice/aggregate"
export { aggregateNutrientAdviceToFarmLevel } from "./nutrient-advice/aggregate"
export type { NutrientAdvice } from "./nutrient-advice/types"
