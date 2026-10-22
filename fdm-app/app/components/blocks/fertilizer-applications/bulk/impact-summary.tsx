import { AlertTriangle, ArrowRight, ChevronDown, CircleCheck, Info } from "lucide-react"
import { type ReactNode, useId, useState } from "react"
import { NavLink } from "react-router"
import { computeNormProgress } from "~/components/blocks/norms/progress-bar"
import { computeAdviceProgress } from "~/components/blocks/nutrient-advice/progress-bar"
import { Card, CardContent } from "~/components/ui/card"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { Label } from "~/components/ui/label"
import { Skeleton } from "~/components/ui/skeleton"
import { Spinner } from "~/components/ui/spinner"
import { Switch } from "~/components/ui/switch"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import type { AdviceSummary, BalanceSummary, NormOutcome } from "./aggregate"
import type { ImpactState } from "./impact-state"
import type { BulkFieldIssue, BulkNormKey, BulkNormValues, BulkNutrient } from "./types"
import { ImpactBar, type ImpactBarTone } from "./impact-bar"
import { ComparisonLabel, formatKg } from "./status"

/** Labels, units and explanations of the farm norms, as on the norms page. */
export const NORM_DESCRIPTIONS: Record<
  BulkNormKey,
  { label: string; unit: string; tooltip: string }
> = {
  nitrogen: {
    label: "Stikstof, werkzaam",
    unit: "kg N",
    tooltip: "Werkzame stikstof volgens forfaitaire gehalten",
  },
  phosphate: {
    label: "Fosfaat",
    unit: "kg P₂O₅",
    tooltip: "Fosfaataanvoer incl. mogelijke stimuleringsregeling",
  },
  manure: {
    label: "Stikstof uit dierlijke mest",
    unit: "kg N",
    tooltip: "Totaal stikstof via dierlijke mest",
  },
  renure: {
    label: "RENURE",
    unit: "kg N",
    tooltip: "Stikstof uit RENURE, max. 80 kg N/ha bovenop dierlijke mest",
  },
}

const NUTRIENT_DESCRIPTIONS: Record<
  BulkNutrient,
  { label: string; unit: string; tooltip?: string }
> = {
  n: { label: "N", unit: "kg N/ha", tooltip: "Werkzame stikstof" },
  p: { label: "P₂O₅", unit: "kg P₂O₅/ha" },
  k: { label: "K₂O", unit: "kg K₂O/ha" },
}

/** Shared frame of an impact block: heading, basis, pending indicator, link and footer. */
function ImpactBlock({
  title,
  basis,
  detailHref,
  detailLabel,
  pending,
  headerAction,
  children,
  footer,
}: {
  title: string
  basis: string
  detailHref: string
  detailLabel: string
  pending?: boolean
  headerAction?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <section aria-label={title} className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground text-xs">{basis}</p>
        </div>
        <div className="flex items-center gap-3">
          {pending && (
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs" role="status">
              <Spinner className="size-3.5" />
              Effect berekenen…
            </span>
          )}
          {headerAction}
          <NavLink
            to={detailHref}
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 text-xs underline-offset-4 hover:underline"
          >
            {detailLabel}
            <ArrowRight className="size-3" aria-hidden="true" />
          </NavLink>
        </div>
      </div>
      <div className={cn("space-y-3 transition-opacity", pending && "[&_[data-after]]:opacity-50")}>
        {children}
      </div>
      {footer}
    </section>
  )
}

