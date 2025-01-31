import { Layer, Map as MapGL } from "react-map-gl"
import { fdm } from "@/lib/fdm.server"
import { getFields } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, data, useLoaderData } from "react-router"
import wkx from "wkx"
import { getViewState } from "@/components/custom/atlas/atlas-viewstate"
import type { FeatureCollection } from "geojson"
import {
    getMapboxStyle,
    getMapboxToken,
} from "@/components/custom/atlas/atlas-mapbox"
import { FieldsSourceNotClickable } from "@/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "@/components/custom/atlas/atlas-styles"
import { FieldsPanelHover } from "@/components/custom/atlas/atlas-panels"
import { ZOOM_LEVEL_FIELDS } from "@/components/custom/atlas/atlas"

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

    const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: features,
    }

    // Get the Mapbox token and style
    const mapboxToken = getMapboxToken()
    const mapboxStyle = getMapboxStyle()

    // Return user information from loader
    return {
        savedFields: featureCollection,
        mapboxToken: mapboxToken,
        mapboxStyle: mapboxStyle,
    }
}

export default function FarmAtlasFieldsBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const id = "fieldsSaved"
    const fields = loaderData.savedFields
    const viewState = getViewState(fields)
    const fieldsSavedStyle = getFieldsStyle(id)

    return (
        <>
            <MapGL
                {...viewState}
                style={{ height: "calc(100vh - 64px - 123px)", width: "100%" }}
                interactive={true}
                mapStyle={loaderData.mapboxStyle}
                mapboxAccessToken={loaderData.mapboxToken}
                interactiveLayerIds={[id]}
            >
                <FieldsSourceNotClickable id={id} fieldsData={fields}>
                    <Layer {...fieldsSavedStyle} />
                </FieldsSourceNotClickable>
                <div className="fields-panel grid gap-4 w-[350px]">
                    <FieldsPanelHover
                        zoomLevelFields={ZOOM_LEVEL_FIELDS}
                        layer={id}
                    />
                </div>
            </MapGL>
        </>
    )
}
