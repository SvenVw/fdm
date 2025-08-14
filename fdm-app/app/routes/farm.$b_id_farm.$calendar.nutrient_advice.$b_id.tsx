import { calculateDose } from "@svenvw/fdm-calculator"
import {
    getCultivations,
    getCurrentSoilData,
    getFertilizerApplications,
    getFertilizers,
    getField,
} from "@svenvw/fdm-core"
import { Suspense, use } from "react"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    useLocation,
} from "react-router"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import { FieldNutrientAdviceSkeleton } from "~/components/blocks/nutrient-advice/skeletons"
import type { NutrientDescription } from "~/components/blocks/nutrient-advice/types"
import { getNutrientAdvice } from "~/integrations/nmi"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { FieldNutrientAdviceLayout } from "~/components/blocks/nutrient-advice/layout"
import {
    KPISection,
    NutrientAdviceSection,
} from "../components/blocks/nutrient-advice/sections"
import { ErrorBlock } from "../components/custom/error"

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
 * Loads the field data for nutrient advice based on the provided parameters.
 *
 * This function retrieves the field identifier (`b_id`), user session, and timeframe from the route parameters.
 * It then fetches the corresponding field data using the `getField` function. The retrieved field data
 * is returned as part of the loader's response.
 *
 * @param {LoaderFunctionArgs} args - The arguments passed to the loader function, including the request and parameters.
 * @returns {Promise<{ field: Field }>} - A promise that resolves to an object containing the fetched field data.
 * @throws {Error} - Throws an error if the `b_id_farm` or `b_id` parameter is missing.
 * @throws {Error} - Throws an error if any error occurs during the process, handled by `handleLoaderError`.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("b_id_farm is required")
        }

        const b_id = params.b_id
        if (!b_id) {
            throw new Error("b_id is required")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)
        const calendar = getCalendar(params)

        const field = await getField(fdm, session.principal_id, b_id)

        const asyncData = (async () => {
            try {
                const currentSoilData = getCurrentSoilData(
                    fdm,
                    session.principal_id,
                    b_id,
                )

                const fertilizerApplications = getFertilizerApplications(
                    fdm,
                    session.principal_id,
                    b_id,
                    timeframe,
                )
                const fertilizers = getFertilizers(
                    fdm,
                    session.principal_id,
                    b_id_farm,
                )

                const cultivations = await getCultivations(
                    fdm,
                    session.principal_id,
                    b_id,
                    timeframe,
                )

                if (!cultivations.length) {
                    throw handleLoaderError("missing: cultivations")
                }

                // For now take the first cultivation
                const b_lu_catalogue = cultivations[0].b_lu_catalogue

                const doses = (async () =>
                    calculateDose({
                        applications: await fertilizerApplications,
                        fertilizers: await fertilizers,
                    }))()

                // Request nutrient advice
                const nutrientAdvice = (async () =>
                    getNutrientAdvice(
                        b_lu_catalogue,
                        field.b_centroid,
                        await currentSoilData,
                    ))()

                const obj = {
                    nutrientAdvice: await nutrientAdvice,
                    doses: await doses,
                    fertilizerApplications: await fertilizerApplications,
                    fertilizers: await fertilizers,
                    errorMessage: undefined,
                }

                return obj
            } catch (error) {
                return { errorMessage: String(error).replace("Error: ", "") }
            }
        })()

        const nutrientsDescription = getNutrientsDescription()

        return {
            field: field,
            nutrientsDescription: nutrientsDescription,
            calendar: calendar,
            asyncData: asyncData,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldNutrientAdviceBlock() {
    const loaderData = useLoaderData()
    const { field, nutrientsDescription } = loaderData

    const primaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "primary",
    )
    const secondaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "secondary",
    )
    const traceNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "trace",
    )

    const splittedNutrients = {
        primaryNutrients,
        secondaryNutrients,
        traceNutrients,
    }

    return (
        <Suspense
            key={`${field.b_id_farm}#${field.b_id}`}
            fallback={<FieldNutrientAdviceSkeleton {...splittedNutrients} />}
        >
            <FieldNutrientAdvice
                loaderData={loaderData}
                {...splittedNutrients}
            />
        </Suspense>
    )
}

function FieldNutrientAdvice({
    loaderData,
    primaryNutrients,
    secondaryNutrients,
    traceNutrients,
}: {
    loaderData: Awaited<ReturnType<typeof loader>>
    primaryNutrients: NutrientDescription[]
    secondaryNutrients: NutrientDescription[]
    traceNutrients: NutrientDescription[]
}) {
    const { field, calendar, nutrientsDescription } = loaderData
    const asyncData = use(loaderData.asyncData)
    const location = useLocation()

    if (typeof asyncData.errorMessage === "string") {
        return (
            <ErrorBlock
                status={500}
                message={asyncData.errorMessage}
                stacktrace={undefined}
                page={location.pathname}
                timestamp={new Date().toISOString()}
            />
        )
    }
    return (
        <FieldNutrientAdviceLayout
            primaryNutrientsSection={
                <NutrientAdviceSection
                    nutrients={primaryNutrients}
                    field={field}
                    calendar={calendar}
                    asyncData={asyncData}
                />
            }
            kpiSection={
                <KPISection
                    asyncData={asyncData}
                    nutrientsDescription={nutrientsDescription}
                />
            }
            secondaryNutrientsSection={
                <NutrientAdviceSection
                    nutrients={secondaryNutrients}
                    field={field}
                    calendar={calendar}
                    asyncData={asyncData}
                />
            }
            traceNutrientsSection={
                <NutrientAdviceSection
                    nutrients={traceNutrients}
                    field={field}
                    calendar={calendar}
                    asyncData={asyncData}
                />
            }
        />
    )
}
