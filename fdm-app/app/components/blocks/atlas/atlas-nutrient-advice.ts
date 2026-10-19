import type { Feature, FeatureCollection, GeoJsonProperties, Geometry } from "geojson"
import type {
  ExpressionSpecification,
  FillLayerSpecification,
  LineLayerSpecification,
} from "maplibre-gl"
import type { FieldNutrientValue } from "~/components/blocks/nutrient-advice/overview-types"
import {
  type AdviceProgressStatus,
  computeAdviceProgress,
} from "~/components/blocks/nutrient-advice/progress-bar"

/* ================ MODES & COPY ================ */

/** Display modes of the Bemestingsadvies layer. */
export const NUTRIENT_ADVICE_MODES = ["remaining", "percentage", "advice"] as const
export type NutrientAdviceMode = (typeof NUTRIENT_ADVICE_MODES)[number]

export const DEFAULT_NUTRIENT_ADVICE_MODE: NutrientAdviceMode = "remaining"
export const DEFAULT_NUTRIENT_ADVICE_NUTRIENT = "N"

/**
 * Type guard for values read back from storage.
 *
 * @param value - Any value.
 * @returns `true` when `value` is a known {@link NutrientAdviceMode}.
 */
export function isNutrientAdviceMode(value: unknown): value is NutrientAdviceMode {
  return typeof value === "string" && (NUTRIENT_ADVICE_MODES as readonly string[]).includes(value)
}

/**
 * All Dutch UI copy of the layer in one place, so it can be moved to an i18n catalogue later
 * (fdm-app has no i18n library yet).
 */
export const NUTRIENT_ADVICE_COPY = {
  layerName: "Bemestingsadvies",
  modes: {
    remaining: "Nog te geven",
    percentage: "% van advies",
    advice: "Advies",
  } satisfies Record<NutrientAdviceMode, string>,
  nutrientGroups: {
    primary: "Primair",
    secondary: "Secundair",
    trace: "Sporenelementen",
  },
  advice: "Advies",
  applied: "Al gegeven",
  remaining: "Nog te geven",
  surplus: "Te veel gegeven",
  met: "Advies behaald",
  legendUnder: "Minder gegeven dan advies (< 90%)",
  legendMet: "Advies behaald (90–110%)",
  legendOver: "Meer gegeven dan advies (> 110%)",
  noAdvice: "Geen advies beschikbaar",
  noAdviceZero: "Geen advies (advies is 0)",
  loading: "Advies wordt berekend…",
  openAdvice: "Bekijk bemestingsadvies",
  clickHint: "Klik op een perceel voor het volledige advies",
} as const

/* ================ DATA SHAPES ================ */

/**
 * Slim per-field row streamed to the Atlas route. Only what the map, legend and tooltip need,
 * so the deferred payload stays small (no cultivation suggestion, no geometry).
 */
export type AtlasNutrientAdviceRow = {
  b_id: string
  /** Name of the main cultivation, or `null` when none is registered. */
  b_lu_name: string | null
  /** Friendly (Dutch) reason when no advice could be calculated. */
  errorMessage?: string
  /** Advice and applied dose per nutrient symbol, in kg/ha. */
  values: Record<string, FieldNutrientValue>
}

/** Shading state of a field, written into the GeoJSON properties as `nav_state`. */
export type NutrientAdviceShadingState = "loading" | "none" | "ok"

/** Feature property names used by the MapLibre style expressions. */
export const NAV_STATE = "nav_state"
/** Applied vs. advice class (`under` / `on-target` / `over`), used by the comparison modes. */
export const NAV_STATUS = "nav_status"
/** Position on the colour ramp (0–1), used by the "Advies" mode only. */
export const NAV_T = "nav_t"

/* ================ COLOURS ================ */

/**
 * Status colours for the comparison modes ("Nog te geven", "% van advies"):
 * - green: applied is within ±10 % of the advice (90–110 %),
 * - red: applied is more than the advice (> 110 %),
 * - yellow: applied is less than the advice (< 90 %).
 *
 * Same thresholds as `computeAdviceProgress`, and the same Tailwind shades as the existing score
 * colours in `getFieldsScoreStyle`. Red/green alone is not colour-blind safe, so the legend and the
 * tooltip always add a text label (DESIGN.md).
 */
export const NUTRIENT_ADVICE_STATUS_COLORS: Record<AdviceProgressStatus, string> = {
  under: "#eab308",
  "on-target": "#22c55e",
  over: "#ef4444",
}

/**
 * Sequential ramp for the "Advies" mode (t = 0 lowest advice … 1 highest advice), ColorBrewer Blues.
 * Deliberately not yellow/red/green, so those colours always mean "applied vs. advice".
 */