/** One metric row: label, "current → after / reference unit", bar and status. */
function MetricRow({
  label,
  tooltip,
  unit,
  current,
  after,
  reference,
  referenceLabel,
  tone,
  status,
}: {
  label: string
  tooltip?: string
  unit: string
  current: number
  after?: number
  reference: number
  referenceLabel: string
  tone: ImpactBarTone
  status?: ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-sm">
        <span className="flex items-center gap-1 font-medium">
          {label}
          {tooltip && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button type="button" className="text-muted-foreground" aria-label={tooltip}>
                  <Info className="size-3.5" aria-hidden="true" />
                </button>
              </TooltipTrigger>
              <TooltipContent>{tooltip}</TooltipContent>
            </Tooltip>
          )}
        </span>
        <span className="flex items-baseline gap-2 tabular-nums">
          <span>
            {formatKg(current)}
            {after !== undefined && (
              <span data-after className="font-semibold">
                {" "}
                → {formatKg(after)}
              </span>
            )}
            <span className="text-muted-foreground">
              {" "}
              / {formatKg(reference)} {unit}
            </span>
            <span className="sr-only">{referenceLabel}</span>
          </span>
          {status}
        </span>
      </div>
      <ImpactBar current={current} after={after} reference={reference} tone={tone} />
    </div>
  )
}

