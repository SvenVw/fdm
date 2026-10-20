import { DYNA_V2_SOIL_PARAMETERS, type SeasonPhase } from "@nmi-agro/fdm-calculator"
import {
  addHarvest,
  getSoilParametersDescription,
  startOfDayInFdmTimeZone,
  toFdmDateString,
} from "@nmi-agro/fdm-core"
import { CircleAlert, CircleCheck, Info, MapPinOff } from "lucide-react"
import { Suspense, use, useEffect } from "react"
import {
  type ActionFunctionArgs,
  data,
  type LoaderFunctionArgs,
  type MetaFunction,
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
  seriesInYear,
} from "~/lib/mineralization"

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

    return {
      b_id_farm,
      b_id,
      calendar: params.calendar ?? String(year),
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
    case "ok":
      return <FieldMineralizationResult {...props} outcome={outcome} />
  }
}

function isPhase(value: string | null): value is SeasonPhase {
  return value === "planning" || value === "growing" || value === "evaluation"
}

function FieldMineralizationResult(
  props: Omit<LoaderData, "outcome"> & { outcome: FieldMineralizationOk },
) {
  const { outcome, year, today, isCurrentYear } = props
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = searchParams.get("phase")
  const phase: SeasonPhase = isPhase(requested) ? requested : outcome.insights.defaultPhase

  const series = seriesInYear(outcome.result.series, year)
  const forecastEnd = outcome.forecast?.days.at(-1)?.date ?? null
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
            series={series}
            events={outcome.events}
            today={isCurrentYear ? today : null}
            forecastEnd={isCurrentYear ? forecastEnd : null}
            rainEventDates={rainEventDates}
          />
          <ChartExplainer />
        </CardContent>
      </Card>

      {phase !== "evaluation" && outcome.forecast && outcome.forecast.days.length > 0 ? (
        <WeatherStrip forecast={outcome.forecast} signals={outcome.insights.signals} />
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
