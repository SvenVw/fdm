import type { MineralizationKpis, MineralizationScenario } from "@nmi-agro/fdm-calculator"
import { Plus, Trash2 } from "lucide-react"
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
import { formatKgN, type ScenarioFertilizerOption } from "~/lib/mineralization"
import { cn } from "~/lib/utils"

/** Change to a scenario. */
export type ScenarioAction =
  | {
      type: "update_application"
      index: number
      patch: Partial<MineralizationScenario["fertilizerApplications"][number]>
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

function Delta({ label, value }: { label: string; value: number | null }) {
  const rounded = value === null ? null : Math.round(value)
  return (
    <div>
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="font-semibold tabular-nums">
        {rounded === null ? "–" : `${rounded > 0 ? "+" : ""}${formatKgN(rounded)}`}
      </dd>
    </div>
  )
}

/**
 * Edits a what-if scenario of fertilizer applications and the harvest, shows its effect and lets
 * the user save it to the fertilization plan or discard it.
 */
export function ScenarioPanel({
  scenario,
  dispatch,
  year,
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
}: {
  scenario: MineralizationScenario
  dispatch: (action: ScenarioAction) => void
  year: number
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
}) {
  const optionById = new Map(fertilizerOptions.map((o) => [o.p_id, o]))
  const min = `${year}-01-01`
  const max = `${year}-12-31`

  return (
    <Card>
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
            const id = `scenario-app-${index}`
            return (
              <div
                key={app.p_app_id ?? `new-${index}`}
                className="grid gap-2 rounded-lg border p-3 sm:grid-cols-2 lg:grid-cols-[9rem_minmax(0,1fr)_9rem_minmax(0,1fr)_auto] lg:items-end"
              >
                <div className="grid gap-1">
                  <Label htmlFor={`${id}-date`} className="text-xs">
                    Datum
                  </Label>
                  <Input
                    id={`${id}-date`}
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
                  <Label htmlFor={`${id}-product`} className="text-xs">
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
                    <SelectTrigger id={`${id}-product`} className="w-full">
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
                  <Label htmlFor={`${id}-amount`} className="text-xs">
                    Hoeveelheid ({option?.p_app_amount_unit ?? "kg/ha"})
                  </Label>
                  <Input
                    id={`${id}-amount`}
                    type="number"
                    min={0}
                    step="any"
                    inputMode="decimal"
                    value={
                      Number.isFinite(app.p_app_amount_display) ? app.p_app_amount_display : ""
                    }
                    onChange={(e) =>
                      dispatch({
                        type: "update_application",
                        index,
                        patch: { p_app_amount_display: Math.max(0, Number(e.target.value) || 0) },
                      })
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <Label htmlFor={`${id}-method`} className="text-xs">
                    Toediening
                  </Label>
                  <Select
                    value={app.p_app_method}
                    onValueChange={(p_app_method) =>
                      dispatch({ type: "update_application", index, patch: { p_app_method } })
                    }
                  >
                    <SelectTrigger id={`${id}-method`} className="w-full">
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
                  className="justify-self-end"
                  aria-label="Gift verwijderen"
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
                date: `${year}-04-01`,
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
                Verwachte opbrengst (kg DS/ha)
              </Label>
              <Input
                id="scenario-harvest-yield"
                type="number"
                min={0}
                step={100}
                inputMode="numeric"
                value={scenario.harvest.b_lu_yield ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "update_harvest",
                    patch: {
                      b_lu_yield:
                        e.target.value === "" ? undefined : Math.max(0, Number(e.target.value)),
                    },
                  })
                }
              />
            </div>
          </fieldset>
        ) : null}

        <div
          className={cn("space-y-3 border-t pt-4", !dirty && "text-muted-foreground")}
          aria-live="polite"
        >
          {!dirty ? (
            <p className="text-sm">Pas een gift of de oogst aan om het effect te zien.</p>
          ) : pending ? (
            <p className="flex items-center gap-2 text-sm">
              <Spinner /> Scenario wordt berekend…
            </p>
          ) : error ? (
            <p className="text-destructive text-sm">{error}</p>
          ) : result ? (
            <dl className="grid grid-cols-3 gap-4">
              <Delta
                label="Beschikbaar bij oogst"
                value={
                  result.residualNAtHarvest !== null && current.residualNAtHarvest !== null
                    ? result.residualNAtHarvest - current.residualNAtHarvest
                    : null
                }
              />
              <Delta label="N-opname" value={result.totalUptake - current.totalUptake} />
              <Delta label="Uitspoeling" value={result.totalLeaching - current.totalLeaching} />
            </dl>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={!dirty || pending || !!error || !result || saving}
            >
              {saving ? <Spinner /> : null}
              Opslaan in bemestingsplan
            </Button>
            <Button type="button" variant="ghost" onClick={onDiscard} disabled={!dirty || saving}>
              Verwerpen
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
