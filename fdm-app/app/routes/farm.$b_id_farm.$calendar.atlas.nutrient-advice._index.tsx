import type { FeatureCollection, Geometry } from "geojson"
import type { MapGeoJSONFeature } from "maplibre-gl"
import { getFields } from "@nmi-agro/fdm-core"
import { simplify } from "@turf/simplify"
import { useEffect, useMemo, useState } from "react"
import { Layer, type LayerProps } from "react-map-gl/maplibre"
import {
  type LoaderFunctionArgs,
  type MetaFunction,
  useLoaderData,
  useNavigate,
  useRevalidator,
} from "react-router"
import type { NutrientDescription } from "~/components/blocks/nutrient-advice/types"
import { MapTilerAttribution } from "~/components/blocks/atlas/atlas-attribution"
import { Controls } from "~/components/blocks/atlas/atlas-controls"
import { NutrientAdviceLegend } from "~/components/blocks/atlas/atlas-legend"
import {
  applyNutrientAdviceShading,
  type AtlasNutrientAdviceRow,
  formatKgPerHa,
  getNutrientAdviceFillStyle,
  getNutrientAdviceOutlineStyle,
  getNutrientAdviceScale,
  isNutrientAdviceMode,
  type NutrientAdviceMode,
  NUTRIENT_ADVICE_COPY,
  NUTRIENT_ADVICE_MODES,
  NUTRIENT_ADVICE_STATUS_COLORS,
} from "~/components/blocks/atlas/atlas-nutrient-advice"
import { Atlas } from "~/components/blocks/atlas/atlas-shell"
import { FieldsSourceNotClickable } from "~/components/blocks/atlas/atlas-sources"
import {
  AtlasTooltip,
  AtlasTooltipContent,
  AtlasTooltipFooter,
  AtlasTooltipHeader,
} from "~/components/blocks/atlas/atlas-tooltip"
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import {
  AdviceProgressBar,
  computeAdviceProgress,
} from "~/components/blocks/nutrient-advice/progress-bar"
import { Button } from "~/components/ui/button"
import { Card, CardContent } from "~/components/ui/card"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "~/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"
import { useAnalytics } from "~/hooks/use-analytics"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { getFarmNutrientAdviceRows } from "~/lib/nutrient-advice.server"
import { useSelectedAtlasNutrientAdviceStore } from "~/store/selected-nutrient-advice"

export const meta: MetaFunction = () => {
  return [
    { title: `Bemestingsadvies - Atlas | ${clientConfig.name}` },
    {
      name: "description",
      content:
        "Bekijk het bemestingsadvies van alle percelen van uw bedrijf op één kaart: waar nog nutriënten nodig zijn, waar het advies behaald is en waar meer is gegeven dan geadviseerd.",
    },
  ]
}

/**
 * Loads the field geometries of the farm immediately and defers the per-field nutrient advice.
 *
 * The advice needs one NMI API call per field, so it is returned as a promise (`asyncData`) that
 * React Router streams to the client. The map renders the field outlines straight away and colours
 * them as soon as the advice arrives.
 *
 * @returns `fieldsData` (simplified GeoJSON, `undefined` without a farm) and `asyncData` (slim
 * advice rows in kg/ha, `null` without a farm).
 * @throws {Response} When loading the fields fails.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const b_id_farm = params.b_id_farm
    const session = await getSession(request)
    const calendar = getCalendar(params)
    const timeframe = getTimeframe(params)

    let fieldsData: FeatureCollection | undefined
    let asyncData: Promise<{ rows: AtlasNutrientAdviceRow[] }> | null = null

    if (b_id_farm && b_id_farm !== "undefined") {
      const fields = await getFields(fdm, session.principal_id, b_id_farm, timeframe)

      fieldsData = {
        type: "FeatureCollection",
        features: fields.map((field) => ({
          type: "Feature" as const,
          properties: {
            b_id: field.b_id,
            b_name: field.b_name,
            b_area: Math.round((field.b_area ?? 0) * 10) / 10,
          },
          geometry: simplify(field.b_geometry as Geometry, {
            tolerance: 0.00001,
            highQuality: true,
          }),
        })),
      }

      // Same calculation as the Bemestingsadvies overview, then slimmed down to what the map needs.
      asyncData = getFarmNutrientAdviceRows(
        { principal_id: session.principal_id, b_id_farm, calendar, timeframe },
        fields,
      ).then((rows) => ({
        rows: rows.map((row): AtlasNutrientAdviceRow => ({
          b_id: row.b_id,
          b_lu_name: row.mainCultivation?.b_lu_name ?? null,
          errorMessage: row.errorMessage,
          values: row.values,
        })),
      }))
    }

    return {
      calendar,
      b_id_farm,
      fieldsData,
      asyncData,
      nutrientsDescription: getNutrientsDescription(),
    }
  } catch (error) {
    throw handleLoaderError(error)
  }
}

/**
 * Resolves the streamed advice into state.
 *
 * Deliberately not `Suspense` + `use()`: the map source must stay mounted while the advice loads
 * (otherwise MapLibre removes and re-adds the source and layers), and the tooltip and legend need
 * the same rows. Returns `null` while loading and again whenever a new promise arrives
 * (farm or year switch).
 *
 * The result is stored together with the promise it came from. "Loading" is then derived during
 * render (stored promise ≠ current promise) instead of resetting state inside the effect, which
 * `react/set-state-in-effect` forbids. State is only set from the async callbacks.
 *
 * A rejected promise (network/transport error) is kept apart from a successful result: it must not
 * look like "no advice for any field".
 *
 * @param asyncData - Deferred loader data, or `null` without a farm.
 * @returns `rows` (`null` while loading or after a failure) and `failed` (`true` when the current
 * promise rejected).
 */
