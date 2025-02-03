import { Layer, Map as MapGL } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import {
    getMapboxStyle,
    getMapboxToken,
} from "@/components/custom/atlas/atlas-mapbox"
import { FieldsSourceNotClickable } from "@/components/custom/atlas/atlas-sources"
import { getFieldsStyle } from "@/components/custom/atlas/atlas-styles"
import { getViewState } from "@/components/custom/atlas/atlas-viewstate"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { fdm } from "@/lib/fdm.server"
import { getField } from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useLoaderData,
} from "react-router"
import { dataWithError } from "remix-toast"
import { ClientOnly } from "remix-utils/client-only"
import wkx from "wkx"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the field id
    const b_id = params.b_id
    if (!b_id) {
        throw data("Field ID is required", {
            status: 400,
            statusText: "Field ID is required",
        })
    }

    // Get details of field
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field is not found", {
            status: 404,
            statusText: "Field is not found",
        })
    }
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
    const featureCollection: FeatureCollection = {
        type: "FeatureCollection",
        features: [feature],
    }

    // Get mapbox token and style
    const mapboxToken = getMapboxToken()
    const mapboxStyle = getMapboxStyle()

    // Return user information from loader
    return {
        field: featureCollection,
        mapboxToken: mapboxToken,
        mapboxStyle: mapboxStyle,
    }
}

export default function FarmFieldAtlasBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const id = "fieldsSaved"
    const fields = loaderData.field
    const viewState = getViewState(fields)
    const fieldsSavedStyle = getFieldsStyle(id)

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Kaart</h3>
                <p className="text-sm text-muted-foreground">
                    Bekijk het perceel op de kaart
                </p>
            </div>
            <Separator />
            <div>
                <ClientOnly
                    fallback={<Skeleton className="h-full w-full rounded-xl" />}
                >
                    {() => (
                        <MapGL
                            {...viewState}
                            style={{
                                height: "calc(100vh - 64px - 123px)",
                                width: "100%",
                            }}
                            interactive={false}
                            mapStyle={loaderData.mapboxStyle}
                            mapboxAccessToken={loaderData.mapboxToken}
                            interactiveLayerIds={[id]}
                        >
                            <FieldsSourceNotClickable
                                id={id}
                                fieldsData={fields}
                            >
                                <Layer {...fieldsSavedStyle} />
                            </FieldsSourceNotClickable>
                        </MapGL>
                    )}
                </ClientOnly>
            </div>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const b_id = params.b_id

    if (!b_id) {
        return dataWithError(null, "Missing field ID.")
    }
}
