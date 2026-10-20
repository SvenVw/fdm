import {
  DYNA_V2_SOIL_PARAMETERS,
  getMineralizationScenarioSchema,
  type MineralizationScenario,
  type SeasonPhase,
} from "@nmi-agro/fdm-calculator"
import {
  addHarvest,
  getFertilizerParametersDescription,
  getSoilParametersDescription,
  startOfDayInFdmTimeZone,
  toFdmDateString,
} from "@nmi-agro/fdm-core"
import { CircleAlert, CircleCheck, Info, MapPinOff } from "lucide-react"
import { Suspense, use, useEffect, useRef, useState } from "react"
import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
  useFetcher,
  useLoaderData,
  useRevalidator,
  useSearchParams,
} from "react-router"
import { dataWithSuccess } from "remix-toast"
import { z } from "zod"
import {
  ChartExplainer,
  EvaluationCard,
  KeyFigures,
  NitrogenBalanceCard,
} from "~/components/blocks/mineralization/field-cards"
import { MissingHarvestCard } from "~/components/blocks/mineralization/missing-harvest-card"
import { NitrogenChart } from "~/components/blocks/mineralization/nitrogen-chart"
import { PhaseSelector } from "~/components/blocks/mineralization/phase-selector"
import {
  type ScenarioAction,
  ScenarioPanel,
  scenarioReducer,
} from "~/components/blocks/mineralization/scenario-panel"
import { SignalChips } from "~/components/blocks/mineralization/signal-chips"
import { FieldMineralizationSkeleton } from "~/components/blocks/mineralization/skeletons"
import { type SoilParameterLabels, UsedInput } from "~/components/blocks/mineralization/used-input"
import { WeatherStrip } from "~/components/blocks/mineralization/weather-strip"
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "~/components/ui/empty"
import { useAnalytics } from "~/hooks/use-analytics"
import {
  calculateFieldMineralization,
  getMineralizationYear,
  loadFarmMineralizationContext,
  saveScenario,
} from "~/integrations/mineralization.server"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError, reportError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import {
  type FieldMineralizationOk,
  type FieldMineralizationOutcome,
  getAttentionItems,
  getNotCalculatedReason,
} from "~/lib/mineralization"

export { shouldRevalidateMineralization as shouldRevalidate } from "~/lib/mineralization"

export const meta: MetaFunction = () => {
  return [
    { title: `Mineralisatie | Perceel | ${clientConfig.name}` },
    {
      name: "description",
      content:
        "Stikstofaanbod, opname door het gewas, beschikbare stikstof en uitspoeling door het seizoen heen.",
    },
  ]
}

/**
 * Streams the mineralization outcome of the field; nothing slow is awaited.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const b_id_farm = params.b_id_farm
    const b_id = params.b_id
    if (!b_id_farm) {
      throw data("invalid: b_id_farm", { status: 400, statusText: "invalid: b_id_farm" })
    }
    if (!b_id) {
      throw data("invalid: b_id", { status: 400, statusText: "invalid: b_id" })
    }
    const session = await getSession(request)
    const year = getMineralizationYear(params.calendar)
    const today = toFdmDateString(new Date())

    const outcome = loadFarmMineralizationContext({
      principal_id: session.principal_id,
      b_id_farm,
      year,
    })
      .then((ctx) => calculateFieldMineralization(ctx, b_id, session.principal_id, b_id_farm))
      .catch((error: unknown): FieldMineralizationOutcome => {
        reportError(error, { page: "mineralization", scope: "field" })
        return {
          b_id,
          b_name: null,
          b_area: null,
          status: "error",
          message: "De gegevens van dit perceel konden niet worden geladen.",
        }
      })

    const soilLabels: SoilParameterLabels = {}
    for (const description of getSoilParametersDescription()) {
      if (DYNA_V2_SOIL_PARAMETERS.includes(description.parameter)) {
        soilLabels[description.parameter] = {
          name: description.description ?? description.name,
          unit: description.unit,
        }
      }
    }

    const methodLabels: Record<string, string> = {}
    const methodDescription = getFertilizerParametersDescription().find(
      (x: { parameter: string }) => x.parameter === "p_app_method_options",
    )
    for (const option of methodDescription?.options ?? []) {
      if (option.value !== null) methodLabels[String(option.value)] = option.label
    }

    return {
      b_id_farm,
      b_id,
      calendar: params.calendar ?? String(year),
      methodLabels,
      year,
      today,
      isCurrentYear: Number(today.slice(0, 4)) === year,
      soilLabels,
      outcome,
    }
  } catch (error) {
    const normalized = handleLoaderError(error)
    throw normalized ?? error
  }
}

const harvestFormSchema = z.object({
  b_lu: z.string().min(1),
  b_lu_harvest_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  b_lu_yield: z.preprocess(
    (v) => (v === "" || v === null ? undefined : v),
    z.coerce.number().min(0).optional(),
  ),
})

/**
 * Saves a measured or planned harvest of the main cultivation.
 */