function useStreamedRows(asyncData: Promise<{ rows: AtlasNutrientAdviceRow[] }> | null): {
  rows: AtlasNutrientAdviceRow[] | null
  failed: boolean
} {
  const [resolved, setResolved] = useState<{
    source: Promise<{ rows: AtlasNutrientAdviceRow[] }>
    rows: AtlasNutrientAdviceRow[] | null
    failed: boolean
  } | null>(null)

  useEffect(() => {
    if (!asyncData) return
    let cancelled = false
    asyncData
      .then((data) => {
        if (!cancelled) setResolved({ source: asyncData, rows: data.rows, failed: false })
      })
      .catch((error: unknown) => {
        // The helper never rejects for data problems; this only covers transport errors.
        console.error("Failed to load nutrient advice for the atlas:", error)
        if (!cancelled) setResolved({ source: asyncData, rows: null, failed: true })
      })
    return () => {
      cancelled = true
    }
  }, [asyncData])

  // A result from a previous farm/year promise is stale and reads as "loading".
  if (!resolved || resolved.source !== asyncData) return { rows: null, failed: false }
  return { rows: resolved.rows, failed: resolved.failed }
}

/**
 * Atlas layer "Bemestingsadvies": colours every field of the farm by its nutrient advice for the
 * selected nutrient (all in kg/ha). Hovering a field shows advice / applied / remaining for that
 * nutrient; clicking a field opens the full fertilization advice page of that field.
 */
