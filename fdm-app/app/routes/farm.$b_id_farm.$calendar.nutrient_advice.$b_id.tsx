import { calculateDose } from "@svenvw/fdm-calculator"
import {
    getCultivations,
    getCurrentSoilData,
    getFertilizerApplications,
    getFertilizers,
    getField,
} from "@svenvw/fdm-core"
import { Tally1, Tally2, Tally3 } from "lucide-react"
import { Suspense } from "react"
import {
    Await,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    useNavigation,
} from "react-router"
import { NutrientCard } from "~/components/blocks/nutrient-advice/cards"
import {
    NutrientKPICardForNutrientDeficit,
    NutrientKPICardForNutrientExcess,
    NutrientKPICardForTotalApplications,
} from "~/components/blocks/nutrient-advice/kpi"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import type { NutrientDescription } from "~/components/blocks/nutrient-advice/types"
import {
    NutrientAdviceFallback,
    NutrientCardSkeleton,
} from "~/components/blocks/nutrient-advice/skeletons"
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

        const currentSoilData = await getCurrentSoilData(
            fdm,
            session.principal_id,
            b_id,
        )

        const fertilizerApplications = await getFertilizerApplications(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )
        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        const doses = calculateDose({
            applications: fertilizerApplications,
            fertilizers,
        })

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

        // Request nutrient advice
        const nutrientAdvice = getNutrientAdvice(
            b_lu_catalogue,
            field.b_centroid,
            currentSoilData,
        )

        const nutrientsDescription = getNutrientsDescription()

        return {
            field: field,
            nutrientAdvice: nutrientAdvice,
            nutrientsDescription: nutrientsDescription,
            doses: doses,
            fertilizerApplications: fertilizerApplications,
            fertilizers: fertilizers,
            calendar: calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldNutrientAdviceBlock() {
    const {
        field,
        nutrientAdvice,
        nutrientsDescription,
        doses,
        fertilizerApplications,
        fertilizers,
        calendar,
    } = useLoaderData()
    const navigation = useNavigation()

    const primaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "primary",
    )
    const secondaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "secondary",
    )
    const traceNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "trace",
    )

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
                    {navigation.state === "loading" ? (
                        <NutrientAdviceFallback />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {primaryNutrients.map(
                                (nutrient: NutrientDescription) => (
                                    <Suspense
                                        key={nutrient.symbol}
                                        fallback={<NutrientCardSkeleton />}
                                    >
                                        <Await resolve={nutrientAdvice}>
                                            {(nutrientAdvice) => (
                                                <NutrientCard
                                                    key={nutrient.symbol}
                                                    description={nutrient}
                                                    advice={
                                                        nutrientAdvice[
                                                            nutrient
                                                                .adviceParameter
                                                        ]
                                                    }
                                                    doses={doses}
                                                    fertilizerApplications={
                                                        fertilizerApplications
                                                    }
                                                    fertilizers={fertilizers}
                                                    to={`/farm/${field.b_id_farm}/${calendar}/field/${field.b_id}/fertilizer`}
                                                />
                                            )}
                                        </Await>
                                    </Suspense>
                                ),
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <NutrientKPICardForTotalApplications
                    doses={doses}
                    fertilizerApplications={fertilizerApplications}
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
                    {navigation.state === "loading" ? (
                        <NutrientAdviceFallback />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {secondaryNutrients.map(
                                (nutrient: NutrientDescription) => (
                                    <Suspense
                                        key={nutrient.symbol}
                                        fallback={<NutrientCardSkeleton />}
                                    >
                                        <Await resolve={nutrientAdvice}>
                                            {(nutrientAdvice) => (
                                                <NutrientCard
                                                    key={nutrient.symbol}
                                                    description={nutrient}
                                                    advice={
                                                        nutrientAdvice[
                                                            nutrient
                                                                .adviceParameter
                                                        ]
                                                    }
                                                    doses={doses}
                                                    fertilizerApplications={
                                                        fertilizerApplications
                                                    }
                                                    fertilizers={fertilizers}
                                                    to={`/farm/${field.b_id_farm}/${calendar}/field/${field.b_id}/fertilizer`}
                                                />
                                            )}
                                        </Await>
                                    </Suspense>
                                ),
                            )}
                        </div>
                    )}
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
                    {navigation.state === "loading" ? (
                        <NutrientAdviceFallback />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {traceNutrients.map(
                                (nutrient: NutrientDescription) => (
                                    <Suspense
                                        key={nutrient.symbol}
                                        fallback={<NutrientCardSkeleton />}
                                    >
                                        <Await resolve={nutrientAdvice}>
                                            {(nutrientAdvice) => (
                                                <NutrientCard
                                                    key={nutrient.symbol}
                                                    description={nutrient}
                                                    advice={
                                                        nutrientAdvice[
                                                            nutrient
                                                                .adviceParameter
                                                        ]
                                                    }
                                                    doses={doses}
                                                    fertilizerApplications={
                                                        fertilizerApplications
                                                    }
                                                    fertilizers={fertilizers}
                                                    to={`/farm/${field.b_id_farm}/${calendar}/field/${field.b_id}/fertilizer`}
                                                />
                                            )}
                                        </Await>
                                    </Suspense>
                                ),
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
