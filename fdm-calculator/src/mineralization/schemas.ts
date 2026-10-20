/**
 * @packageDocumentation
 * @module mineralization/schemas
 *
 * Zod validation schemas for NMI API responses used by the Mineralisatie module.
 *
 * The NMI API uses `snake_case` field names in its JSON responses. Where noted,
 * schemas include a `.transform()` step to map them to the `camelCase` TypeScript
 * interfaces defined in {@link module:mineralisatie/types}.
 */

import { z } from "zod"

// ─── N-Supply schemas ─────────────────────────────────────────────────────────

/**
 * Validates a single daily data point from the `/bemestingsplan/nsupply` response.
 *
 * @see {@link NSupplyDataPoint}
 */
export const nsupplyDataPointSchema = z.object({
  /** Day of year (1–366) */
  doy: z.number().int().min(1).max(366),
  /** Cumulative N mineralised to this DOY (kg N/ha) */
  d_n_supply_actual: z.number(),
})

/**
 * Validates the top-level response body from `POST /bemestingsplan/nsupply`.
 *
 * The API returns an array of 365 or 366 daily data points under a `data` key.
 */
export const nsupplyResponseSchema = z.object({
  data: z.array(nsupplyDataPointSchema).min(1),
})

// ─── DYNA schemas ─────────────────────────────────────────────────────────────

/**
 * Validates a single daily simulation point from the DYNA model
 * (within `data.calculation_dyna[]` of the `/bemestingsplan/dyna` response).
 *
 * All numeric fields represent kg N/ha (or kg NO₃/ha for leaching), cumulative.
 *
 * @see {@link DynaDailyPoint}
 */
export const dynaDailyPointSchema = z.object({
  /** Calendar date of this simulation step (ISO 8601) */
  b_date_calculation: z.string(),
  /** N availability */
  b_nw: z.number(),
  /** N availability — minimal scenario */
  b_nw_min: z.number(),
  /** N availability — maximal scenario */
  b_nw_max: z.number(),
  /** N availability — recommended scenario */
  b_nw_recommended: z.number().nullable(),
  /** Crop N uptake */
  b_n_uptake: z.number().nullable(),
  /** Crop N uptake — minimal scenario */
  b_n_uptake_min: z.number(),
  /** Crop N uptake — maximal scenario */
  b_n_uptake_max: z.number(),
  /** Crop N uptake — recommended scenario */
  b_n_uptake_recommended: z.number(),
  /** Cumulative NO3 leaching */
  b_no3_leach: z.number().nullable(),
  /** NO3 leaching — minimal scenario */
  b_no3_leach_min: z.number(),
  /** NO3 leaching — maximal scenario */
  b_no3_leach_max: z.number(),
  /** NO3 leaching — recommended scenario */
  b_no3_leach_recommended: z.number(),
})

/**
 * Validates the `data` object within the `/bemestingsplan/dyna` response body
 * and **transforms** the snake_case API field names to camelCase TypeScript names.
 *
 * Transformation mapping:
 * - `calculation_dyna` → `calculationDyna`
 * - `nitrogen_balance` → `nitrogenBalance`
 * - `fertilizing_recommendations` → `fertilizingRecommendations`
 * - `harvesting_recommendations` → `harvestingRecommendation`
 *
 * Both recommendation fields are nullable — the API returns `null` when no
 * recommendation can be generated.
 *
 * @see {@link DynaResult}
 */
export const dynaResponseDataSchema = z
  .object({
    calculation_dyna: z.array(dynaDailyPointSchema),
    nitrogen_balance: z.object({
      /** Total N supply (kg N/ha) */
      b_nw: z.number(),
      /** Total N uptake by crop (kg N/ha) */
      b_n_uptake: z.number(),
      /** N from green manure incorporation (kg N/ha) */
      b_n_greenmanure: z.number(),
      /** N from organic fertilizers (kg N/ha) */
      b_n_fertilizer_organic: z.number(),
      /** N from mineral fertilizers (kg N/ha) */
      b_n_fertilizer_artificial: z.number(),
      /** N carried over from preceding rotation (kg N/ha) */
      b_n_fertilizer_preceeding: z.number(),
    }),
    /** Nullable: `null` when no additional fertilization is required */
    fertilizing_recommendations: z
      .object({
        b_n_recommended: z.number(),
        b_date_recommended: z.string(),
        b_n_remaining: z.number(),
      })
      .nullable(),
    /** Nullable: `null` when no harvest recommendation is available */
    harvesting_recommendations: z
      .object({
        b_date_harvest: z.string(),
      })
      .nullable(),
  })
  .transform((d) => ({
    calculationDyna: d.calculation_dyna,
    nitrogenBalance: d.nitrogen_balance,
    fertilizingRecommendations: d.fertilizing_recommendations,
    harvestingRecommendation: d.harvesting_recommendations,
  }))

/**
 * Validates the full top-level response body from `POST /bemestingsplan/dyna`.
 *
 * The API wraps all calculation results under a single `data` key.
 */
export const dynaResponseSchema = z.object({
  data: dynaResponseDataSchema,
})

// ─── Dyna v2 schemas ──────────────────────────────────────────────────────────

/** Message used when Dyna returns no simulation days. */
export const DYNA_V2_EMPTY_SERIES_MESSAGE = "Geen resultaten van Dyna ontvangen"

const balanceValue = z.number().catch(0).default(0)

/**
 * Validates the `data` object returned by `POST /bemestingsplan/dyna/v2`.
 *
 * Adds the derived available nitrogen (`b_nw − b_n_uptake`) to every day, sorts the days by date
 * and fills balance components that are not reported with 0.
 */
export const dynaV2ResponseDataSchema = z
  .object({
    calculation_dyna: z
      .array(
        z.object({
          b_date_calculation: z.string(),
          b_nw: z.number(),
          b_n_uptake: z.number(),
          b_no3_leach: z.number(),
        }),
      )
      .min(1, DYNA_V2_EMPTY_SERIES_MESSAGE),
    nitrogen_balance: z
      .object({
        b_nw: balanceValue,
        b_n_uptake: balanceValue,
        b_n_fertilizer_mineral: balanceValue,
        b_n_fertilizer_organic: balanceValue,
        b_n_fertilizer_preceeding: balanceValue,
        b_n_greenmanure: balanceValue,
      })
      .nullish(),
  })
  .transform((data) => ({
    series: data.calculation_dyna
      .map((day) => ({
        b_date_calculation: day.b_date_calculation,
        b_nw: day.b_nw,
        b_n_uptake: day.b_n_uptake,
        b_no3_leach: day.b_no3_leach,
        b_n_available: day.b_nw - day.b_n_uptake,
      }))
      .sort((a, b) => a.b_date_calculation.localeCompare(b.b_date_calculation)),
    balance: {
      b_nw: data.nitrogen_balance?.b_nw ?? 0,
      b_n_uptake: data.nitrogen_balance?.b_n_uptake ?? 0,
      b_n_fertilizer_mineral: data.nitrogen_balance?.b_n_fertilizer_mineral ?? 0,
      b_n_fertilizer_organic: data.nitrogen_balance?.b_n_fertilizer_organic ?? 0,
      b_n_fertilizer_preceeding: data.nitrogen_balance?.b_n_fertilizer_preceeding ?? 0,
      b_n_greenmanure: data.nitrogen_balance?.b_n_greenmanure ?? 0,
    },
  }))
