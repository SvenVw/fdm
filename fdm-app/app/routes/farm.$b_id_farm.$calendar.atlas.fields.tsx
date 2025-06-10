import { useCallback, useState } from "react"
import {
    Layer,
    Map as MapGL,
    type ViewStateChangeEvent,
    type ViewState,
} from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { getFields } from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
import { type LoaderFunctionArgs, data, useLoaderData } from "react-router"
import type { MetaFunction } from "react-router"
import { ZOOM_LEVEL_FIELDS } from "~/components/blocks/atlas/atlas"
import { FieldsPanelHover } from "~/components/blocks/atlas/atlas-panels"
import { FieldsSourceNotClickable } from "~/components/blocks/atlas/atlas-sources"
import { getFieldsStyle } from "~/components/blocks/atlas/atlas-styles"
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate"
import { getMapboxStyle, getMapboxToken } from "~/integrations/mapbox"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { Controls } from "~/components/custom/atlas/atlas-controls"

export const meta: MetaFunction = () => {
    return [
        { title: `Percelen - Kaart | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Bekijk alle percelen van uw bedrijf op één interactieve kaart. Visualiseer de geografische spreiding en onderlinge relaties tussen uw percelen.",
        },
    ]
}

/**
 * Loads and processes farm field data along with Mapbox configuration for rendering the farm atlas.
 *
 * This loader function extracts the farm ID from the route parameters and validates its presence,
 * retrieves the current user session, and fetches fields associated with the specified farm.
 * It converts these fields into a GeoJSON FeatureCollection—rounding the field area values for precision—
 * and obtains the Mapbox access token and style configuration for map rendering.
 *
 * @returns An object containing:
 *  - savedFields: A GeoJSON FeatureCollection of the farm fields.
 *  - mapboxToken: The Mapbox access token.
 *  - mapboxStyle: The Mapbox style configuration.
 *
 * @throws {Response} If the farm ID is missing or if an error occurs during data retrieval and processing.
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
                type: "Feature" as const,
                properties: {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    b_area: Math.round(field.b_area * 10) / 10,
                    b_lu_name: field.b_lu_name,
                    b_id_source: field.b_id_source,
                },
                geometry: field.b_geometry,
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
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders a Mapbox map displaying farm fields with interactive controls.
 *
 * This component consumes preloaded farm field data to compute the map's view state and stylize the field boundaries.
 * It integrates geolocation and navigation controls, wraps the field layer in a non-interactive source, and includes a panel for displaying additional field details on hover.
 */
export default function FarmAtlasFieldsBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const id = "fieldsSaved"
    const fields = loaderData.savedFields
    const initialViewState = getViewState(fields)
    const fieldsSavedStyle = getFieldsStyle(id)

    const [viewState, setViewState] = useState<ViewState>(initialViewState as ViewState)

    const onViewportChange = useCallback(
        (event: ViewStateChangeEvent) => {
            setViewState(event.viewState)
        },
        [],
    )

    return (
        <>
            <MapGL
                {...viewState}
                style={{ height: "calc(100vh - 64px - 147px)", width: "100%" }}
                interactive={true}
                mapStyle={loaderData.mapboxStyle}
                mapboxAccessToken={loaderData.mapboxToken}
                interactiveLayerIds={[id]}
                onMove={onViewportChange}
            >
                <Controls
                    onViewportChange={({ longitude, latitude, zoom }) =>
                        setViewState((currentViewState) => ({
                            ...currentViewState,
                            longitude,
                            latitude,
                            zoom,
                            pitch: currentViewState.pitch, // Ensure pitch is carried over
                            bearing: currentViewState.bearing, // Ensure bearing is carried over
                        }))
                    }
                />
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