export default function FarmAtlasNutrientAdviceBlock() {
  const { calendar, b_id_farm, fieldsData, asyncData, nutrientsDescription } =
    useLoaderData<typeof loader>()
  const navigate = useNavigate()
  const { capture } = useAnalytics()

  const fillLayerId = "fieldsNutrientAdvice"
  const outlineLayerId = "fieldsNutrientAdviceOutline"

  const nutrient = useSelectedAtlasNutrientAdviceStore((store) => store.nutrient)
  const mode = useSelectedAtlasNutrientAdviceStore((store) => store.mode)
  const setNutrient = useSelectedAtlasNutrientAdviceStore((store) => store.setNutrient)
  const setMode = useSelectedAtlasNutrientAdviceStore((store) => store.setMode)

  useEffect(() => {
    capture("atlas_viewed", { b_id_farm, calendar, layer: "nutrient_advice", nutrient, mode })
  }, [b_id_farm, calendar, nutrient, mode, capture])

  const { rows, failed: loadFailed } = useStreamedRows(asyncData)
  // Re-runs the loader, which returns a new `asyncData` promise (shown as "loading" again).
  const revalidator = useRevalidator()
  const rowsById = useMemo(
    () => (rows ? new Map(rows.map((row) => [row.b_id, row])) : null),
    [rows],
  )

  const nutrientDescription: NutrientDescription | undefined = nutrientsDescription.find(
    (item) => item.symbol === nutrient,
  )

  // Fields with `nav_state` / `nav_t` for the selected nutrient and mode.
  const shadedFields = useMemo(
    () =>
      fieldsData ? applyNutrientAdviceShading(fieldsData, rowsById, nutrient, mode) : undefined,
    [fieldsData, rowsById, nutrient, mode],
  )
  const scale = useMemo(
    () => (rows ? getNutrientAdviceScale(rows, nutrient) : null),
    [rows, nutrient],
  )
  const hasFieldsWithoutAdvice =
    shadedFields?.features.some((feature) => feature.properties?.nav_state === "none") ?? false

  const initialViewState = getViewState(fieldsData)

  const [showFields, setShowFields] = useState(true)
  const layerLayout = { visibility: showFields ? "visible" : "none" } as const
  const fillLayer = { ...getNutrientAdviceFillStyle(mode), layout: layerLayout } as LayerProps
  // White dotted outline around every field; keep its round caps and add the visibility toggle.
  const outlineStyle = getNutrientAdviceOutlineStyle()
  const outlineLayer = {
    ...outlineStyle,
    layout: { ...outlineStyle.layout, ...layerLayout },
  } as LayerProps

  /** Opens the full fertilization advice page of the clicked field. */
  function onFieldClick(feature: MapGeoJSONFeature) {
    const b_id = feature.properties.b_id as string | undefined
    if (b_id) {
      void navigate(`/farm/${b_id_farm}/${calendar}/nutrient_advice/${b_id}`)
    }
  }

  // Nutrients grouped by type for the selector, in the order of `getNutrientsDescription()`.
  const nutrientGroups = (["primary", "secondary", "trace"] as const).map((type) => ({
    type,
    label: NUTRIENT_ADVICE_COPY.nutrientGroups[type],
    items: nutrientsDescription.filter((item) => item.type === type),
  }))

  return (
    <div className="relative">
      <Atlas
        initialViewState={initialViewState}
        interactive={true}
        interactiveLayerIds={[fillLayerId]}
      >
        <Controls
          showFlyToFields={fieldsData && fieldsData.features.length > 0}
          initialViewState={initialViewState}
          showFields={showFields}
          onToggleFields={() => setShowFields(!showFields)}
        />

        <MapTilerAttribution />

        {shadedFields && (
          <FieldsSourceNotClickable id={fillLayerId} fieldsData={shadedFields}>
            <Layer id={fillLayerId} {...fillLayer} />
            <Layer id={outlineLayerId} {...outlineLayer} />
          </FieldsSourceNotClickable>
        )}

        <AtlasTooltip
          layers={[fillLayerId]}
          onFeatureClicked={onFieldClick}
          render={({ features, mode: tooltipMode }) => {
            if (features.length === 0) return null
            const feature = features[0]
            const row = rowsById?.get(feature.properties.b_id as string)

            return (
              <>
                <AtlasTooltipHeader>
                  <p className="text-foreground font-semibold">{feature.properties.b_name}</p>
                  <p className="text-muted-foreground mt-0.5">
                    {feature.properties.b_area != null &&
                      `${Number(feature.properties.b_area).toLocaleString("nl-NL")} ha`}
                    {row?.b_lu_name ? ` · ${row.b_lu_name}` : null}
                  </p>
                </AtlasTooltipHeader>
                {/* `block` overrides the default flex row of AtlasTooltipContent, so the body
                    uses the full width instead of sharing it with a second column. */}
                <AtlasTooltipContent className="block">
                  <NutrientAdviceTooltipBody
                    row={row}
                    isLoading={rowsById === null && !loadFailed}
                    loadFailed={loadFailed}
                    mode={mode}
                    nutrient={nutrientDescription}
                  />
                </AtlasTooltipContent>
                {/* Footer separated by a line, mirroring the line under the header:
                    a hint on hover (desktop), a button in the touch popup (mobile). */}
                <AtlasTooltipFooter className="border-t pt-1.5">
                  {tooltipMode === "popup" ? (
                    <Button type="button" onClick={() => onFieldClick(feature)} className="grow">
                      {NUTRIENT_ADVICE_COPY.openAdvice}
                    </Button>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      {NUTRIENT_ADVICE_COPY.clickHint}
                    </p>
                  )}
                </AtlasTooltipFooter>
              </>
            )
          }}
        />
      </Atlas>

      {/* Nutrient selector + display mode (top left, like the soil parameter dropdown) */}
      <Card className="absolute top-3 left-3 z-10 w-60 shadow-md">
        <CardContent className="flex flex-col gap-2 p-2">
          <Select value={nutrient} onValueChange={setNutrient}>
            <SelectTrigger className="h-8 w-full text-xs" aria-label="Kies een nutriënt">
              {nutrientDescription
                ? `${nutrientDescription.name} (${nutrientDescription.symbol})`
                : null}
            </SelectTrigger>
            <SelectContent className="max-h-[min(var(--radix-select-content-available-height,100vh),calc(var(--radix-select-trigger-height,0)+100*var(--spacing)))]">
              {nutrientGroups.map((group) => (
                <SelectGroup key={group.type}>
                  <SelectLabel>{group.label}</SelectLabel>
                  {group.items.map((item) => (
                    <SelectItem key={item.symbol} value={item.symbol}>
                      <div>
                        <div className="font-medium">
                          {item.name} ({item.symbol})
                        </div>
                        <div className="text-muted-foreground text-xs">{item.unit}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
            </SelectContent>
          </Select>
          <ToggleGroup
            type="single"
            size="sm"
            variant="outline"
            value={mode}
            // Radix sends "" when the active item is clicked again; keep the current mode then.
            onValueChange={(value) => {
              if (isNutrientAdviceMode(value)) setMode(value)
            }}
            className="w-full"
            aria-label="Weergave"
          >
            {NUTRIENT_ADVICE_MODES.map((item) => (
              <ToggleGroupItem key={item} value={item} className="grow px-1 text-xs">
                {NUTRIENT_ADVICE_COPY.modes[item]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </CardContent>
      </Card>

      {/* Legend (bottom left) */}
      {nutrientDescription && asyncData && (
        <div className="pointer-events-none absolute bottom-9 left-4">
          <NutrientAdviceLegend
            mode={mode}
            nutrientName={nutrientDescription.name}
            unit={nutrientDescription.unit}
            scale={scale}
            hasFieldsWithoutAdvice={hasFieldsWithoutAdvice}
            loadFailed={loadFailed}
            onRetry={() => void revalidator.revalidate()}
            isRetrying={revalidator.state === "loading"}
          />
        </div>
      )}
    </div>
  )
}

/** Legend label per applied-vs-advice class, reused in the tooltip. */
const STATUS_LABELS = {
  under: NUTRIENT_ADVICE_COPY.legendUnder,
  "on-target": NUTRIENT_ADVICE_COPY.legendMet,
  over: NUTRIENT_ADVICE_COPY.legendOver,
} as const

/**
 * Tooltip body for the hovered field: advice, already applied and remaining amount of the selected
 * nutrient in kg/ha, plus the shared progress bar. Shows the reason when there is no advice.
 *
 * In "% van advies" mode an advice of 0 (or less) is shown as "no advice", matching the grey fill
 * on the map (`getFieldShading`), instead of a progress bar and a red "over" status.
 */
function NutrientAdviceTooltipBody({
  row,
  isLoading,
  loadFailed,
  mode,
  nutrient,
}: {
  row: AtlasNutrientAdviceRow | undefined
  isLoading: boolean
  loadFailed: boolean
  mode: NutrientAdviceMode
  nutrient: NutrientDescription | undefined
}) {
  if (!nutrient) return null
  if (loadFailed) {
    return <p className="text-muted-foreground">{NUTRIENT_ADVICE_COPY.loadFailed}</p>
  }
  if (isLoading) {
    return <p className="text-muted-foreground">{NUTRIENT_ADVICE_COPY.loading}</p>
  }

  const value = row?.values[nutrient.symbol]
  if (!value) {
    return (
      <>
        <p className="text-muted-foreground">{nutrient.name}</p>
        <p>{row?.errorMessage ?? NUTRIENT_ADVICE_COPY.noAdvice}</p>
      </>
    )
  }

  if (mode === "percentage" && value.advice <= 0) {
    return (
      <div className="min-w-52 space-y-1.5">
        <p className="text-muted-foreground">
          {nutrient.name} ({nutrient.unit})
        </p>
        <p>{NUTRIENT_ADVICE_COPY.noAdviceZero}</p>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 whitespace-nowrap tabular-nums">
          <dt>{NUTRIENT_ADVICE_COPY.applied}</dt>
          <dd className="text-right">{formatKgPerHa(value.filling)}</dd>
        </dl>
      </div>
    )
  }

  const excessExempt = nutrient.symbol === "EOC"
  const remaining = value.advice - value.filling
  const { status } = computeAdviceProgress(value.filling, value.advice, excessExempt)
  const remainingLabel =
    remaining >= 0 ? NUTRIENT_ADVICE_COPY.remaining : NUTRIENT_ADVICE_COPY.surplus

  return (
    // min-w keeps labels such as "Al gegeven" on one line.
    <div className="min-w-52 space-y-1.5">
      <p className="text-muted-foreground">
        {nutrient.name} ({nutrient.unit})
      </p>
      <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-0.5 whitespace-nowrap tabular-nums">
        <dt>{NUTRIENT_ADVICE_COPY.advice}</dt>
        <dd className="text-right">{formatKgPerHa(value.advice)}</dd>
        <dt>{NUTRIENT_ADVICE_COPY.applied}</dt>
        <dd className="text-right">{formatKgPerHa(value.filling)}</dd>
        <dt className="font-medium">{remainingLabel}</dt>
        <dd className="text-right font-medium">{formatKgPerHa(Math.abs(remaining))}</dd>
      </dl>
      <AdviceProgressBar
        current={value.filling}
        target={value.advice}
        excessExempt={excessExempt}
      />
      {/* Same colour + label as the field on the map and in the legend. */}
      <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
        <span
          className="inline-block size-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: NUTRIENT_ADVICE_STATUS_COLORS[status] }}
        />
        {STATUS_LABELS[status]}
      </p>
    </div>
  )
}
