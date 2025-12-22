import { getFields } from "@svenvw/fdm-core"
import { simplify } from "@turf/turf"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
} from "react-router"
import { Button } from "~/components/ui/button"
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
 * Loads farm fields as a GeoJSON FeatureCollection.
 *
 * This function retrieves the farm ID from the route parameters and ensures it is present. It then accesses the
 * current session to fetch the fields associated with the farm for the specified timeframe. Each field is
 * transformed into a GeoJSON feature, with properties including its ID, name, and area rounded to the nearest
 * decimal place, and assembles these features into a FeatureCollection. The returned object provides the
 * necessary data for rendering the farm's soil atlas.
 *
 * @param {LoaderFunctionArgs} args - The arguments containing the request and route parameters.
 * @returns A promise that resolves to an object containing a GeoJSON FeatureCollection of farm fields.
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
                geometry: simplify(field.b_geometry as any, {
                    tolerance: 0.00001,
                    highQuality: true,
                }),
            }
            return feature
        })

        const featureCollection = {
            type: "FeatureCollection",
            features: features,
        }

        // Return user information from loader
        return {
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
