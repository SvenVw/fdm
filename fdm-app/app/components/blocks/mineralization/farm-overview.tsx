import { ArrowRight, ChevronDown, CircleCheck } from "lucide-react"
import { NavLink } from "react-router"
import { Line, LineChart } from "recharts"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { Skeleton } from "~/components/ui/skeleton"
import { Spinner } from "~/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import {
  type AttentionItem,
  type FieldMineralizationOk,
  type FieldMineralizationOutcome,
  formatKgN,
  getAttentionItems,
  getAttentionPriority,
  getNotCalculatedReason,
  PHASE_LABELS,
  seriesInYear,
} from "~/lib/mineralization"
import { SignalChips } from "./signal-chips"

/** Field row of the farm overview. */
export interface FarmOverviewField {
  b_id: string
  b_name: string | null
  b_area: number | null
}

interface FarmOverviewProps {
  fields: FarmOverviewField[]
  outcomes: Record<string, FieldMineralizationOutcome>
  year: number
  isCurrentYear: boolean
  fieldHref: (b_id: string) => string
}

function cropName(outcome: FieldMineralizationOutcome | undefined): string | null {
  if (outcome?.status === "ok" || outcome?.status === "missing_harvest") {
    return outcome.mainCultivation.b_lu_name ?? outcome.mainCultivation.b_lu_catalogue
  }
  return null
}

/** One line summary of the calculation progress and the number of fields needing attention. */
export function FarmSummary({ fields, outcomes }: Pick<FarmOverviewProps, "fields" | "outcomes">) {
  const settled = fields.filter((f) => outcomes[f.b_id])
  const calculable = settled.filter((f) => {
    const status = outcomes[f.b_id]?.status
    return status === "ok" || status === "missing_harvest" || status === "error"
  })
  const attention = settled.filter((f) => getAttentionItems(outcomes[f.b_id]).length > 0)
  const pending = fields.length - settled.length

  return (
    <p className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
      {pending > 0 ? (
        <span className="text-foreground inline-flex items-center gap-1.5">
          <Spinner />
          {settled.length} van {fields.length} percelen berekend
        </span>
      ) : (
        <span className="text-foreground">{calculable.length} percelen berekend</span>
      )}
      <span aria-hidden>·</span>
      <span>
        {attention.length === 1 ? "1 perceel vraagt" : `${attention.length} percelen vragen`}{" "}
        aandacht
      </span>
    </p>
  )
}

