import { calculateDose } from "@svenvw/fdm-calculator"
import {
    getCultivations,
    getCurrentSoilData,
    getFertilizerApplications,
    getFertilizers,
    getField,
} from "@svenvw/fdm-core"
import { Tally1, Tally2, Tally3 } from "lucide-react"
import { Suspense, useEffect, useState } from "react"
import {
    Await,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    useLocation,
} from "react-router"
import { NutrientCard } from "~/components/blocks/nutrient-advice/cards"
import {
    NutrientKPICardForNutrientDeficit,
    NutrientKPICardForNutrientExcess,
    NutrientKPICardForTotalApplications,
} from "~/components/blocks/nutrient-advice/kpi"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import { NutrientCardSkeleton } from "~/components/blocks/nutrient-advice/skeletons"
import type { NutrientDescription } from "~/components/blocks/nutrient-advice/types"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { getNutrientAdvice } from "~/integrations/nmi"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

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
    const { field, nutrientsDescription, calendar } = loaderData

    const [errorMessage, setErrorMessage] = useState(undefined)
    const [asyncData, setAsyncData] = useState(loaderData.asyncData)
    useEffect(() => {
        let cancelled = false
        setErrorMessage(undefined)
        setAsyncData(loaderData.asyncData)
        loaderData.asyncData.then((data) => {
            if (cancelled) return

            if (data.errorMessage) {
                setErrorMessage(data.errorMessage)
            }
        })
        return () => {
            cancelled = true
        }
    }, [loaderData.asyncData])
    const location = useLocation()
    const page = location.pathname

    const primaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "primary",
    )
    const secondaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "secondary",
    )
    const traceNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "trace",
    )

    if (errorMessage) {
        return (
            <div className="flex items-center justify-center">
                <Card className="w-[350px]">
                    <CardHeader>
                        <CardTitle>
                            Helaas is het niet mogelijk om je bemestingsadvies
                            uit te rekenen
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground">
                            <p>
                                Er is onverwacht wat misgegaan. Probeer opnieuw
                                of neem contact op met Ondersteuning en deel de
                                volgende foutmelding:
                            </p>
                            <div className="mt-8 w-full max-w-2xl">
                                <pre className="bg-gray-200 dark:bg-gray-800 p-4 rounded-md overflow-x-auto text-sm text-gray-800 dark:text-gray-200">
                                    {JSON.stringify(
                                        {
                                            message: errorMessage,
                                            page: page,
                                            timestamp: new Date(),
                                        },
                                        null,
                                        2,
                                    )}
                                </pre>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 gap-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tally1 className="h-5 w-5" />
                        NPK
                    </CardTitle>
                    <CardDescription>
                        Essentiële nutriënten voor een optimale groei en
                        ontwikkeling van gewassen
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Suspense
                            fallback={primaryNutrients.map((nutrient) => (
                                <NutrientCardSkeleton key={nutrient.symbol} />
                            ))}
                        >
                            <Await resolve={asyncData}>
                                {({
                                    fertilizers,
                                    fertilizerApplications,
                                    nutrientAdvice,
                                    doses,
                                }) =>
                                    primaryNutrients.map(
                                        (nutrient: NutrientDescription) => (
                                            <NutrientCard
                                                key={nutrient.symbol}
                                                description={nutrient}
                                                advice={
                                                    nutrientAdvice[
                                                        nutrient.adviceParameter
                                                    ]
                                                }
                                                doses={doses}
                                                fertilizerApplications={
                                                    fertilizerApplications
                                                }
                                                fertilizers={fertilizers}
                                                to={`/farm/${field.b_id_farm}/${calendar}/field/${field.b_id}/fertilizer`}
                                            />
                                        ),
                                    )
                                }
                            </Await>
                        </Suspense>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Suspense
                    fallback={[1, 2, 3].map((id) => (
                        <NutrientCardSkeleton key={id} />
                    ))}
                >
                    <Await resolve={asyncData}>
                        {({
                            fertilizerApplications,
                            nutrientAdvice,
                            doses,
                        }) => (
                            <>
                                <NutrientKPICardForTotalApplications
                                    doses={doses}
                                    fertilizerApplications={
                                        fertilizerApplications
                                    }
                                />

                                <NutrientKPICardForNutrientDeficit
                                    descriptions={nutrientsDescription}
                                    advices={nutrientAdvice}
                                    doses={doses}
                                />

                                <NutrientKPICardForNutrientExcess
                                    descriptions={nutrientsDescription}
                                    advices={nutrientAdvice}
                                    doses={doses}
                                />
                            </>
                        )}
                    </Await>
                </Suspense>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tally2 className="h-5 w-5" />
                        Organische stof en secondaire nutriënten
                    </CardTitle>
                    <CardDescription>
                        Ondersteunende nutriënten die essentieel zijn voor de
                        gezondheid van de bodem en de ontwikkeling van planten
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Suspense
                            fallback={secondaryNutrients.map((nutrient) => (
                                <NutrientCardSkeleton key={nutrient.symbol} />
                            ))}
                        >
                            <Await resolve={asyncData}>
                                {({
                                    fertilizers,
                                    fertilizerApplications,
                                    nutrientAdvice,
                                    doses,
                                }) =>
                                    secondaryNutrients.map(
                                        (nutrient: NutrientDescription) => (
                                            <NutrientCard
                                                key={nutrient.symbol}
                                                description={nutrient}
                                                advice={
                                                    nutrientAdvice[
                                                        nutrient.adviceParameter
                                                    ]
                                                }
                                                doses={doses}
                                                fertilizerApplications={
                                                    fertilizerApplications
                                                }
                                                fertilizers={fertilizers}
                                                to={`/farm/${field.b_id_farm}/${calendar}/field/${field.b_id}/fertilizer`}
                                            />
                                        ),
                                    )
                                }
                            </Await>
                        </Suspense>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tally3 className="h-5 w-5" />
                        Spoorelementen
                    </CardTitle>
                    <CardDescription>
                        Essentiële micronutriënten voor een optimale gezondheid
                        en ontwikkeling van planten
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Suspense
                            fallback={traceNutrients.map((nutrient) => (
                                <NutrientCardSkeleton key={nutrient.symbol} />
                            ))}
                        >
                            <Await resolve={asyncData}>
                                {({
                                    fertilizers,
                                    fertilizerApplications,
                                    nutrientAdvice,
                                    doses,
                                }) =>
                                    traceNutrients.map(
                                        (nutrient: NutrientDescription) => (
                                            <NutrientCard
                                                key={nutrient.symbol}
                                                description={nutrient}
                                                advice={
                                                    nutrientAdvice[
                                                        nutrient.adviceParameter
                                                    ]
                                                }
                                                doses={doses}
                                                fertilizerApplications={
                                                    fertilizerApplications
                                                }
                                                fertilizers={fertilizers}
                                                to={`/farm/${field.b_id_farm}/${calendar}/field/${field.b_id}/fertilizer`}
                                            />
                                        ),
                                    )
                                }
                            </Await>
                        </Suspense>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
