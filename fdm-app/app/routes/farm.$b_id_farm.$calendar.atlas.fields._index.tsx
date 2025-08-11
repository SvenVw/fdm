import { useCallback, useEffect, useRef, useState } from "react"
import {
    Layer,
    Map as MapGL,
    type ViewState,
    type ViewStateChangeEvent,
} from "react-map-gl/mapbox"
import "mapbox-gl/dist/mapbox-gl.css"
import { getFields } from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
import type { MetaFunction } from "react-router"
import { data, type LoaderFunctionArgs, useLoaderData } from "react-router"
import { ZOOM_LEVEL_FIELDS } from "~/components/blocks/atlas/atlas"
import { Controls } from "~/components/blocks/atlas/atlas-controls"
import { FieldsPanelHover } from "~/components/blocks/atlas/atlas-panels"
import {
    FieldsSourceAvailable,
    FieldsSourceNotClickable,
} from "~/components/blocks/atlas/atlas-sources"
import { getFieldsStyle } from "~/components/blocks/atlas/atlas-styles"
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate"
import { getMapboxStyle, getMapboxToken } from "~/integrations/mapbox"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

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

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        // Get the fields of the farm
        let featureCollection: FeatureCollection | undefined
        if (b_id_farm && b_id_farm !== "undefined") {
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

            featureCollection = {
                type: "FeatureCollection",
                features: features,
            }
        }

        // Get the Mapbox token and style
        const mapboxToken = getMapboxToken()
        const mapboxStyle = getMapboxStyle()

        // Return user information from loader
        return {
            calendar: calendar,
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
    const fieldsSavedStyle = getFieldsStyle(id)
    const fieldsAvailableId = "fieldsAvailable"
    const fieldsAvailableStyle = getFieldsStyle(fieldsAvailableId)
    const fieldsSavedOutlineStyle = getFieldsStyle("fieldsSavedOutline")
    const initialViewState = getViewState(fields)

    // Create a sessionStorage to store the latest viewstate
    const [viewState, setViewState] = useState<ViewState>(() => {
        if (typeof window !== "undefined") {
            const savedViewState = sessionStorage.getItem("mapViewState")
            if (savedViewState) {
                return JSON.parse(savedViewState)
            }
        }
        return initialViewState as ViewState
    })

    const onViewportChange = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState)
    }, [])

    const isFirstRender = useRef(true)

    // If latest viewstate is available use that one
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        sessionStorage.setItem("mapViewState", JSON.stringify(viewState))
    }, [viewState])

    return (
        <MapGL
            {...viewState}
            style={{ height: "calc(100vh - 64px)", width: "100%" }}
            interactive={true}
            mapStyle={loaderData.mapboxStyle}
            mapboxAccessToken={loaderData.mapboxToken}
            interactiveLayerIds={[id, fieldsAvailableId]}
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

            <FieldsSourceAvailable
                id={fieldsAvailableId}
                calendar={loaderData.calendar}
                zoomLevelFields={ZOOM_LEVEL_FIELDS}
                redirectToDetailsPage={true}
            >
                <Layer {...fieldsAvailableStyle} />
            </FieldsSourceAvailable>

            {fields ? (
                <FieldsSourceNotClickable id={id} fieldsData={fields}>
                    <Layer {...fieldsSavedStyle} />
                    <Layer {...fieldsSavedOutlineStyle} />
                </FieldsSourceNotClickable>
            ) : null}
            <div className="fields-panel grid gap-4 w-[350px]">
                <FieldsPanelHover
                    zoomLevelFields={ZOOM_LEVEL_FIELDS}
                    layer={id}
                />
            </div>
        </MapGL>
    )
}