/** List of fields with signals, most urgent first. */
export function FarmAttentionList({ fields, outcomes, fieldHref }: FarmOverviewProps) {
  const pending = fields.some((f) => !outcomes[f.b_id])
  const items = fields
    .map((field) => {
      const outcome = outcomes[field.b_id]
      const attention = outcome ? getAttentionItems(outcome) : []
      return { field, outcome, attention }
    })
    .filter((row) => row.attention.length > 0)
    .sort(
      (a, b) =>
        getAttentionPriority(a.attention[0] as AttentionItem) -
        getAttentionPriority(b.attention[0] as AttentionItem),
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aandacht nodig</CardTitle>
        <CardDescription>
          Percelen waar een oogst ontbreekt, een stikstoftekort dreigt, regen rond een geplande gift
          valt of veel stikstof verloren kan gaan.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            {pending ? (
              <>
                <Spinner /> Percelen worden berekend…
              </>
            ) : (
              <>
                <CircleCheck className="size-4" aria-hidden /> Geen percelen die nu aandacht vragen.
              </>
            )}
          </p>
        ) : (
          <ul className="divide-y">
            {items.map(({ field, outcome, attention }) => (
              <li
                key={field.b_id}
                className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center"
              >
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-sm font-medium">
                    {field.b_name ?? "Perceel"}
                    {cropName(outcome) ? (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        · {cropName(outcome)}
                      </span>
                    ) : null}
                  </p>
                  <SignalChips items={attention} />
                </div>
                <Button asChild variant="outline" size="sm" className="self-start sm:self-center">
                  <NavLink to={fieldHref(field.b_id)}>
                    {attention[0]?.kind === "missing_harvest" ? "Oogst invullen" : "Bekijk perceel"}
                    <ArrowRight aria-hidden />
                  </NavLink>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function AvailableNSparkline({ outcome, year }: { outcome: FieldMineralizationOk; year: number }) {
  const data = seriesInYear(outcome.result.series, year).filter((_, i) => i % 3 === 0)
  if (data.length < 2) return null
  return (
    <LineChart width={96} height={28} data={data} aria-hidden>
      <Line
        type="monotone"
        dataKey="b_n_available"
        stroke="var(--chart-2)"
        strokeWidth={1.5}
        dot={false}
        isAnimationActive={false}
      />
    </LineChart>
  )
}

/** Table with the key figures of every calculated field. */
export function FarmFieldTable({
  fields,
  outcomes,
  year,
  isCurrentYear,
  fieldHref,
}: FarmOverviewProps) {
  const rows = fields.filter((f) => {
    const status = outcomes[f.b_id]?.status
    return (
      status === undefined || status === "ok" || status === "missing_harvest" || status === "error"
    )
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alle percelen</CardTitle>
        <CardDescription>
          {isCurrentYear
            ? "Beschikbare stikstof vandaag, en opname en uitspoeling tot nu toe."
            : `Beschikbare stikstof bij de oogst, en opname en uitspoeling over ${year}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Perceel</TableHead>
              <TableHead className="hidden md:table-cell">Hoofdteelt</TableHead>
              <TableHead className="hidden lg:table-cell">Fase</TableHead>
              <TableHead className="text-right">
                {isCurrentYear ? "Beschikbare N nu" : "Beschikbare N bij oogst"}
              </TableHead>
              <TableHead className="hidden text-right sm:table-cell">N-opname</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Uitspoeling</TableHead>
              <TableHead className="hidden xl:table-cell">
                <span className="sr-only">Verloop beschikbare N</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((field) => {
              const outcome = outcomes[field.b_id]
              const name = (
                <NavLink
                  to={fieldHref(field.b_id)}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {field.b_name ?? "Perceel"}
                </NavLink>
              )
              if (!outcome) {
                return (
                  <TableRow key={field.b_id}>
                    <TableCell>{name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="ml-auto h-4 w-20" />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Skeleton className="ml-auto h-4 w-16" />
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <Skeleton className="h-6 w-24" />
                    </TableCell>
                  </TableRow>
                )
              }
              if (outcome.status !== "ok") {
                return (
                  <TableRow key={field.b_id}>
                    <TableCell>{name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      {cropName(outcome) ?? "–"}
                    </TableCell>
                    <TableCell colSpan={5} className="text-muted-foreground text-sm">
                      {outcome.status === "missing_harvest"
                        ? "Vul de gemeten of geplande oogst in om te rekenen."
                        : outcome.status === "error"
                          ? outcome.message
                          : null}
                    </TableCell>
                  </TableRow>
                )
              }
              const { kpis, defaultPhase } = outcome.insights
              const availableN = isCurrentYear ? kpis.availableNNow : kpis.residualNAtHarvest
              return (
                <TableRow key={field.b_id}>
                  <TableCell>{name}</TableCell>
                  <TableCell className="hidden md:table-cell">{cropName(outcome)}</TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {PHASE_LABELS[defaultPhase]}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatKgN(availableN)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatKgN(kpis.uptakeToDate)}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatKgN(kpis.leachingToDate)}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell">
                    <AvailableNSparkline outcome={outcome} year={year} />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/** Collapsed list of fields that are not calculated, with the reason. */
export function NotCalculatedFields({ fields, outcomes, year }: FarmOverviewProps) {
  const rows = fields.flatMap((field) => {
    const outcome = outcomes[field.b_id]
    if (
      outcome?.status === "excluded" ||
      outcome?.status === "missing_location" ||
      outcome?.status === "no_cultivation"
    ) {
      return [{ field, reason: getNotCalculatedReason(outcome, year) }]
    }
    return []
  })
  if (rows.length === 0) return null

  return (
    <Collapsible>
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="group text-muted-foreground -ml-2">
          <ChevronDown
            className="transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
          Niet berekend ({rows.length})
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="text-muted-foreground mt-2 space-y-1 text-sm">
          {rows.map(({ field, reason }) => (
            <li key={field.b_id}>
              <span className="text-foreground">{field.b_name ?? "Perceel"}</span> — {reason}
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}