/** "x van y percelen meegenomen" with an expandable list of reasons. */
function CoverageFooter({
  counted,
  total,
  issues,
}: {
  counted: number
  total: number
  issues: BulkFieldIssue[]
}) {
  if (issues.length === 0 && counted === total) return null
  return (
    <Collapsible>
      <CollapsibleTrigger className="text-muted-foreground hover:text-foreground group flex items-center gap-1 text-xs">
        {counted} van {total} percelen meegenomen
        {issues.length > 0 && (
          <ChevronDown
            className="size-3 transition-transform group-data-[state=open]:rotate-180"
            aria-hidden="true"
          />
        )}
      </CollapsibleTrigger>
      {issues.length > 0 && (
        <CollapsibleContent>
          <ul className="text-muted-foreground mt-2 space-y-1 text-xs">
            {issues.map((issue) => (
              <li key={`${issue.b_id}-${issue.message}`}>
                <span className="text-foreground font-medium">{issue.b_name}</span>: {issue.message}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
      )}
    </Collapsible>
  )
}

function BlockSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Laden">
      {Array.from({ length: rows }, (_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton rows
        <div key={i} className="space-y-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

function BlockError({ message }: { message: string }) {
  return <p className="text-muted-foreground text-sm">{message}</p>
}

const normTone = (used: number, limit: number): ImpactBarTone =>
  computeNormProgress(used, limit).isOverLimit ? "over" : "ok"

const adviceTone = (current: number, target: number): ImpactBarTone => {
  const { status } = computeAdviceProgress(current, target)
  return status === "on-target" ? "ok" : status
}

/**
 * The legal application norms (gebruiksruimte) of the whole farm, with the filling before and
 * after the application. Totals in kg.
 */
export function FarmNormsImpact({
  detailHref,
  loading,
  error,
  available,
  showRenure,
  farmNorms,
  current,
  after,
  pending,
  counted,
  total,
  issues,
  title = "Gebruiksruimte bedrijf",
  basis = "Hele bedrijf, totaal in kg",
  perHectare = false,
  headerAction,
}: {
  detailHref: string
  loading: boolean
  error?: string
  available: boolean
  showRenure: boolean
  farmNorms?: BulkNormValues
  current?: BulkNormValues
  after?: BulkNormValues
  pending: boolean
  counted: number
  total: number
  issues: BulkFieldIssue[]
  title?: string
  basis?: string
  /** Show the units per hectare, for the norms of a single field. */
  perHectare?: boolean
  headerAction?: ReactNode
}) {
  const keys: BulkNormKey[] = showRenure
    ? ["nitrogen", "phosphate", "manure", "renure"]
    : ["nitrogen", "phosphate", "manure"]

  return (
    <ImpactBlock
      title={title}
      basis={basis}
      detailHref={detailHref}
      detailLabel="Gebruiksnormen"
      pending={pending && available}
      headerAction={headerAction}
      footer={
        available && !loading && !error ? (
          <CoverageFooter counted={counted} total={total} issues={issues} />
        ) : null
      }
    >
      {loading ? (
        <BlockSkeleton rows={3} />
      ) : error ? (
        <BlockError message={error} />
      ) : !available || !farmNorms || !current ? (
        <p className="text-muted-foreground text-sm">
          Geen gebruiksnormen beschikbaar voor dit jaar.
        </p>
      ) : (
        keys.map((key) => {
          const norm = farmNorms[key] ?? 0
          const shown = after?.[key] ?? current[key] ?? 0
          const { label, unit, tooltip } = NORM_DESCRIPTIONS[key]
          const isOver = computeNormProgress(shown, norm).isOverLimit
          return (
            <MetricRow
              key={key}
              label={label}
              tooltip={tooltip}
              unit={perHectare ? `${unit}/ha` : unit}
              current={current[key] ?? 0}
              after={after?.[key]}
              reference={norm}
              referenceLabel="gebruiksruimte"
              tone={normTone(shown, norm)}
              status={
                <ComparisonLabel status={isOver ? "over" : "on-target"} noun="norm" compact />
              }
            />
          )
        })
      )}
    </ImpactBlock>
  )
}

/** The area-weighted N, P₂O₅ and K₂O dose against the advice of the included fields, in kg/ha. */
export function AdviceImpact({
  detailHref,
  loading,
  error,
  summary,
  pending,
  issues,
  title = "Advies selectie",
  basis = "Geselecteerde percelen, oppervlaktegewogen gemiddelde per ha",
  headerAction,
}: {
  detailHref: string
  loading: boolean
  error?: string
  summary?: AdviceSummary
  pending: boolean
  issues: BulkFieldIssue[]
  title?: string
  basis?: string
  headerAction?: ReactNode
}) {
  return (
    <ImpactBlock
      title={title}
      basis={basis}
      headerAction={headerAction}
      detailHref={detailHref}
      detailLabel="Bemestingsadvies"
      pending={pending}
      footer={
        summary && !loading && !error ? (
          <CoverageFooter
            counted={summary.countedFields}
            total={summary.includedFields}
            issues={issues}
          />
        ) : null
      }
    >
      {loading ? (
        <BlockSkeleton rows={3} />
      ) : error ? (
        <BlockError message={error} />
      ) : !summary || summary.countedFields === 0 ? (
        <p className="text-muted-foreground text-sm">
          Voor de geselecteerde percelen is geen advies beschikbaar.
        </p>
      ) : (
        (["n", "p", "k"] as const).map((nutrient) => {
          const { label, unit, tooltip } = NUTRIENT_DESCRIPTIONS[nutrient]
          const advice = summary.advice[nutrient]
          const shown = summary.doseAfter?.[nutrient] ?? summary.dose[nutrient]
          const { status } = computeAdviceProgress(shown, advice)
          return (
            <MetricRow
              key={nutrient}
              label={label}
              tooltip={tooltip}
              unit={unit}
              current={summary.dose[nutrient]}
              after={summary.doseAfter?.[nutrient]}
              reference={advice}
              referenceLabel="advies"
              tone={adviceTone(shown, advice)}
              status={<ComparisonLabel status={status} noun="advies" />}
            />
          )
        })
      )}
    </ImpactBlock>
  )
}

/** The area-weighted nitrogen balance against the target of the included fields, in kg N/ha. */
export function BalanceImpact({
  detailHref,
  loading,
  error,
  summary,
  pending,
  issues,
  title = "Stikstofbalans selectie",
  basis = "Geselecteerde percelen zonder bufferstroken, oppervlaktegewogen in kg N/ha",
  headerAction,
}: {
  detailHref: string
  loading: boolean
  error?: string
  summary?: BalanceSummary
  pending: boolean
  issues: BulkFieldIssue[]
  title?: string
  basis?: string
  headerAction?: ReactNode
}) {
  const current = summary?.current
  const after = summary?.after
  const shown = after ?? current
  const isOver = shown ? shown.balance > shown.target : false

  return (
    <ImpactBlock
      title={title}
      basis={basis}
      headerAction={headerAction}
      detailHref={detailHref}
      detailLabel="Stikstofbalans"
      pending={pending}
      footer={
        summary && !loading && !error ? (
          <CoverageFooter
            counted={summary.countedFields}
            total={summary.includedFields}
            issues={issues}
          />
        ) : null
      }
    >
      {loading ? (
        <BlockSkeleton rows={2} />
      ) : error ? (
        <BlockError message={error} />
      ) : !current || !summary || summary.countedFields === 0 ? (
        <p className="text-muted-foreground text-sm">
          Voor de geselecteerde percelen is geen stikstofbalans beschikbaar.
        </p>
      ) : (
        <>
          <MetricRow
            label="Balans"
            unit="kg N/ha"
            current={current.balance}
            after={after?.balance}
            reference={current.target}
            referenceLabel="streefwaarde"
            tone={isOver ? "over" : "ok"}
            status={<ComparisonLabel status={isOver ? "over" : "on-target"} noun="streefwaarde" />}
          />
          <dl className="text-muted-foreground grid grid-cols-3 gap-2 text-xs tabular-nums">
            {(
              [
                ["Aanvoer", current.supply.total, after?.supply.total],
                ["Afvoer", current.removal.total, after?.removal.total],
                ["Emissie", current.emission.total, after?.emission.total],
              ] as const
            ).map(([label, value, valueAfter]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="text-foreground">
                  {formatKg(value)}
                  {valueAfter !== undefined && (
                    <span data-after className="font-semibold">
                      {" "}
                      → {formatKg(valueAfter)}
                    </span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </>
      )}
    </ImpactBlock>
  )
}

/**
 * Lists, for each farm norm that a change adds to, how much room is left or by how much the norm
 * is exceeded. Shown near the save button; it never blocks saving.
 */
export function NormOutcomeList({ outcomes }: { outcomes: NormOutcome[] }) {
  if (outcomes.length === 0) return null
  const exceeded = outcomes.filter((outcome) => outcome.remaining < 0)
  const remaining = outcomes.filter((outcome) => outcome.remaining >= 0)
  return (
    <div className="space-y-1.5 text-sm" role="status">
      {exceeded.map((outcome) => (
        <p key={outcome.key} className="flex gap-2 text-red-700 dark:text-red-400">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          <span>
            Met deze gift wordt de gebruiksruimte voor{" "}
            {NORM_DESCRIPTIONS[outcome.key].label.toLocaleLowerCase("nl-NL")} met{" "}
            <strong className="tabular-nums">{formatKg(-outcome.remaining)} kg</strong>{" "}
            overschreden.
          </span>
        </p>
      ))}
      {remaining.map((outcome) => (
        <p key={outcome.key} className="text-muted-foreground flex gap-2">
          <CircleCheck
            className="mt-0.5 size-4 shrink-0 text-green-700 dark:text-green-400"
            aria-hidden="true"
          />
          <span>
            Na deze gift blijft er{" "}
            <span className="text-foreground tabular-nums">
              {formatKg(outcome.remaining)} {NORM_DESCRIPTIONS[outcome.key].unit}
            </span>{" "}
            {NORM_DESCRIPTIONS[outcome.key].label.toLocaleLowerCase("nl-NL")} over.
          </span>
        </p>
      ))}
    </div>
  )
}

/**
 * The three impact blocks (farm norms, advice and nitrogen balance) in one card, fed by
 * {@link ImpactState}. The advice and balance blocks can be relabelled, for example for a single
 * field instead of a selection.
 *
 * @param props.base - The base path of the farm and calendar, for the detail links.
 * @param props.normsField - Show the norms of this field (`b_id`) by default, with a switch to the
 *   norms of the whole farm. Without it, the norms of the whole farm are shown.
 */
export function ImpactSummaryCard({
  state,
  base,
  advice,
  balance,
  normsField,
}: {
  state: ImpactState
  base: string
  advice?: { title?: string; basis?: string; detailHref?: string; headerAction?: ReactNode }
  balance?: { title?: string; basis?: string; detailHref?: string }
  normsField?: string
}) {
  const { norms, normsAfter, farmNormsResult, adviceResult, balanceResult, preview } = state
  const [showFarm, setShowFarm] = useState(false)
  const switchId = useId()
  const fieldNorms = normsField ? norms?.selectedFields?.[normsField] : undefined
  const showField = Boolean(normsField) && !showFarm
  const fieldIssues = (normsAfter?.fieldIssues ?? norms?.fieldIssues ?? []).filter(
    (issue) => issue.b_id === normsField,
  )

  return (
    <Card>
      <CardContent className="@container/impact pt-6">
        {/* Stacked on narrow columns; side by side when the card is wide enough */}
        <div className="grid divide-y @5xl/impact:grid-cols-3 @5xl/impact:divide-x @5xl/impact:divide-y-0">
          <div className="py-6 first:pt-0 last:pb-0 @5xl/impact:px-6 @5xl/impact:py-0 @5xl/impact:first:pl-0 @5xl/impact:last:pr-0">
            <FarmNormsImpact
              detailHref={showField ? `${base}/norms/${normsField}` : `${base}/norms`}
              loading={!farmNormsResult}
              error={farmNormsResult?.status === "error" ? farmNormsResult.message : undefined}
              available={(norms?.available ?? false) && (!showField || Boolean(fieldNorms))}
              showRenure={norms?.showRenure ?? false}
              farmNorms={showField ? fieldNorms?.norms : norms?.farmNorms}
              current={showField ? fieldNorms?.fillings : norms?.farmFillings}
              after={
                showField && normsField ? normsAfter?.fieldsAfter[normsField] : normsAfter?.after
              }
              pending={preview.impactPending}
              counted={
                showField
                  ? fieldIssues.length > 0
                    ? 0
                    : 1
                  : (norms?.fieldCount ?? 0) -
                    (norms?.fieldIssues.filter((i) => !i.isWarning).length ?? 0)
              }
              total={showField ? 1 : (norms?.fieldCount ?? 0)}
              issues={
                showField ? fieldIssues : (normsAfter?.fieldIssues ?? norms?.fieldIssues ?? [])
              }
              title={showField ? "Gebruiksruimte perceel" : undefined}
              basis={showField ? "Dit perceel, in kg per ha" : undefined}
              perHectare={showField}
              headerAction={
                normsField ? (
                  <span className="flex items-center gap-1.5">
                    <Switch
                      id={switchId}
                      checked={showFarm}
                      onCheckedChange={setShowFarm}
                      className="scale-90"
                    />
                    <Label htmlFor={switchId} className="text-xs font-normal">
                      Hele bedrijf
                    </Label>
                  </span>
                ) : undefined
              }
            />
          </div>
          <div className="py-6 first:pt-0 last:pb-0 @5xl/impact:px-6 @5xl/impact:py-0 @5xl/impact:first:pl-0 @5xl/impact:last:pr-0">
            <AdviceImpact
              detailHref={advice?.detailHref ?? `${base}/nutrient_advice`}
              loading={!adviceResult}
              error={adviceResult?.status === "error" ? adviceResult.message : undefined}
              summary={state.adviceSummary}
              pending={preview.impactPending}
              issues={state.adviceIssues}
              title={advice?.title}
              basis={advice?.basis}
              headerAction={advice?.headerAction}
            />
          </div>
          <div className="py-6 first:pt-0 last:pb-0 @5xl/impact:px-6 @5xl/impact:py-0 @5xl/impact:first:pl-0 @5xl/impact:last:pr-0">
            <BalanceImpact
              detailHref={balance?.detailHref ?? `${base}/balance/nitrogen`}
              loading={!balanceResult}
              error={balanceResult?.status === "error" ? balanceResult.message : undefined}
              summary={state.balanceSummary}
              pending={preview.balancePending}
              issues={state.balanceIssues}
              title={balance?.title}
              basis={balance?.basis}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
