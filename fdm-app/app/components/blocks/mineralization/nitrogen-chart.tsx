import type { DynaV2DailyPoint, MineralizationEvent } from "@nmi-agro/fdm-calculator"
import {
  ChevronDown,
  CloudRain,
  Droplet,
  type LucideIcon,
  Package,
  Shovel,
  Sprout,
  Wheat,
} from "lucide-react"
import { useState } from "react"
import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { Button } from "~/components/ui/button"
import { type ChartConfig, ChartContainer } from "~/components/ui/chart"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Tooltip as UiTooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { formatKgN, formatLongDate, formatNumber, formatShortDate } from "~/lib/mineralization"
import { cn } from "~/lib/utils"

const DAY_MS = 24 * 60 * 60 * 1000
const Y_AXIS_WIDTH = 56
const MARGIN = { top: 16, right: 16, left: 0, bottom: 0 }

type SeriesKey = "b_nw" | "b_n_uptake" | "b_n_available"

const chartConfig = {
  b_nw: { label: "N-aanbod", color: "var(--chart-3)" },
  b_n_uptake: { label: "N-opname", color: "var(--chart-2)" },
  b_n_available: { label: "Beschikbare N", color: "var(--chart-5)" },
  b_no3_leach: { label: "Nitraatuitspoeling", color: "var(--chart-1)" },
} satisfies ChartConfig

interface ChartRow {
  t: number
  date: string
  b_nw: number
  b_n_uptake: number
  b_n_available: number
  b_no3_leach: number
  s_b_nw?: number
  s_b_n_uptake?: number
  s_b_n_available?: number
  s_b_no3_leach?: number
}

