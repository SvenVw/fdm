import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { getNmiApiKey, getSoilParameterEstimates } from "../integrations/nmi"
import { getCultivationCatalogue } from "@svenvw/fdm-data"
import { fdm } from "../lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Perceel | Atlas | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk de details van dit perceel",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get the estimates for this field
        const centroid = params.centroid
        if (!centroid) {
            throw data("Centroid is required", {
                status: 400,
                statusText: "Centroid is required",
            })
        }
        const [longitude, latitude] = centroid.split(",").map(Number)
        const field = {
            type: "Feature",
            properties: {},
            geometry: {
                type: "Point",
                coordinates: [longitude, latitude],
            },
        } as GeoJSON.Feature<GeoJSON.Point>
        const nmiApiKey = getNmiApiKey()
        const estimates = await getSoilParameterEstimates(field, nmiApiKey)

        // Get cultivation history details
        const cultivationCatalogue = await getCultivationCatalogue("brp")
        const cultivationHistory = estimates.cultivations.map((cultivation) => {
            const b_lu_catalogue = `nl_${cultivation.b_lu_brp}`
            const catalogueItem = cultivationCatalogue.find(
                (catalogueItem) =>
                    catalogueItem.b_lu_catalogue === b_lu_catalogue,
            )
            return {
                year: cultivation.year,
                b_lu_catalogue: b_lu_catalogue,
                b_lu_name: catalogueItem?.b_lu_name,
                b_lu_croprotation: catalogueItem?.b_lu_croprotation,
            }
        })

        // Get groundwater details
        const groundwaterEstimates = {
            b_gwl_class: estimates.b_gwl_class,
            b_gwl_ghg: estimates.b_gwl_ghg,
            b_gwl_glg: estimates.b_gwl_glg,
        }

        // Get soil parameter estimates
        const soilParameterEstimates = {
            a_clay_mi: Math.round(estimates.a_clay_mi),
            a_silt_mi: Math.round(estimates.a_silt_mi),
            a_sand_mi: Math.round(estimates.a_sand_mi),
        }

        // Get field details
        const fieldDetails = {
            b_area: undefined,
            isNvGebied: undefined,
            isNatura2000Area: undefined,
            regionTable2: undefined,
        }

        return {
            cultivationHistory: cultivationHistory,
            groundwaterEstimates: groundwaterEstimates,
            soilParameterEstimates: soilParameterEstimates,
            fieldDetails: fieldDetails,
        }



    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FieldDetailsAtlasBlock() {
    const loaderData = useLoaderData<typeof loader>()
    console.log(loaderData)

    return null
}
