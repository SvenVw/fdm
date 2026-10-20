import type { MineralizationKpis, MineralizationScenario } from "@nmi-agro/fdm-calculator"
import { CircleAlert, Plus, Trash2 } from "lucide-react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select"
import { Spinner } from "~/components/ui/spinner"
import {
  formatKgN,
  formatNumber,
  formatShortDate,
  type ScenarioFertilizerOption,
} from "~/lib/mineralization"
import { cn } from "~/lib/utils"

type ScenarioApplication = MineralizationScenario["fertilizerApplications"][number]

/** Change to a scenario. */
export type ScenarioAction =
  | {
      type: "update_application"
      index: number
      patch: Partial<ScenarioApplication>
    }
  | { type: "add_application"; date: string; option: ScenarioFertilizerOption | undefined }
  | { type: "remove_application"; index: number }
  | { type: "update_harvest"; patch: Partial<NonNullable<MineralizationScenario["harvest"]>> }
  | { type: "shift"; eventType: "fertilizer" | "harvest"; p_app_id?: string; newDate: string }

/** Applies a change to a scenario. */
export function scenarioReducer(
  state: MineralizationScenario,
  action: ScenarioAction,
): MineralizationScenario {
  switch (action.type) {
    case "update_application":
      return {
        ...state,
        fertilizerApplications: state.fertilizerApplications.map((app, i) =>
          i === action.index ? { ...app, ...action.patch } : app,
        ),
      }
    case "add_application":
      if (!action.option) return state
      return {
        ...state,
        fertilizerApplications: [
          ...state.fertilizerApplications,
          {
            p_id: action.option.p_id,
            p_app_amount_display: 0,
            p_app_method: action.option.p_app_method_options[0] ?? "broadcasting",
            p_app_date: action.date,
          },
        ],
      }
    case "remove_application":
      return {
        ...state,
        fertilizerApplications: state.fertilizerApplications.filter((_, i) => i !== action.index),
      }
    case "update_harvest":
      if (!state.harvest) return state
      return { ...state, harvest: { ...state.harvest, ...action.patch } }
    case "shift":
      if (action.eventType === "harvest") {
        return state.harvest
          ? { ...state, harvest: { ...state.harvest, b_date_harvest: action.newDate } }
          : state
      }
      return {
        ...state,
        fertilizerApplications: state.fertilizerApplications.map((app) =>
          app.p_app_id === action.p_app_id ? { ...app, p_app_date: action.newDate } : app,
        ),
      }
  }
}

/** How an application of the scenario differs from the plan. */
export type ApplicationChange = "new" | "changed" | null

/** Compares an application of the scenario with the same application in the plan. */
export function getApplicationChange(
  app: ScenarioApplication,
  base: MineralizationScenario,
): ApplicationChange {
  if (!app.p_app_id) return "new"
  const original = base.fertilizerApplications.find((a) => a.p_app_id === app.p_app_id)
  if (!original) return "new"
  return original.p_app_date !== app.p_app_date ||
    original.p_id !== app.p_id ||
    original.p_app_amount_display !== app.p_app_amount_display ||
    original.p_app_method !== app.p_app_method
    ? "changed"
    : null
}

/**
 * Lists in Dutch what saving the scenario changes in the fertilization plan, e.g.
 * "Verschoven: KAS van 3 apr naar 10 apr".
 */