export const NUTRIENT_ADVICE_SEQUENTIAL_RAMP = [
  "#eff3ff",
  "#c6dbef",
  "#9ecae1",
  "#6baed6",
  "#3182bd",
  "#08519c",
] as const

/** Outline of every field: white dotted line, so field boundaries stand out on the satellite map. */
export const NUTRIENT_ADVICE_OUTLINE_COLOR = "#ffffff"

/** Fill colour of fields without advice (grey, never confused with the status colours). */
export const NUTRIENT_ADVICE_NONE_COLOR = "#6b7280"
/** Fill colour while the advice is still loading. */
export const NUTRIENT_ADVICE_LOADING_COLOR = "#cbd5e1"

/* ================ SCALE & SHADING ================ */

/** Farm-wide scale for the selected nutrient. */
export type NutrientAdviceScale = {
  /** Lowest and highest advice on the farm (kg/ha), used by the "Advies" mode. */
  minAdvice: number
  maxAdvice: number
}

/**
 * Computes the farm-wide scale of one nutrient over all fields that have advice.
 *
 * @param rows - Streamed rows of the farm.
 * @param nutrient - Selected nutrient symbol.
 * @returns The scale; safe defaults when no field has advice.
 */
export function getNutrientAdviceScale(
  rows: AtlasNutrientAdviceRow[],
  nutrient: string,
): NutrientAdviceScale {
  let minAdvice = Number.POSITIVE_INFINITY
  let maxAdvice = Number.NEGATIVE_INFINITY
  for (const row of rows) {
    const value = row.values[nutrient]
    if (!value) continue
    minAdvice = Math.min(minAdvice, value.advice)
    maxAdvice = Math.max(maxAdvice, value.advice)
  }
  if (!Number.isFinite(minAdvice)) {
    minAdvice = 0
    maxAdvice = 1
  }
  return { minAdvice, maxAdvice }
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x))

/** Shading of one field: state, applied-vs-advice class and ramp position. */
export type FieldShading = {
  state: NutrientAdviceShadingState
  /** `under` / `on-target` / `over`; `null` unless `state` is `"ok"`. */
  status: AdviceProgressStatus | null
  /** 0–1 position on the "Advies" ramp; 0 unless `state` is `"ok"`. */
  t: number
}

/**
 * Converts the advice and applied dose of one field into its shading.
 *
 * - Comparison modes ("Nog te geven", "% van advies"): the class comes from
 *   `computeAdviceProgress` — `on-target` when applied is 90–110 % of the advice, `over` above,
 *   `under` below — so the map, the overview table and the field cards always agree.
 *   EOC is never `over` (`excessExempt`).
 * - "Advies" mode: `t` ∈ [0, 1] between the lowest and highest advice on the farm.
 *
 * @param value - Advice and applied dose in kg/ha, or `undefined` when the field has no advice.
 * @param mode - Display mode.
 * @param scale - Farm-wide scale from {@link getNutrientAdviceScale}.
 * @param excessExempt - `true` for nutrients that are never harmful in excess (EOC).
 * @returns The {@link FieldShading} of the field.
 */
export function getFieldShading(
  value: FieldNutrientValue | undefined,
  mode: NutrientAdviceMode,
  scale: NutrientAdviceScale,
  excessExempt: boolean,
): FieldShading {
  if (!value) return { state: "none", status: null, t: 0 }
  const { advice, filling } = value

  // A percentage of a zero advice is meaningless: show as "no advice" instead of ∞ or NaN.
  if (mode === "percentage" && advice <= 0) return { state: "none", status: null, t: 0 }

  const { status } = computeAdviceProgress(filling, advice, excessExempt)
  const range = scale.maxAdvice - scale.minAdvice
  const t = range > 0 ? clamp((advice - scale.minAdvice) / range, 0, 1) : 0.5
  return { state: "ok", status, t }
}

/**
 * Writes `nav_state`, `nav_status` and `nav_t` for the selected nutrient and mode into a copy of the fields.
 * Doing this in JS (instead of in a MapLibre expression) keeps the style simple and testable, and
 * avoids nested objects in GeoJSON properties (MapLibre stringifies those).
 *
 * @param fieldsData - Field geometries with at least `b_id` in the properties.
 * @param rowsById - Streamed advice per field, or `null` while still loading.
 * @param nutrient - Selected nutrient symbol.
 * @param mode - Display mode.
 * @returns A new FeatureCollection; the input is not mutated.
 */
