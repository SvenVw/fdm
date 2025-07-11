import { getFields } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    useLoaderData,
} from "react-router"
import { Button } from "~/components/ui/button"
import { getMapboxToken } from "~/integrations/mapbox"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bodem - Kaart | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk bodemgegevens op de kaart.",
        },
    ]
}

/**
 * Loads farm fields as a GeoJSON FeatureCollection along with a Mapbox token.
 *
 * This function validates that the farm ID is present in the route parameters, retrieves the user session, and
 * fetches the farm's fields. It then converts each field into a GeoJSON feature with its area rounded to one
 * decimal place, assembles these features into a FeatureCollection, and obtains a Mapbox token. The returned
 * object includes both the token and the FeatureCollection.
 *
 * @returns A promise that resolves to an object containing a Mapbox token and a GeoJSON FeatureCollection of farm fields.
 *
 * @throws {Response} If the farm ID is missing from the parameters or an error occurs during data fetching.
 */
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

        // Get the fields of the farm
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const features = fields.map((field) => {
            const feature = {
                type: "Feature",
                properties: {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    b_area: Math.round(field.b_area * 10) / 10,
                },
                geometry: field.b_geometry,
            }
            return feature
        })

        const featureCollection = {
            type: "FeatureCollection",
            features: features,
        }

        // Get the Mapbox token
        const mapboxToken = getMapboxToken()
        // Return user information from loader
        return {
            mapboxToken: mapboxToken,
            fields: featureCollection,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders a placeholder message indicating that the soil map is not available.
 *
 * This component displays a centered layout with an informative message and a navigation button
 * linking to the field map.
 */
export default function FarmAtlasSoilBlock() {
    const _loaderData = useLoaderData<typeof loader>()

    return (
        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
            <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">
                    Helaas, de bodemkaart is nog niet beschikbaar :(
                </h1>
                <p className="text-sm text-muted-foreground">
                    We proberen de bodemkaart binnenkort toe te voegen. Hou de
                    website in de gaten.
                </p>
            </div>
            <Button asChild aria-label="Naar perceelkaart">
                <NavLink to="../fields">Naar perceelkaart</NavLink>
            </Button>
        </div>
    )
}