export function describeScenarioChanges(
  base: MineralizationScenario,
  scenario: MineralizationScenario,
  fertilizerOptions: ScenarioFertilizerOption[],
): string[] {
  const optionById = new Map(fertilizerOptions.map((o) => [o.p_id, o]))
  const name = (p_id: string) => optionById.get(p_id)?.p_name_nl ?? "Meststof"
  const amount = (app: ScenarioApplication) =>
    `${formatNumber(app.p_app_amount_display, 1)} ${optionById.get(app.p_id)?.p_app_amount_unit ?? "kg/ha"}`
  const changes: string[] = []

  for (const original of base.fertilizerApplications) {
    const app = scenario.fertilizerApplications.find((a) => a.p_app_id === original.p_app_id)
    if (!app) {
      changes.push(`Verwijderd: ${name(original.p_id)} van ${formatShortDate(original.p_app_date)}`)
      continue
    }
    if (app.p_app_date !== original.p_app_date) {
      changes.push(
        `Verschoven: ${name(app.p_id)} van ${formatShortDate(original.p_app_date)} naar ${formatShortDate(app.p_app_date)}`,
      )
    }
    if (app.p_id !== original.p_id) {
      changes.push(`Andere meststof: ${name(original.p_id)} wordt ${name(app.p_id)}`)
    }
    if (app.p_app_amount_display !== original.p_app_amount_display) {
      changes.push(`Hoeveelheid ${name(app.p_id)}: ${amount(original)} wordt ${amount(app)}`)
    }
    if (app.p_app_method !== original.p_app_method && app.p_id === original.p_id) {
      changes.push(`Andere toediening: ${name(app.p_id)}`)
    }
  }
  for (const app of scenario.fertilizerApplications) {
    if (getApplicationChange(app, base) === "new") {
      changes.push(`Nieuw: ${name(app.p_id)}, ${amount(app)} op ${formatShortDate(app.p_app_date)}`)
    }
  }
  if (base.harvest && scenario.harvest) {
    if (base.harvest.b_date_harvest !== scenario.harvest.b_date_harvest) {
      changes.push(
        `Oogst verschoven van ${formatShortDate(base.harvest.b_date_harvest)} naar ${formatShortDate(scenario.harvest.b_date_harvest)}`,
      )
    }
    if (base.harvest.b_lu_yield !== scenario.harvest.b_lu_yield) {
      changes.push(
        scenario.harvest.b_lu_yield === undefined
          ? "Opbrengst verwijderd"
          : `Opbrengst wordt ${formatNumber(scenario.harvest.b_lu_yield)} kg DS/ha`,
      )
    }
  }
  return changes
}

/** Whether the scenario changes which fertilizer, or how much of it, is applied. */
function changesFertilization(base: MineralizationScenario, scenario: MineralizationScenario) {
  const key = (apps: ScenarioApplication[]) =>
    apps
      .map((a) => JSON.stringify([a.p_app_id ?? "", a.p_id, a.p_app_amount_display]))
      .sort((x, y) => x.localeCompare(y))
      .join("|")
  return key(base.fertilizerApplications) !== key(scenario.fertilizerApplications)
}

/** Effect of a scenario on the key figures, relative to the plan. */
export function getScenarioDeltas(current: MineralizationKpis, result: MineralizationKpis) {
  return {
    residualNAtHarvest:
      result.residualNAtHarvest !== null && current.residualNAtHarvest !== null
        ? result.residualNAtHarvest - current.residualNAtHarvest
        : null,
    totalUptake: result.totalUptake - current.totalUptake,
    totalLeaching: result.totalLeaching - current.totalLeaching,
  }
}

function formatDelta(value: number | null): string {
  const rounded = value === null ? null : Math.round(value)
  if (rounded === null) return "–"
  return `${rounded > 0 ? "+" : ""}${formatKgN(rounded)}`
}

