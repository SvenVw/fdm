import {
    GeolocateControl,
    Layer,
    Map as MapGL,
    NavigationControl,
} from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ZOOM_LEVEL_FIELDS } from "@/components/custom/atlas/atlas"
import {
    getMapboxStyle,
    getMapboxToken,
} from "@/components/custom/atlas/atlas-mapbox"
import { FieldsPanelHover } from "@/components/custom/atlas/atlas-panels"
import { FieldsSourceNotClickable } from "@/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "@/components/custom/atlas/atlas-styles"
import { getViewState } from "@/components/custom/atlas/atlas-viewstate"
import { fdm } from "@/lib/fdm.server"
import { getFields } from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
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
                b_lu_name: field.b_lu_name,
                b_id_source: field.b_id_source,
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
                <GeolocateControl />
                <NavigationControl />
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
