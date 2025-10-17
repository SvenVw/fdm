import { Decimal } from "decimal.js"
import type { GebruiksnormResult } from "./nl/2025/value/types"

/**
 * Represents the input structure for the `aggregateNormsToFarmLevel` function.
 * It is an array of objects, where each object contains information for a single field.
 */
type InputAggregateNormsToFarmLevel = {
    /**
     * The unique identifier of the field.
     */
    b_id: string
    /**
     * The area of the field in hectares.
     */
    b_area: number
    /**
     * The calculated norm values for manure, nitrogen, and phosphate for this field.
     */
    norms: {
        manure: GebruiksnormResult
        nitrogen: GebruiksnormResult
        phosphate: GebruiksnormResult
    }
}[]

/**
 * Represents the aggregated output of the `aggregateNormsToFarmLevel` function.
 * The results are expressed as total amounts for the farm, not per hectare.
 */
export type AggregatedNormsToFarmLevel = {
    /**
     * Total manure norm in kg N for the entire farm.
     */
    manure: number // kg N
    /**
     * Total nitrogen norm in kg N for the entire farm.
     */
    nitrogen: number // kg N
    /**
     * Total phosphate norm in kg P2O5 for the entire farm.
     */
    phosphate: number // kg P2O5
}

/**
 * Aggregates the norm values from individual fields to the farm level.
 * This function takes the output per field of the norm calculation,
 * multiplies each norm by the field's area, and sums these values
 * across all fields to provide total norms for the farm.
 *
 * The result are three numbers (manure, nitrogen, phosphate) expressed as totals, not per hectare.
 *
 * @param input An array of field data, each containing field ID, area, and calculated norms.
 * @returns An object containing the total aggregated norms for manure, nitrogen, and phosphate for the farm.
 *
 * @example
 * const fieldData = [
 *   {
 *     b_id: "field1",
 *     b_area: 10, // hectares
 *     norms: {
 *       manure: { normValue: 100, normSource: "Source A" }, // kg N/ha
 *       nitrogen: { normValue: 150, normSource: "Source B" }, // kg N/ha
 *       phosphate: { normValue: 50, normSource: "Source C" }, // kg P2O5/ha
 *     },
 *   },
 *   {
 *     b_id: "field2",
 *     b_area: 5, // hectares
 *     norms: {
 *       manure: { normValue: 90, normSource: "Source A" }, // kg N/ha
 *       nitrogen: { normValue: 140, normSource: "Source B" }, // kg N/ha
 *       phosphate: { normValue: 45, normSource: "Source C" }, // kg P2O5/ha
 *     },
 *   },
 * ];
 *
 * const aggregatedNorms = aggregateNormsToFarmLevel(fieldData);
 * // aggregatedNorms will be:
 * // {
 * //   manure: (100 * 10) + (90 * 5) = 1000 + 450 = 1450,
 * //   nitrogen: (150 * 10) + (140 * 5) = 1500 + 700 = 2200,
 * //   phosphate: (50 * 10) + (45 * 5) = 500 + 225 = 725,
 * // }
 */
export function aggregateNormsToFarmLevel(
    input: InputAggregateNormsToFarmLevel,
): AggregatedNormsToFarmLevel {
    let totalManure = new Decimal(0)
    let totalNitrogen = new Decimal(0)
    let totalPhosphate = new Decimal(0)

    for (const field of input) {
        const area = new Decimal(field.b_area)
        totalManure = totalManure.plus(
            new Decimal(field.norms.manure.normValue).times(area),
        )
        totalNitrogen = totalNitrogen.plus(
            new Decimal(field.norms.nitrogen.normValue).times(area),
        )
        totalPhosphate = totalPhosphate.plus(
            new Decimal(field.norms.phosphate.normValue).times(area),
        )
    }

    return {
        manure: totalManure.toDecimalPlaces(0).toNumber(),
        nitrogen: totalNitrogen.toDecimalPlaces(0).toNumber(),
        phosphate: totalPhosphate.toDecimalPlaces(0).toNumber(),
    }
}
