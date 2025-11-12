/**
 * @file This module provides functions for aggregating field-level norm calculations
 * up to the farm level. This is crucial for assessing the overall compliance and
 * nutrient balance of an entire agricultural operation.
 *
 * @packageDocumentation
 */
import { Decimal } from "decimal.js"
import type { NormFilling } from "./nl/2025/filling/types"
import type { GebruiksnormResult } from "./nl/2025/value/types"

/**
 * Defines the input structure for aggregating field-level norms to the farm level.
 */
export type InputAggregateNormsToFarmLevel = {
    /**
     * The unique identifier of the field.
     */
    b_id: string
    /**
     * The area of the field in hectares.
     */
    b_area: number
    /**
     * The calculated norm values (per hectare) for the field.
     */
    norms: {
        manure: GebruiksnormResult
        nitrogen: GebruiksnormResult
        phosphate: GebruiksnormResult
    }
}[]

/**
 * Represents the total, farm-level aggregated norm values.
 */
export type AggregatedNormsToFarmLevel = {
    /**
     * Total manure application norm for the farm (in kg N).
     */
    manure: number
    /**
     * Total nitrogen application norm for the farm (in kg N).
     */
    nitrogen: number
    /**
     * Total phosphate application norm for the farm (in kg P2O5).
     */
    phosphate: number
}

/**
 * Aggregates per-hectare norm values from individual fields to farm-level totals.
 *
 * This function takes an array of field data, where each entry includes the field's area
 * and its calculated per-hectare norms. It calculates the total norm for each nutrient
 * for each field (by multiplying the norm value by the area) and then sums these
 * totals across all fields to produce a single, farm-level result.
 *
 * @param input - An array of field data with their respective norms.
 * @returns An object containing the total manure, nitrogen, and phosphate norms for the entire farm.
 *
 * @example
 * const fields = [
 *   { b_id: "F1", b_area: 10, norms: { manure: { normValue: 170 }, nitrogen: { normValue: 200 }, phosphate: { normValue: 80 } } },
 *   { b_id: "F2", b_area: 5, norms: { manure: { normValue: 170 }, nitrogen: { normValue: 180 }, phosphate: { normValue: 70 } } }
 * ];
 * const farmNorms = aggregateNormsToFarmLevel(fields);
 * // farmNorms.manure would be (10 * 170) + (5 * 170) = 2550
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

/**
 * Defines the input structure for aggregating field-level norm fillings to the farm level.
 */
export type InputAggregateNormFillingsToFarmLevel = {
    /**
     * The unique identifier of the field.
     */
    b_id: string
    /**
     * The area of the field in hectares.
     */
    b_area: number
    /**
     * The calculated norm filling data (per hectare) for the field.
     */
    normsFilling: {
        manure: NormFilling
        nitrogen: NormFilling
        phosphate: NormFilling
    }
}[]

/**
 * Represents the total, farm-level aggregated norm filling values.
 */
export type AggregatedNormFillingsToFarmLevel = {
    /**
     * Total manure norm filling for the farm (in kg N).
     */
    manure: number
    /**
     * Total nitrogen norm filling for the farm (in kg N).
     */
    nitrogen: number
    /**
     * Total phosphate norm filling for the farm (in kg P2O5).
     */
    phosphate: number
}

/**
 * Aggregates per-hectare norm filling values from individual fields to farm-level totals.
 *
 * This function is analogous to `aggregateNormsToFarmLevel` but operates on norm *fillings*.
 * It calculates the total nutrient application for each field by multiplying the per-hectare
 * filling value by the field's area, and then sums these totals across all fields to
 * produce a single, farm-level result.
 *
 * @param input - An array of field data with their respective norm fillings.
 * @returns An object containing the total manure, nitrogen, and phosphate norm fillings for the entire farm.
 */
export function aggregateNormFillingsToFarmLevel(
    input: InputAggregateNormFillingsToFarmLevel,
): AggregatedNormFillingsToFarmLevel {
    let totalManureFilling = new Decimal(0)
    let totalNitrogenFilling = new Decimal(0)
    let totalPhosphateFilling = new Decimal(0)

    for (const field of input) {
        const area = new Decimal(field.b_area)

        // Aggregate manure filling
        totalManureFilling = totalManureFilling.plus(
            new Decimal(field.normsFilling.manure.normFilling).times(area),
        )

        // Aggregate nitrogen filling
        totalNitrogenFilling = totalNitrogenFilling.plus(
            new Decimal(field.normsFilling.nitrogen.normFilling).times(area),
        )

        // Aggregate phosphate filling
        totalPhosphateFilling = totalPhosphateFilling.plus(
            new Decimal(field.normsFilling.phosphate.normFilling).times(area),
        )
    }

    return {
        manure: totalManureFilling.toDecimalPlaces(0).toNumber(),
        nitrogen: totalNitrogenFilling.toDecimalPlaces(0).toNumber(),
        phosphate: totalPhosphateFilling.toDecimalPlaces(0).toNumber(),
    }
}
