import { checkPermission, getFields } from "@nmi-agro/fdm-core"
import { BookOpenText } from "lucide-react"
import { Suspense, use, useEffect } from "react"
import { type LoaderFunctionArgs, type MetaFunction, NavLink, useLoaderData } from "react-router"
import type { FieldNutrientRow } from "~/components/blocks/nutrient-advice/overview-types"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import { NutrientAdviceOverviewSkeleton } from "~/components/blocks/nutrient-advice/overview-skeleton"
import { NutrientAdviceOverviewTable } from "~/components/blocks/nutrient-advice/overview-table"
import { Button } from "~/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "~/components/ui/empty"
import { useAnalytics } from "~/hooks/use-analytics"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { getFarmNutrientAdviceRows } from "~/lib/nutrient-advice.server"
import { cn } from "~/lib/utils"

// Meta
export const meta: MetaFunction = () => {
  return [
    {
      title: `Bemestingsadvies | ${clientConfig.name}`,
    },
    {
      name: "description",
      content: "Bekijk je Bemestingsadvies",
    },
  ]
}

/**
 * Loads the fields of a farm and their write permission, so the overview can render immediately.
 * The (slower) per-field nutrient advice calculation is deferred into `asyncData` and streamed in,
 * since it requires an external NMI API call per field.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
  try {
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
      throw new Error("b_id_farm is required")
    }

    // Get the session
    const session = await getSession(request)

    // Get timeframe from calendar store
    const timeframe = getTimeframe(params)
    const calendar = getCalendar(params)

    // Get the fields of the farm
    const fields = await getFields(fdm, session.principal_id, b_id_farm, timeframe)

    const farmWritePermission = await checkPermission(
      fdm,
      "farm",
      "write",
      b_id_farm,
      session.principal_id,
      new URL(request.url).pathname,
      false,
    )

    const nutrientsDescription = getNutrientsDescription()

    // Per-field advice is shared with the Atlas "Bemestingsadvies" layer (FDM-361).
    const asyncData: Promise<{ rows: FieldNutrientRow[] }> = getFarmNutrientAdviceRows(
      { principal_id: session.principal_id, b_id_farm, calendar, timeframe },
      fields,
    ).then((rows) => ({ rows }))

    return {
      hasFields: fields.length > 0,
      b_id_farm: b_id_farm,
      calendar: calendar,
      farmWritePermission,
      nutrientsDescription,
      asyncData,
    }
  } catch (error) {
    throw handleLoaderError(error)
  }
}

export default function FieldNutrientAdviceIndex() {
  const loaderData = useLoaderData<typeof loader>()
  const { hasFields, b_id_farm, calendar } = loaderData
  const { capture } = useAnalytics()

  useEffect(() => {
    capture("nutrient_advice_viewed", { b_id_farm, calendar })
  }, [capture, b_id_farm, calendar])

  if (!hasFields) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BookOpenText />
          </EmptyMedia>
          <EmptyTitle>Geen percelen gevonden</EmptyTitle>
          <EmptyDescription>
            Het lijkt erop dat er nog geen percelen zijn geregistreerd voor dit bedrijf.
            {loaderData.farmWritePermission
              ? " Voeg een nieuw perceel toe om bemestingsadvies te kunnen bekijken."
              : null}
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button
              variant="default"
              className={cn(!loaderData.farmWritePermission ? "hidden" : "")}
              asChild
            >
              <NavLink to={`/farm/${b_id_farm}/${calendar}/field/new`}>Nieuw perceel</NavLink>
            </Button>
            <Button variant="outline" asChild>
              <NavLink to="../">Naar bedrijfsoverzicht</NavLink>
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div className="min-w-0 px-10 pb-10">
      <Suspense key={`${b_id_farm}#${calendar}`} fallback={<NutrientAdviceOverviewSkeleton />}>
        <NutrientAdviceOverview loaderData={loaderData} />
      </Suspense>
    </div>
  )
}

/**
 * Renders the table once the per-field nutrient advice has resolved.
 *
 * This has to be extracted into a separate component because of the `use(...)` hook.
 * React will not render the component until `asyncData` resolves, but React Router
 * handles it nicely via the `Suspense` component and server-to-client data streaming.
 */
function NutrientAdviceOverview({
  loaderData,
}: {
  loaderData: Awaited<ReturnType<typeof loader>>
}) {
  const { rows } = use(loaderData.asyncData)
  return (
    <NutrientAdviceOverviewTable
      data={rows}
      nutrients={loaderData.nutrientsDescription}
      b_id_farm={loaderData.b_id_farm}
      calendar={loaderData.calendar}
    />
  )
}
