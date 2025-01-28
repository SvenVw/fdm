import { AtlasFields } from "@/components/custom/atlas-fields"
import { auth } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getFarm, getFarms, getFields } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, data, useLoaderData } from "react-router"
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
        savedFields: featureCollection,
        mapboxToken: mapboxToken,
    }
}

export default function FarmContentBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <AtlasFields
            height="calc(100vh - 64px - 123px)"
            width="100%"
            interactive={true}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxToken={loaderData.mapboxToken}
            fieldsSelected={null}
            fieldsAvailableUrl={undefined}
            fieldsSaved={loaderData.savedFields}
        />
    )
}