export async function action({ request, params }: ActionFunctionArgs) {
  try {
    if (!params.b_id) {
      throw data("invalid: b_id", { status: 400, statusText: "invalid: b_id" })
    }
    const session = await getSession(request)
    const formData = await request.formData()
    const intent = formData.get("intent")

    if (intent === "save_harvest") {
      const parsed = harvestFormSchema.safeParse(Object.fromEntries(formData))
      if (!parsed.success) {
        throw data("Ongeldige oogstgegevens", { status: 400 })
      }
      const [y, m, d] = parsed.data.b_lu_harvest_date.split("-").map(Number)
      await addHarvest(
        fdm,
        session.principal_id,
        parsed.data.b_lu,
        startOfDayInFdmTimeZone(y, m, d),
        parsed.data.b_lu_yield !== undefined ? { b_lu_yield: parsed.data.b_lu_yield } : undefined,
      )
      return dataWithSuccess(
        { result: "ok" },
        { message: "Oogst opgeslagen. De mineralisatie wordt opnieuw berekend." },
      )
    }

    if (intent === "save_scenario") {
      const b_id_farm = params.b_id_farm
      if (!b_id_farm) {
        throw data("invalid: b_id_farm", { status: 400, statusText: "invalid: b_id_farm" })
      }
      const year = getMineralizationYear(params.calendar)
      const schema = getMineralizationScenarioSchema(year)
      const parseField = (name: string) => {
        try {
          const value = formData.get(name)
          return schema.safeParse(JSON.parse(typeof value === "string" ? value : ""))
        } catch {
          return null
        }
      }
      const parsed = parseField("scenario")
      const parsedBase = parseField("base")
      if (!parsed?.success || !parsedBase?.success) {
        throw data("Ongeldig scenario", { status: 400 })
      }
      await saveScenario({
        principal_id: session.principal_id,
        b_id_farm,
        b_id: params.b_id,
        year,
        scenario: parsed.data,
        base: parsedBase.data,
      })
      return dataWithSuccess(
        { result: "ok" },
        { message: "Scenario opgeslagen in het bemestingsplan." },
      )
    }

    throw data("Ongeldige actie", { status: 400 })
  } catch (error) {
    return handleActionError(error)
  }
}

export default function MineralizationFieldPage() {
  const loaderData = useLoaderData<typeof loader>()
  return (
    <Suspense fallback={<FieldMineralizationSkeleton />}>
      <FieldMineralization {...loaderData} />
    </Suspense>
  )
}

type LoaderData = ReturnType<typeof useLoaderData<typeof loader>>

