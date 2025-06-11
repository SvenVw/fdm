import {
    getCultivation,
    getCultivations,
    getCurrentSoilData,
    getFertilizerApplications,
    getFertilizers,
    getField,
} from "@svenvw/fdm-core"
import {
    useLoaderData,
    type LoaderFunctionArgs,
    type MetaFunction,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { getNutrientAdvice } from "~/integrations/nmi"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Target } from "lucide-react"
import { getNutrientsDescription } from "~/components/blocks/nutrient-advice/nutrients"
import type { NutrientDescription } from "~/components/blocks/nutrient-advice/types"
import { NutrientCard } from "~/components/blocks/nutrient-advice/cards"
import { calculateDose } from "@svenvw/fdm-calculator"
import { fertilizerApplication } from "../../../fdm-core/dist/db/schema"

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

        const doses = calculateDose({applications: fertilizerApplications, fertilizers})
        console.log(doses)

        const cultivations = await getCultivations(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )
        // For now take the first cultivation
        const b_lu_catalogue = cultivations[0].b_lu_catalogue

        // Request nutrient advice
        const nutrientAdvice = await getNutrientAdvice(
            b_lu_catalogue,
            field.b_centroid,
            currentSoilData,
        )
        // console.log(nutrientAdvice)

        const nutrientsDescription = getNutrientsDescription()

        return {
            field: field,
            nutrientAdvice: nutrientAdvice,
            nutrientsDescription: nutrientsDescription,
            doses: doses,
            fertilizerApplications: fertilizerApplications,
            fertilizers: fertilizers,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldNutrientAdviceBlock() {
    const {
        nutrientAdvice,
        nutrientsDescription,
        doses,
        fertilizerApplications,
        fertilizers,
    } = useLoaderData()

    const primaryNutrients = nutrientsDescription.filter(
        (item: NutrientDescription) => item.type === "primary",
    )
    // console.log(primaryNutrients)
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    NPK
                </CardTitle>
                <CardDescription>
                    Essentiële nutriënten voor een optimale groei en
                    ontwikkeling van gewassen
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {primaryNutrients.map((nutrient: NutrientDescription) => (
                        // console.log(nutrientAdvice[nutrient.adviceParameter])
                        // return (
                        <NutrientCard
                            key={nutrient.symbol}
                            description={nutrient}
                            advice={nutrientAdvice[nutrient.adviceParameter]}
                            doses={doses}
                            fertilizerApplications={fertilizerApplications}
                            fertilizers={fertilizers}
                            // applications={fertilizerApplications[nutrient.symbol as keyof typeof fertilizerApplications] || []}
                        />
                        // )
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
