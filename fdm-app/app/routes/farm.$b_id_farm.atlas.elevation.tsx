import { getMapboxToken } from "@/components/custom/atlas/atlas-mapbox"
import { Button } from "@/components/ui/button"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getFields } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    data,
    useLoaderData,
} from "react-router"
import config from "~/fdm.config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Hoogte - Kaart | ${config.name}` },
        {
            name: "description",
            content: "Bekijk hoogtegegevens op de kaart.",
        },
    ]
}

/**
 * Loads farm field data and a Mapbox token for the elevation feature.
 *
 * This asynchronous function checks for the presence of a farm ID in the route parameters. It retrieves the user session, fetches the fields associated with the specified farm, and maps them to a GeoJSON FeatureCollection. A Mapbox token is also obtained to enable map rendering on the client side. Errors during these processes, such as a missing farm ID or data retrieval issues, are caught and rethrown.
 *
 * @throws {Error} If the farm ID is not provided (HTTP 400) or if an internal error occurs during data fetching.
 *
 * @returns An object containing the Mapbox token and the GeoJSON FeatureCollection of farm fields.
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

        // Get the fields of the farm
        const fields = await getFields(fdm, session.principal_id, b_id_farm)
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
 * Renders a placeholder UI for the farm elevation feature.
 *
 * This component displays a message informing the user that the elevation map is not yet available and provides a button that navigates to the field map.
 */
export default function FarmAtlasElevationBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
            <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Helaas, de hoogtekaart is nog niet beschikbaar :(
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        We proberen de hoogtekaart binnenkort toe te voegen. Hou
                        de website in de gaten.
                    </p>
                </div>
                <Button asChild>
                    <NavLink to="../fields">Naar perceelkaart</NavLink>
                </Button>
            </div>
        </>
    )
}