function FieldMineralization(props: LoaderData) {
  const outcome = use(props.outcome)
  const revalidator = useRevalidator()
  const { capture } = useAnalytics()

  useEffect(() => {
    capture("mineralization_viewed", {
      b_id_farm: props.b_id_farm,
      year: props.year,
      page: "field",
      status: outcome.status,
    })
  }, [capture, props.b_id_farm, props.year, outcome.status])

  switch (outcome.status) {
    case "excluded":
    case "missing_location":
    case "no_cultivation":
      return (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <MapPinOff />
            </EmptyMedia>
            <EmptyTitle>Niet berekend: {getNotCalculatedReason(outcome, props.year)}</EmptyTitle>
            <EmptyDescription>
              {outcome.status === "excluded"
                ? "Voor bufferstroken, natuur en landschapselementen wordt de mineralisatie niet berekend."
                : outcome.status === "no_cultivation"
                  ? "Voeg een teelt toe aan dit perceel om de mineralisatie te berekenen."
                  : "Dit perceel heeft geen geldige ligging; teken het perceel opnieuw in."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )
    case "missing_harvest":
      return (
        <MissingHarvestCard
          mainCultivation={outcome.mainCultivation}
          defaultHarvestDate={outcome.defaultHarvestDate}
          year={props.year}
        />
      )
    case "error":
      return (
        <Alert variant="destructive" className="max-w-2xl">
          <CircleAlert aria-hidden />
          <AlertTitle>De berekening is niet gelukt</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{outcome.message}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => revalidator.revalidate()}
              disabled={revalidator.state !== "idle"}
            >
              Opnieuw proberen
            </Button>
          </AlertDescription>
        </Alert>
      )
    case "ok": {
      const base = getScenarioBase(outcome)
      return (
        <FieldMineralizationResult
          key={JSON.stringify(base)}
          {...props}
          outcome={outcome}
          base={base}
        />
      )
    }
  }
}

/** The current fertilization plan and harvest of the year, as the starting point of a scenario. */
function getScenarioBase(outcome: FieldMineralizationOk): MineralizationScenario {
  const mainHarvest = outcome.usedInput.harvests
    .filter((h) => h.b_lu === outcome.mainCultivation.b_lu)
    .at(-1)
  return {
    fertilizerApplications: outcome.usedInput.fertilizerApplications.map((a) => ({
      p_app_id: a.p_app_id,
      p_id: a.p_id,
      p_app_amount_display: a.amount ?? 0,
      p_app_method: a.method ?? "broadcasting",
      p_app_date: a.date,
    })),
    ...(mainHarvest
      ? {
          harvest: {
            b_date_harvest: mainHarvest.date,
            ...(mainHarvest.b_lu_yield !== null ? { b_lu_yield: mainHarvest.b_lu_yield } : {}),
          },
        }
      : {}),
  }
}

const SCENARIO_DEBOUNCE_MS = 600

function isPhase(value: string | null): value is SeasonPhase {
  return value === "planning" || value === "growing" || value === "evaluation"
}

