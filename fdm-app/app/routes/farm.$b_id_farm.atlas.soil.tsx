import { AtlasFields } from "@/components/custom/atlas-fields"
import { Button } from "@/components/ui/button"
import { fdm } from "@/lib/fdm.server"
import { getFields } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    NavLink,
    data,
    useLoaderData,
} from "react-router"
import wkx from "wkx"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }

    // Get the fields of the farm
    const fields = await getFields(fdm, b_id_farm)
    const features = fields.map((field) => {
        const feature = {
            type: "Feature",
            properties: {
                b_id: field.b_id,
                b_name: field.b_name,
                b_area: Math.round(field.b_area * 10) / 10,
            },
            geometry: wkx.Geometry.parse(field.b_geometry).toGeoJSON(),
        }
        return feature
    })

    const featureCollection = {
        type: "FeatureCollection",
        features: features,
    }

    // Get the Mapbox token
    const mapboxToken = String(process.env.MAPBOX_TOKEN)

    // Return user information from loader
    return {
        mapboxToken: mapboxToken,
        fields: featureCollection,
    }
}

export default function FarmAtlasSoilBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
            <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                <div className="flex flex-col space-y-2 text-center">
                    <h1 className="text-2xl font-semibold tracking-tight">
                        Helaas, de bodemkaart is nog niet beschikbaar :(
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        We proberen de bodemkaart binnenkort toe te voegen. Hou
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