function toTime(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

function buildRows(series: DynaV2DailyPoint[], scenario?: DynaV2DailyPoint[]): ChartRow[] {
  const scenarioByDate = new Map(scenario?.map((p) => [p.b_date_calculation, p]))
  const dates = [
    ...new Set([...series.map((p) => p.b_date_calculation), ...scenarioByDate.keys()]),
  ].sort()
  const byDate = new Map(series.map((p) => [p.b_date_calculation, p]))
  return dates.flatMap((date) => {
    const p = byDate.get(date)
    const s = scenarioByDate.get(date)
    if (!p && !s) return []
    return [
      {
        t: toTime(date),
        date,
        b_nw: p?.b_nw ?? Number.NaN,
        b_n_uptake: p?.b_n_uptake ?? Number.NaN,
        b_n_available: p?.b_n_available ?? Number.NaN,
        b_no3_leach: p?.b_no3_leach ?? Number.NaN,
        ...(s
          ? {
              s_b_nw: s.b_nw,
              s_b_n_uptake: s.b_n_uptake,
              s_b_n_available: s.b_n_available,
              s_b_no3_leach: s.b_no3_leach,
            }
          : {}),
      },
    ]
  })
}

function monthTicks(from: number, to: number): number[] {
  const ticks: number[] = []
  const d = new Date(from)
  d.setUTCDate(1)
  if (d.getTime() < from) d.setUTCMonth(d.getUTCMonth() + 1)
  while (d.getTime() <= to) {
    ticks.push(d.getTime())
    d.setUTCMonth(d.getUTCMonth() + 1)
  }
  return ticks
}

const monthFormatter = new Intl.DateTimeFormat("nl-NL", { month: "short", timeZone: "UTC" })

function getEventIcon(event: MineralizationEvent): LucideIcon {
  switch (event.type) {
    case "sowing":
      return Sprout
    case "harvest":
      return Wheat
    case "cultivation_end":
      return Shovel
    case "fertilizer":
      return event.fertilizerKind === "mineral" ? Package : Droplet
  }
}

function describeEvent(event: MineralizationEvent): string {
  const amount =
    event.amount !== undefined ? ` · ${formatNumber(event.amount, 1)} ${event.unit ?? ""}` : ""
  switch (event.type) {
    case "sowing":
      return `Zaaien / start teelt: ${event.label}`
    case "harvest":
      return `${event.planned ? "Geplande oogst" : "Oogst"}: ${event.label}${amount}`
    case "cultivation_end":
      return `Einde teelt: ${event.label}`
    case "fertilizer":
      return `${event.planned ? "Geplande bemesting" : "Bemesting"}: ${event.label}${amount} (${
        event.fertilizerKind === "mineral" ? "kunstmest" : "organisch"
      })`
  }
}

function TooltipContentBox({
  active,
  payload,
  hasScenario,
}: {
  active?: boolean
  payload?: { payload: ChartRow }[]
  hasScenario: boolean
}) {
  const row = payload?.[0]?.payload
  if (!active || !row) return null
  const lines: { key: string; label: string; value: number | undefined; scenario?: number }[] = [
    { key: "b_nw", label: "N-aanbod", value: row.b_nw, scenario: row.s_b_nw },
    { key: "b_n_uptake", label: "N-opname", value: row.b_n_uptake, scenario: row.s_b_n_uptake },
    {
      key: "b_n_available",
      label: "Beschikbare N",
      value: row.b_n_available,
      scenario: row.s_b_n_available,
    },
    {
      key: "b_no3_leach",
      label: "Uitspoeling",
      value: row.b_no3_leach,
      scenario: row.s_b_no3_leach,
    },
  ]
  return (
    <div className="bg-background grid min-w-48 gap-1.5 rounded-lg border px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{formatLongDate(row.date)}</p>
      {lines.map((line) => (
        <div key={line.key} className="flex items-center justify-between gap-4">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <span
              className="size-2 rounded-[2px]"
              style={{ background: `var(--color-${line.key})` }}
              aria-hidden
            />
            {line.label}
          </span>
          <span className="text-foreground tabular-nums">
            {Number.isNaN(line.value) ? "–" : formatKgN(line.value)}
            {hasScenario && line.scenario !== undefined ? (
              <span className="text-muted-foreground"> → {formatKgN(line.scenario)}</span>
            ) : null}
          </span>
        </div>
      ))}
    </div>
  )
}

/** Props of {@link NitrogenChart}. */
export interface NitrogenChartProps {
  /** Simulation days of the selected year. */
  series: DynaV2DailyPoint[]
  /** Simulation days of a scenario, drawn dashed. */
  scenarioSeries?: DynaV2DailyPoint[]
  events: MineralizationEvent[]
  /** Today (`YYYY-MM-DD`) when it falls within the selected year. */
  today: string | null
  /** Last day of the weather forecast (`YYYY-MM-DD`) when today falls within the selected year. */
  forecastEnd: string | null
  /** Dates of planned events with rain in the forecast. */
  rainEventDates?: string[]
}

/**
 * Interactive season chart: nitrogen supply, uptake and available nitrogen, with nitrate leaching
 * in a synchronised panel below and the field events on a lane above.
 */
export function NitrogenChart({
  series,
  scenarioSeries,
  events,
  today,
  forecastEnd,
  rainEventDates = [],
}: NitrogenChartProps) {
  const rows = buildRows(series, scenarioSeries)
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set())
  const [range, setRange] = useState<{ startIndex: number; endIndex: number } | null>(null)
  const hasScenario = !!scenarioSeries

  if (rows.length < 2) {
    return (
      <p className="text-muted-foreground text-sm">
        Er zijn geen berekende dagen in dit jaar om te tonen.
      </p>
    )
  }

  const startIndex = Math.min(range?.startIndex ?? 0, rows.length - 1)
  const endIndex = Math.min(range?.endIndex ?? rows.length - 1, rows.length - 1)
  const visible = rows.slice(startIndex, endIndex + 1)
  const from = rows[startIndex].t
  const to = rows[endIndex].t
  const span = Math.max(to - from, DAY_MS)
  const ticks = monthTicks(from, to)
  const todayT = today ? toTime(today) : null
  const forecastEndT = forecastEnd ? toTime(forecastEnd) : null
  const lastT = rows[rows.length - 1].t

  // Stack events that would overlap on the lane
  const laneEvents = events
    .map((event) => ({ event, t: toTime(event.date) }))
    .filter(({ t }) => t >= from && t <= to)
    .map(({ event, t }) => ({ event, left: ((t - from) / span) * 100 }))
  const placed: { event: MineralizationEvent; left: number; row: number }[] = []
  for (const item of laneEvents) {
    let row = 0
    while (placed.some((p) => p.row === row && Math.abs(p.left - item.left) < 2.5)) row++
    placed.push({ ...item, row })
  }
  const laneRows = Math.max(1, ...placed.map((p) => p.row + 1))

  const toggle = (key: SeriesKey) =>
    setHidden((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })

  const xAxis = (
    <XAxis
      dataKey="t"
      type="number"
      domain={[from, to]}
      ticks={ticks}
      tickFormatter={(t: number) => monthFormatter.format(new Date(t))}
      tickLine={false}
      axisLine={false}
      tickMargin={8}
      allowDataOverflow
    />
  )
  const zones = (
    <>
      {todayT !== null && forecastEndT !== null ? (
        <>
          <ReferenceArea
            x1={todayT}
            x2={Math.min(forecastEndT, to)}
            fill="var(--muted-foreground)"
            fillOpacity={0.1}
            ifOverflow="hidden"
          />
          {forecastEndT < lastT ? (
            <ReferenceArea
              x1={forecastEndT}
              x2={to}
              fill="var(--muted-foreground)"
              fillOpacity={0.04}
              ifOverflow="hidden"
            />
          ) : null}
        </>
      ) : null}
      {todayT !== null ? (
        <ReferenceLine
          x={todayT}
          stroke="var(--foreground)"
          strokeDasharray="4 4"
          ifOverflow="hidden"
        />
      ) : null}
    </>
  )

  const seriesKeys: SeriesKey[] = ["b_nw", "b_n_uptake", "b_n_available"]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lijnen tonen of verbergen">
          {seriesKeys.map((key) => (
            <Button
              key={key}
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={!hidden.has(key)}
              onClick={() => toggle(key)}
              className={cn(
                "h-7 gap-1.5 px-2.5 text-xs",
                hidden.has(key) && "text-muted-foreground",
              )}
            >
              <span
                className={cn("size-2.5 rounded-[2px]", hidden.has(key) && "opacity-30")}
                style={{ background: chartConfig[key].color }}
                aria-hidden
              />
              {chartConfig[key].label}
            </Button>
          ))}
          {hasScenario ? (
            <span className="text-muted-foreground inline-flex items-center gap-1.5 px-1 text-xs">
              <span className="w-4 border-t-2 border-dashed border-current" aria-hidden />
              Scenario
            </span>
          ) : null}
        </div>
        {todayT !== null ? (
          <p className="text-muted-foreground flex items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-muted-foreground/25 size-2.5 rounded-[2px]" aria-hidden />
              Weersverwachting
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="bg-muted-foreground/10 size-2.5 rounded-[2px]" aria-hidden />
              Klimaatgemiddelde
            </span>
          </p>
        ) : null}
      </div>

      {/* Event lane, aligned with the plot area */}
      <div
        className="relative"
        style={{
          height: `${laneRows * 28}px`,
          marginLeft: `${Y_AXIS_WIDTH + MARGIN.left}px`,
          marginRight: `${MARGIN.right}px`,
        }}
        aria-label="Gebeurtenissen op het perceel"
        role="list"
      >
        {placed.map(({ event, left, row }) => {
          const Icon = getEventIcon(event)
          const rain = event.planned && rainEventDates.includes(event.date)
          return (
            <UiTooltip key={`${event.type}-${event.date}-${event.p_app_id ?? event.b_lu ?? ""}`}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  role="listitem"
                  className={cn(
                    "bg-background text-foreground focus-visible:ring-ring absolute flex size-6 -translate-x-1/2 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:outline-none",
                    event.planned && "border-dashed",
                    rain && "border-chart-1 border-2",
                  )}
                  style={{ left: `${left}%`, top: `${row * 28}px` }}
                  aria-label={`${formatShortDate(event.date)}: ${describeEvent(event)}${
                    rain ? " — regen verwacht" : ""
                  }`}
                >
                  <Icon className="size-3.5" aria-hidden />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{formatLongDate(event.date)}</p>
                <p>{describeEvent(event)}</p>
                {rain ? (
                  <p className="mt-1 inline-flex items-center gap-1">
                    <CloudRain className="size-3.5" aria-hidden /> Regen verwacht rond deze datum
                  </p>
                ) : null}
              </TooltipContent>
            </UiTooltip>
          )
        })}
      </div>

      <ChartContainer config={chartConfig} className="aspect-auto h-72 w-full">
        <ComposedChart data={rows} margin={MARGIN} syncId="mineralization" syncMethod="value">
          <CartesianGrid vertical={false} strokeOpacity={0.5} />
          {xAxis}
          <YAxis
            width={Y_AXIS_WIDTH}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => formatNumber(v)}
            label={{
              value: "kg N/ha",
              angle: -90,
              position: "insideLeft",
              style: { fontSize: 11, fill: "var(--muted-foreground)" },
            }}
          />
          {zones}
          {events.map((event) => {
            const t = toTime(event.date)
            return t >= from && t <= to ? (
              <ReferenceLine
                key={`line-${event.type}-${event.date}-${event.p_app_id ?? event.b_lu ?? ""}`}
                x={t}
                stroke="var(--border)"
                ifOverflow="hidden"
              />
            ) : null
          })}
          <Tooltip
            content={<TooltipContentBox hasScenario={hasScenario} />}
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
          />
          {!hidden.has("b_n_available") ? (
            <Area
              dataKey="b_n_available"
              type="monotone"
              fill="var(--color-b_n_available)"
              fillOpacity={0.18}
              stroke="var(--color-b_n_available)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          ) : null}
          {!hidden.has("b_nw") ? (
            <Line
              dataKey="b_nw"
              type="monotone"
              stroke="var(--color-b_nw)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
          {!hidden.has("b_n_uptake") ? (
            <Line
              dataKey="b_n_uptake"
              type="monotone"
              stroke="var(--color-b_n_uptake)"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          ) : null}
          {hasScenario
            ? seriesKeys
                .filter((key) => !hidden.has(key))
                .map((key) => (
                  <Line
                    key={`s_${key}`}
                    dataKey={`s_${key}`}
                    type="monotone"
                    stroke={`var(--color-${key})`}
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={false}
                    isAnimationActive={false}
                  />
                ))
            : null}
          <Brush
            dataKey="t"
            height={24}
            startIndex={startIndex}
            endIndex={endIndex}
            travellerWidth={8}
            stroke="var(--muted-foreground)"
            fill="var(--background)"
            tickFormatter={(t: number) => formatShortDate(new Date(t).toISOString().slice(0, 10))}
            onChange={(next) => {
              if (typeof next?.startIndex === "number" && typeof next?.endIndex === "number") {
                setRange({ startIndex: next.startIndex, endIndex: next.endIndex })
              }
            }}
          />
        </ComposedChart>
      </ChartContainer>

      <div>
        <p className="text-muted-foreground mb-1 text-xs font-medium">Nitraatuitspoeling</p>
        <ChartContainer config={chartConfig} className="aspect-auto h-28 w-full">
          <ComposedChart
            data={visible}
            margin={{ ...MARGIN, top: 4 }}
            syncId="mineralization"
            syncMethod="value"
          >
            <CartesianGrid vertical={false} strokeOpacity={0.5} />
            {xAxis}
            <YAxis
              width={Y_AXIS_WIDTH}
              tickLine={false}
              axisLine={false}
              tickCount={3}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            {zones}
            <Tooltip content={() => null} cursor={{ stroke: "var(--muted-foreground)" }} />
            <Area
              dataKey="b_no3_leach"
              type="monotone"
              fill="var(--color-b_no3_leach)"
              fillOpacity={0.2}
              stroke="var(--color-b_no3_leach)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            {hasScenario ? (
              <Line
                dataKey="s_b_no3_leach"
                type="monotone"
                stroke="var(--color-b_no3_leach)"
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                isAnimationActive={false}
              />
            ) : null}
          </ComposedChart>
        </ChartContainer>
      </div>

      <SeriesTable rows={rows} />
    </div>
  )
}

/** Weekly values as a table, for screen readers and exact reading. */
function SeriesTable({ rows }: { rows: ChartRow[] }) {
  const weekly = rows.filter((_, i) => i % 7 === 0 || i === rows.length - 1)
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="group text-muted-foreground -ml-2">
          <ChevronDown
            className="transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
          Toon als tabel
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="max-h-80 overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Datum</TableHead>
                <TableHead className="text-right">N-aanbod</TableHead>
                <TableHead className="text-right">N-opname</TableHead>
                <TableHead className="text-right">Beschikbare N</TableHead>
                <TableHead className="text-right">Uitspoeling</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weekly.map((row) => (
                <TableRow key={row.date}>
                  <TableCell>{formatShortDate(row.date)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatKgN(row.b_nw)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatKgN(row.b_n_uptake)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatKgN(row.b_n_available)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatKgN(row.b_no3_leach)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