/** The effect of a scenario as three compact figures. */
export function ScenarioDeltas({
  current,
  result,
  className,
}: {
  current: MineralizationKpis
  result: MineralizationKpis
  className?: string
}) {
  const deltas = getScenarioDeltas(current, result)
  const items = [
    { label: "Beschikbaar bij oogst", value: deltas.residualNAtHarvest },
    { label: "N-opname", value: deltas.totalUptake },
    { label: "Uitspoeling", value: deltas.totalLeaching },
  ]
  return (
    <dl className={cn("grid grid-cols-3 gap-4", className)}>
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-muted-foreground text-xs">{item.label}</dt>
          <dd className="font-semibold tabular-nums">{formatDelta(item.value)}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Edits a what-if scenario of fertilizer applications and the harvest, shows its effect and what
 * saving changes in the fertilization plan, and lets the user save or discard it.
 */
export function ScenarioPanel({
  id,
  base,
  scenario,
  dispatch,
  year,
  newApplicationDate,
  fertilizerOptions,
  methodLabels,
  dirty,
  pending,
  error,
  current,
  result,
  saving,
  onSave,
  onDiscard,
  onRetry,
}: {
  id?: string
  /** The current plan, to show what the scenario changes. */
  base: MineralizationScenario
  scenario: MineralizationScenario
  dispatch: (action: ScenarioAction) => void
  year: number
  /** Date of a newly added application. */
  newApplicationDate: string
  fertilizerOptions: ScenarioFertilizerOption[]
  methodLabels: Record<string, string>
  dirty: boolean
  pending: boolean
  error: string | null
  current: MineralizationKpis
  result: MineralizationKpis | null
  saving: boolean
  onSave: () => void
  onDiscard: () => void
  onRetry: () => void
}) {
  const optionById = new Map(fertilizerOptions.map((o) => [o.p_id, o]))
  const min = `${year}-01-01`
  const max = `${year}-12-31`
  // Only applications the user added or changed are checked; the plan itself is left as it is
  const missingAmount = scenario.fertilizerApplications.some(
    (app) => getApplicationChange(app, base) !== null && !(app.p_app_amount_display > 0),
  )
  const changes = dirty ? describeScenarioChanges(base, scenario, fertilizerOptions) : []
  const deltas = result ? getScenarioDeltas(current, result) : null
  const noEffect =
    deltas !== null &&
    changesFertilization(base, scenario) &&
    Math.abs(deltas.totalUptake) < 1 &&
    Math.abs(deltas.totalLeaching) < 1 &&
    Math.abs(deltas.residualNAtHarvest ?? 0) < 1

  return (
    <Card id={id} tabIndex={-1} className="scroll-mt-4 focus-visible:outline-none">
      <CardHeader>
        <CardTitle>Scenario: wat als…</CardTitle>
        <CardDescription>
          Verschuif of wijzig bemestingen en de oogst en zie direct het effect in de grafiek
          (gestippeld). Je bemestingsplan verandert pas als je het scenario opslaat.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <fieldset className="space-y-3">
          <legend className="mb-2 text-sm font-semibold">Bemestingen in {year}</legend>
          {scenario.fertilizerApplications.length === 0 ? (
            <p className="text-muted-foreground text-sm">Geen bemestingen in dit scenario.</p>
          ) : null}
          {scenario.fertilizerApplications.map((app, index) => {
            const option = optionById.get(app.p_id)
            const methods =
              option && option.p_app_method_options.length > 0
                ? option.p_app_method_options
                : Object.keys(methodLabels)
            const rowId = `scenario-app-${index}`
            const change = getApplicationChange(app, base)
            const amountMissing = change !== null && !(app.p_app_amount_display > 0)
            return (
              <div
                key={app.p_app_id ?? `new-${index}`}
                className={cn(
                  "grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[9rem_minmax(0,1fr)_9rem_minmax(0,1fr)_auto] lg:items-start",
                  change !== null && "border-foreground/30 bg-muted/40",
                )}
              >
                <div className="grid gap-1">
                  <Label htmlFor={`${rowId}-date`} className="text-xs">
                    Datum
                    {change ? (
                      <Badge variant="outline" className="ml-1 px-1.5 py-0 text-xs font-normal">
                        {change === "new" ? "Nieuw" : "Gewijzigd"}
                      </Badge>
                    ) : null}
                  </Label>
                  <Input
                    id={`${rowId}-date`}
                    type="date"
                    min={min}
                    max={max}
                    value={app.p_app_date}
                    onChange={(e) =>
                      e.target.value &&
                      dispatch({
                        type: "update_application",
                        index,
                        patch: { p_app_date: e.target.value },
                      })
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${rowId}-product`} className="text-xs">
                    Meststof
                  </Label>
                  <Select
                    value={app.p_id}
                    onValueChange={(p_id) => {
                      const next = optionById.get(p_id)
                      dispatch({
                        type: "update_application",
                        index,
                        patch: {
                          p_id,
                          ...(next &&
                          next.p_app_method_options.length > 0 &&
                          !next.p_app_method_options.includes(app.p_app_method)
                            ? { p_app_method: next.p_app_method_options[0] }
                            : {}),
                        },
                      })
                    }}
                  >
                    <SelectTrigger id={`${rowId}-product`} className="w-full">
                      <SelectValue placeholder="Kies een meststof" />
                    </SelectTrigger>
                    <SelectContent>
                      {fertilizerOptions.map((o) => (
                        <SelectItem key={o.p_id} value={o.p_id}>
                          {o.p_name_nl ?? o.p_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${rowId}-amount`} className="text-xs">
                    Hoeveelheid ({option?.p_app_amount_unit ?? "kg/ha"})
                  </Label>
                  <Input
                    id={`${rowId}-amount`}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    aria-invalid={amountMissing || undefined}
                    aria-describedby={amountMissing ? `${rowId}-amount-error` : undefined}
                    value={
                      Number.isFinite(app.p_app_amount_display) &&
                      (app.p_app_amount_display > 0 || change === null)
                        ? app.p_app_amount_display
                        : ""
                    }
                    placeholder="0"
                    onChange={(e) =>
                      dispatch({
                        type: "update_application",
                        index,
                        patch: { p_app_amount_display: Math.max(0, Number(e.target.value) || 0) },
                      })
                    }
                  />
                  {amountMissing ? (
                    <p id={`${rowId}-amount-error`} className="text-destructive text-xs">
                      Vul een hoeveelheid in.
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${rowId}-method`} className="text-xs">
                    Toediening
                  </Label>
                  <Select
                    value={app.p_app_method}
                    onValueChange={(p_app_method) =>
                      dispatch({ type: "update_application", index, patch: { p_app_method } })
                    }
                  >
                    <SelectTrigger id={`${rowId}-method`} className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((method) => (
                        <SelectItem key={method} value={method}>
                          {methodLabels[method] ?? method}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="justify-self-end lg:mt-5"
                  aria-label={`Gift van ${formatShortDate(app.p_app_date)} verwijderen`}
                  onClick={() => dispatch({ type: "remove_application", index })}
                >
                  <Trash2 aria-hidden />
                </Button>
              </div>
            )
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={fertilizerOptions.length === 0}
            onClick={() =>
              dispatch({
                type: "add_application",
                date: newApplicationDate,
                option: fertilizerOptions[0],
              })
            }
          >
            <Plus aria-hidden />
            Gift toevoegen
          </Button>
        </fieldset>

        {scenario.harvest ? (
          <fieldset className="grid gap-2 sm:grid-cols-2 lg:max-w-xl">
            <legend className="mb-2 text-sm font-semibold">Oogst hoofdteelt</legend>
            <div className="grid gap-1">
              <Label htmlFor="scenario-harvest-date" className="text-xs">
                Oogstdatum
              </Label>
              <Input
                id="scenario-harvest-date"
                type="date"
                min={min}
                max={max}
                value={scenario.harvest.b_date_harvest}
                onChange={(e) =>
                  e.target.value &&
                  dispatch({ type: "update_harvest", patch: { b_date_harvest: e.target.value } })
                }
              />
            </div>
            <div className="grid gap-1">
              <Label htmlFor="scenario-harvest-yield" className="text-xs">
                Opbrengst (kg DS/ha)
              </Label>
              <Input
                id="scenario-harvest-yield"
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={scenario.harvest.b_lu_yield ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "update_harvest",
                    patch: {
                      b_lu_yield:
                        e.target.value === ""
                          ? undefined
                          : Math.max(0, Number(e.target.value) || 0),
                    },
                  })
                }
              />
            </div>
          </fieldset>
        ) : null}

        <div
          className={cn("space-y-4 border-t pt-4", !dirty && "text-muted-foreground")}
          aria-live="polite"
        >
          {!dirty ? (
            <p className="text-sm">Pas een gift of de oogst aan om het effect te zien.</p>
          ) : pending ? (
            <p className="flex items-center gap-2 text-sm">
              <Spinner /> Scenario wordt berekend…
            </p>
          ) : error ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <p className="text-destructive flex items-center gap-1.5">
                <CircleAlert className="size-4 shrink-0" aria-hidden />
                {error}
              </p>
              <Button type="button" variant="outline" size="sm" onClick={onRetry}>
                Opnieuw berekenen
              </Button>
            </div>
          ) : result ? (
            <ScenarioDeltas current={current} result={result} />
          ) : null}

          {noEffect ? (
            <p className="bg-muted/60 flex gap-2 rounded-md p-3 text-sm">
              <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
              De berekening laat vrijwel geen verschil zien, terwijl je de bemesting hebt gewijzigd.
              Controleer het stikstofgehalte van de meststof voordat je opslaat.
            </p>
          ) : null}

          {changes.length > 0 ? (
            <div className="space-y-1.5">
              <p className="text-sm font-medium">Dit verandert in je bemestingsplan:</p>
              <ul className="text-muted-foreground list-disc space-y-0.5 pl-5 text-sm">
                {changes.map((change) => (
                  <li key={change}>{change}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={!dirty || pending || !!error || !result || saving || missingAmount}
            >
              {saving ? <Spinner /> : null}
              Opslaan in bemestingsplan
            </Button>
            <Button type="button" variant="ghost" onClick={onDiscard} disabled={!dirty || saving}>
              Verwerpen
            </Button>
            {dirty && missingAmount ? (
              <p className="text-muted-foreground text-xs">
                Vul eerst bij elke gift een hoeveelheid in.
              </p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