function FieldMineralizationResult(
  props: Omit<LoaderData, "outcome"> & {
    outcome: FieldMineralizationOk
    base: MineralizationScenario
  },
) {
  const { outcome, base, year, today, isCurrentYear } = props
  const { capture } = useAnalytics()

  // What-if scenario: edited locally, calculated through the scenario resource route
  const [scenario, setScenario] = useState(base)
  const scenarioFetcher = useFetcher<{ key: string; outcome: FieldMineralizationOutcome }>()
  const saveFetcher = useFetcher()
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )
  const scenarioUrl = `/farm/${props.b_id_farm}/${props.calendar}/mineralization/${props.b_id}/scenario`
  const dirty = JSON.stringify(scenario) !== JSON.stringify(base)
  const dispatch = (action: ScenarioAction) => {
    const next = scenarioReducer(scenario, action)
    setScenario(next)
    if (timer.current) clearTimeout(timer.current)
    if (JSON.stringify(next) === JSON.stringify(base)) return
    timer.current = setTimeout(() => {
      void scenarioFetcher.load(
        `${scenarioUrl}?scenario=${encodeURIComponent(JSON.stringify(next))}`,
      )
    }, SCENARIO_DEBOUNCE_MS)
    capture("mineralization_scenario_changed", { action: action.type })
  }
  // A result only counts when it was calculated for exactly the scenario on screen
  const scenarioKey = JSON.stringify(scenario)
  const scenarioOutcome =
    dirty && scenarioFetcher.state === "idle" && scenarioFetcher.data?.key === scenarioKey
      ? scenarioFetcher.data.outcome
      : undefined
  const scenarioOk = scenarioOutcome?.status === "ok" ? scenarioOutcome : null
  const scenarioError = scenarioOutcome?.status === "error" ? scenarioOutcome.message : null
  const scenarioPending = dirty && !scenarioOutcome
  const saving = saveFetcher.state !== "idle"
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get("phase")
  const phase: SeasonPhase = isPhase(requested) ? requested : outcome.insights.defaultPhase

  const rainEventDates = outcome.insights.signals.flatMap((s) =>
    s.type === "rain_near_event" ? [s.eventDate] : [],
  )
  const attention = getAttentionItems(outcome)
  const fieldHref = `/farm/${props.b_id_farm}/${props.calendar}/field/${props.b_id}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PhaseSelector
          value={phase}
          defaultPhase={outcome.insights.defaultPhase}
          onChange={(next) =>
            setSearchParams(
              (prev) => {
                prev.set("phase", next)
                return prev
              },
              { replace: true, preventScrollReset: true },
            )
          }
        />
        <Button asChild variant="link" size="sm" className="text-muted-foreground">
          <a href="#gebruikte-gegevens">Welke gegevens zijn gebruikt?</a>
        </Button>
      </div>

      {outcome.partial ? (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Alleen de hoofdteelt is meegerekend</AlertTitle>
          <AlertDescription>
            De groenbemester of het vanggewas na de hoofdteelt kon nog niet worden meegenomen in de
            berekening. Het verloop na de oogst is daardoor minder nauwkeurig.
          </AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="space-y-4">
          <div className="space-y-1.5">
            <CardTitle>Stikstof door het seizoen</CardTitle>
            <CardDescription>
              {outcome.mainCultivation.b_lu_name ?? outcome.mainCultivation.b_lu_catalogue}, {year}
            </CardDescription>
          </div>
          <KeyFigures insights={outcome.insights} phase={phase} isCurrentYear={isCurrentYear} />
          <SignalChips items={attention} />
        </CardHeader>
        <CardContent className="space-y-2">
          <NitrogenChart
            series={outcome.result.series}
            scenarioSeries={scenarioOk && !scenarioPending ? scenarioOk.result.series : undefined}
            events={outcome.events}
            year={year}
            today={today}
            phase={phase}
            forecastDays={outcome.forecast?.days}
            rainEventDates={rainEventDates}
          />
          <ChartExplainer />
        </CardContent>
      </Card>

      {outcome.forecast && outcome.forecast.days.length > 0 ? (
        <WeatherStrip
          forecast={outcome.forecast}
          signals={outcome.insights.signals}
          canSuggestShift={(signal) =>
            signal.eventType === "fertilizer"
              ? scenario.fertilizerApplications.some((a) => a.p_app_id === signal.p_app_id)
              : signal.b_lu === outcome.mainCultivation.b_lu &&
                signal.eventDate === base.harvest?.b_date_harvest
          }
          onSuggestShift={(suggestion) =>
            dispatch({
              type: "shift",
              eventType: suggestion.eventType,
              p_app_id: suggestion.p_app_id,
              newDate: suggestion.newDate,
            })
          }
        />
      ) : null}

      {phase !== "evaluation" ? (
        <ScenarioPanel
          scenario={scenario}
          dispatch={dispatch}
          year={year}
          fertilizerOptions={outcome.fertilizerOptions}
          methodLabels={props.methodLabels}
          dirty={dirty}
          pending={scenarioPending}
          error={scenarioError}
          current={outcome.insights.kpis}
          result={scenarioOk?.insights.kpis ?? null}
          saving={saving}
          onSave={() => {
            capture("mineralization_scenario_saved", { b_id_farm: props.b_id_farm, year })
            void saveFetcher.submit(
              {
                intent: "save_scenario",
                scenario: JSON.stringify(scenario),
                base: JSON.stringify(base),
              },
              { method: "post" },
            )
          }}
          onDiscard={() => {
            if (timer.current) clearTimeout(timer.current)
            setScenario(base)
          }}
        />
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <NitrogenBalanceCard balance={outcome.result.balance} />
        {phase === "evaluation" ? (
          <EvaluationCard insights={outcome.insights} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Aandachtspunten</CardTitle>
              <CardDescription>
                {phase === "planning"
                  ? "Wat de berekening van je bemestingsplan laat zien."
                  : "Wat er de komende tijd aandacht vraagt."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {attention.length > 0 ? (
                <SignalChips items={attention} className="flex-col items-start" />
              ) : (
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <CircleCheck className="size-4" aria-hidden /> Geen aandachtspunten op dit moment.
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <UsedInput
        usedInput={outcome.usedInput}
        soilLabels={props.soilLabels}
        fieldHref={fieldHref}
        partial={outcome.partial}
      />
    </div>
  )
}