export function applyNutrientAdviceShading(
  fieldsData: FeatureCollection<Geometry, GeoJsonProperties>,
  rowsById: Map<string, AtlasNutrientAdviceRow> | null,
  nutrient: string,
  mode: NutrientAdviceMode,
): FeatureCollection<Geometry, GeoJsonProperties> {
  const scale = rowsById ? getNutrientAdviceScale([...rowsById.values()], nutrient) : null
  const excessExempt = nutrient === "EOC"

  const features = fieldsData.features.map((feature): Feature<Geometry, GeoJsonProperties> => {
    const b_id = feature.properties?.b_id as string | undefined
    let shading: FieldShading = { state: "loading", status: null, t: 0 }
    if (rowsById && scale) {
      const row = b_id ? rowsById.get(b_id) : undefined
      shading = getFieldShading(row?.values[nutrient], mode, scale, excessExempt)
    }
    return {
      ...feature,
      properties: {
        ...feature.properties,
        [NAV_STATE]: shading.state,
        [NAV_STATUS]: shading.status ?? "",
        [NAV_T]: shading.t,
      },
    }
  })

  return { ...fieldsData, features }
}

/* ================ MAPLIBRE STYLES ================ */

/**
 * Evenly spaced `interpolate` stops for a ramp over [from, to].
 *
 * @param ramp - Colours, low to high.
 * @param from - Value of the first colour.
 * @param to - Value of the last colour.
 * @returns Flat `[value, colour, value, colour, …]` list.
 */
function rampStops(ramp: readonly string[], from: number, to: number): (number | string)[] {
  return ramp.flatMap((color, i) => [from + ((to - from) * i) / (ramp.length - 1), color])
}

/**
 * Fill style of the layer. Comparison modes use the three status colours; the "Advies" mode uses
 * the blue ramp on `nav_t`. The style does not depend on the data and only changes with the mode.
 *
 * @param mode - Display mode.
 * @returns Layer `type` and `paint` props.
 */
export function getNutrientAdviceFillStyle(mode: NutrientAdviceMode): {
  type: "fill"
  paint: FillLayerSpecification["paint"]
} {
  const okColor: ExpressionSpecification =
    mode === "advice"
      ? ([
          "interpolate",
          ["linear"],
          ["get", NAV_T],
          ...rampStops(NUTRIENT_ADVICE_SEQUENTIAL_RAMP, 0, 1),
        ] as ExpressionSpecification)
      : ([
          "match",
          ["get", NAV_STATUS],
          "under",
          NUTRIENT_ADVICE_STATUS_COLORS.under,
          "on-target",
          NUTRIENT_ADVICE_STATUS_COLORS["on-target"],
          "over",
          NUTRIENT_ADVICE_STATUS_COLORS.over,
          NUTRIENT_ADVICE_NONE_COLOR,
        ] as ExpressionSpecification)

  return {
    type: "fill",
    paint: {
      "fill-color": [
        "match",
        ["get", NAV_STATE],
        "ok",
        okColor,
        "none",
        NUTRIENT_ADVICE_NONE_COLOR,
        NUTRIENT_ADVICE_LOADING_COLOR,
      ] as ExpressionSpecification,
      "fill-opacity": [
        "match",
        ["get", NAV_STATE],
        "ok",
        0.7,
        "none",
        0.45,
        0.35,
      ] as ExpressionSpecification,
    },
  }
}

/**
 * Outline of **all** fields of the farm: a white dotted line, so the field boundaries are easy to
 * spot on the satellite map regardless of the fill colour.
 *
 * `line-cap: round` with a short dash turns the dashes into dots. The route merges its own
 * `visibility` into this `layout`.
 *
 * @returns Layer `type`, `layout` and `paint` props.
 */
export function getNutrientAdviceOutlineStyle(): {
  type: "line"
  layout: LineLayerSpecification["layout"]
  paint: LineLayerSpecification["paint"]
} {
  return {
    type: "line",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": NUTRIENT_ADVICE_OUTLINE_COLOR,
      "line-width": 2.5,
      // Dash lengths are in line widths: a near-zero dash + round cap = a dot, then a 2-width gap.
      "line-dasharray": [0.1, 2],
    },
  }
}

/* ================ FORMATTING ================ */

/**
 * Formats a kg/ha amount in Dutch notation with sensible precision: whole numbers from 10,
 * one decimal from 1, otherwise up to three decimals (trace elements are fractions of a kg).
 *
 * @param value - Amount in kg/ha.
 * @returns Formatted number without unit.
 */
export function formatKgPerHa(value: number): string {
  const abs = Math.abs(value)
  const maximumFractionDigits = abs >= 10 ? 0 : abs >= 1 ? 1 : 3
  return value.toLocaleString("nl-NL", { maximumFractionDigits })
}
