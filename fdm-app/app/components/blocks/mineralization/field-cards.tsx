import type {
  DynaV2NitrogenBalance,
  MineralizationInsights,
  SeasonPhase,
} from "@nmi-agro/fdm-calculator"
import { ChevronDown, Lightbulb } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { formatKgN, formatNumber } from "~/lib/mineralization"
import { cn } from "~/lib/utils"

/** Key figures shown above the chart; which figures depends on the phase. */
export function KeyFigures({
  insights,
  phase,
  isCurrentYear,
}: {
  insights: MineralizationInsights
  phase: SeasonPhase
  isCurrentYear: boolean
}) {
  const { kpis } = insights
  const figures: { label: string; value: string }[] =
    phase === "evaluation"
      ? [
          { label: "N-opname gewas", value: formatKgN(kpis.totalUptake) },
          {
            label: "Benutting",
            value:
              kpis.nUseEfficiency === null ? "–" : `${formatNumber(kpis.nUseEfficiency * 100)}%`,
          },
          { label: "Uitspoeling", value: formatKgN(kpis.totalLeaching) },
          { label: "Beschikbaar bij oogst", value: formatKgN(kpis.residualNAtHarvest) },
        ]
      : [
          {
            label: isCurrentYear ? "Beschikbare N nu" : "Beschikbaar bij oogst",
            value: formatKgN(isCurrentYear ? kpis.availableNNow : kpis.residualNAtHarvest),
          },
          {
            label: isCurrentYear ? "N-opname tot nu" : "N-opname gewas",
            value: formatKgN(isCurrentYear ? kpis.uptakeToDate : kpis.totalUptake),
          },
          { label: "Verwachte opname seizoen", value: formatKgN(kpis.totalUptake) },
          { label: "Verwachte uitspoeling", value: formatKgN(kpis.totalLeaching) },
        ]

  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {figures.map((figure) => (
        <div key={figure.label}>
          <dt className="text-muted-foreground text-xs">{figure.label}</dt>
          <dd className="text-lg font-semibold tabular-nums">{figure.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Plain-language explanation of the chart. */
export function ChartExplainer() {
  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="group text-muted-foreground -ml-2">
          <ChevronDown
            className="transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
          Wat zie ik?
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <dl className="text-muted-foreground max-w-prose space-y-2 text-sm">
          <div>
            <dt className="text-foreground inline font-medium">N-aanbod: </dt>
            <dd className="inline">
              stikstof die sinds de start van de berekening vrijkomt uit bodem, mest en gewasresten
              en voor het gewas beschikbaar komt.
            </dd>
          </div>
          <div>
            <dt className="text-foreground inline font-medium">N-opname: </dt>
            <dd className="inline">stikstof die het gewas tot die dag heeft opgenomen.</dd>
          </div>
          <div>
            <dt className="text-foreground inline font-medium">Beschikbare N: </dt>
            <dd className="inline">
              het verschil tussen aanbod en opname: wat er nog voor het gewas in de bodem zit.
              Blijft er na de oogst veel over, dan kan dat uitspoelen.
            </dd>
          </div>
          <div>
            <dt className="text-foreground inline font-medium">Nitraatuitspoeling: </dt>
            <dd className="inline">stikstof die als nitraat naar het grondwater verdwijnt.</dd>
          </div>
          <p>
            Tot vandaag rekent het model met gemeten weer, daarna met de weersverwachting en na
            afloop van de verwachting met het langjarig klimaatgemiddelde. De iconen boven de
            grafiek tonen zaai, bemesting en oogst; een gestippelde rand betekent gepland.
          </p>
        </dl>
      </CollapsibleContent>
    </Collapsible>
  )
}

const BALANCE_PARTS: {
  key: keyof DynaV2NitrogenBalance | "soil"
  label: string
  color: string
}[] = [
  { key: "soil", label: "Bodem", color: "var(--chart-3)" },
  { key: "b_n_fertilizer_mineral", label: "Kunstmest", color: "var(--chart-2)" },
  { key: "b_n_fertilizer_organic", label: "Organische mest", color: "var(--chart-1)" },
  {
    key: "b_n_fertilizer_preceeding",
    label: "Nawerking eerdere bemesting",
    color: "var(--chart-5)",
  },
  { key: "b_n_greenmanure", label: "Groenbemester", color: "var(--chart-4)" },
]

/** Workable nitrogen balance: where the available nitrogen comes from, against crop uptake. */
export function NitrogenBalanceCard({ balance }: { balance: DynaV2NitrogenBalance }) {
  const fromFertilizers =
    balance.b_n_fertilizer_mineral +
    balance.b_n_fertilizer_organic +
    balance.b_n_fertilizer_preceeding +
    balance.b_n_greenmanure
  const values: Record<string, number> = {
    soil: Math.max(balance.b_nw - fromFertilizers, 0),
    b_n_fertilizer_mineral: balance.b_n_fertilizer_mineral,
    b_n_fertilizer_organic: balance.b_n_fertilizer_organic,
    b_n_fertilizer_preceeding: balance.b_n_fertilizer_preceeding,
    b_n_greenmanure: balance.b_n_greenmanure,
  }
  const supply = Object.values(values).reduce((sum, v) => sum + v, 0)
  const scale = Math.max(supply, balance.b_n_uptake, 1)
  const parts = BALANCE_PARTS.filter((p) => values[p.key] > 0)
  const surplus = supply - balance.b_n_uptake

  return (
    <Card>
      <CardHeader>
        <CardTitle>Werkzame stikstofbalans</CardTitle>
        <CardDescription>
          Hoeveel werkzame stikstof er beschikbaar kwam en hoeveel het gewas daarvan opnam.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Aanbod</span>
            <span className="tabular-nums">{formatKgN(supply)}</span>
          </div>
          <div className="bg-muted flex h-3 gap-[2px] overflow-hidden rounded-sm" aria-hidden>
            {parts.map((part) => (
              <div
                key={part.key}
                style={{ width: `${(values[part.key] / scale) * 100}%`, background: part.color }}
              />
            ))}
          </div>
          <div className="flex items-baseline justify-between pt-1 text-sm">
            <span className="font-medium">Opname door het gewas</span>
            <span className="tabular-nums">{formatKgN(balance.b_n_uptake)}</span>
          </div>
          <div className="bg-muted h-3 overflow-hidden rounded-sm" aria-hidden>
            <div
              className="bg-foreground/70 h-full"
              style={{ width: `${(balance.b_n_uptake / scale) * 100}%` }}
            />
          </div>
        </div>
        <ul className="grid gap-1.5 text-sm sm:grid-cols-2">
          {parts.map((part) => (
            <li key={part.key} className="flex items-center justify-between gap-3">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <span
                  className="size-2.5 shrink-0 rounded-[2px]"
                  style={{ background: part.color }}
                  aria-hidden
                />
                {part.label}
              </span>
              <span className="tabular-nums">{formatKgN(values[part.key])}</span>
            </li>
          ))}
        </ul>
        <p className={cn("border-t pt-3 text-sm")}>
          {surplus >= 0
            ? `Er bleef ${formatKgN(surplus)} meer beschikbaar dan het gewas opnam.`
            : `Het gewas nam ${formatKgN(-surplus)} meer op dan er beschikbaar kwam.`}
        </p>
      </CardContent>
    </Card>
  )
}

/** Season evaluation: what went well and what can be improved. */
export function EvaluationCard({ insights }: { insights: MineralizationInsights }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Evaluatie van het seizoen</CardTitle>
        <CardDescription>Aandachtspunten voor het bemestingsplan van volgend jaar.</CardDescription>
      </CardHeader>
      <CardContent>
        {insights.improvementPoints.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Geen opvallende punten: aanbod en opname sloten goed op elkaar aan.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {insights.improvementPoints.map((point) => (
              <li key={point} className="flex gap-2">
                <Lightbulb className="text-muted-foreground mt-0.5 size-4 shrink-0" aria-hidden />
                {point}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
