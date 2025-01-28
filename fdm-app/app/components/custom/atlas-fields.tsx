import {
    GeolocateControl,
    Layer,
    Map as MapGL,
    NavigationControl,
} from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import geojsonExtent from "@mapbox/geojson-extent"
import type { FeatureCollection } from "geojson"
import { useEffect, useState } from "react"
import type { LayerProps } from "react-map-gl"

import {
    FieldsPanelHover,
    FieldsPanelSelection,
    FieldsPanelZoom,
} from "./atlas-fields-panels"
import {
    AvailableFieldsSource,
    FieldsSource,
    type fieldsAvailableUrlType,
    generateFeatureClass,
} from "./atlas-fields-sources"

const ZOOM_LEVEL_FIELDS = 12

export function AtlasFields({
    height,
    width,
    interactive,
    mapboxToken,
    mapStyle,
    fieldsSelected,
    fieldsAvailableUrl,
    fieldsSaved,
}: MapFieldsProps) {
    // Set selected fields
    const [selectedFieldsData, setSelectedFieldsData] = useState(
        generateFeatureClass(),
    )
    useEffect(() => {
        if (fieldsSelected) {
            setSelectedFieldsData(fieldsSelected)
        }
    }, [fieldsSelected])

    let Controls = <></>
    let Panels = null
    if (interactive === true) {
        // Set controls
        Controls = (
            <div>
                <GeolocateControl />
                <NavigationControl />
            </div>
        )

        // Set panels
        Panels = (
            <div className="fields-panel grid gap-4 w-[350px]">
                <FieldsPanelSelection
                    fields={selectedFieldsData}
                    zoomLevelFields={ZOOM_LEVEL_FIELDS}
                />
                <FieldsPanelZoom zoomLevelFields={ZOOM_LEVEL_FIELDS} />
                <FieldsPanelHover zoomLevelFields={ZOOM_LEVEL_FIELDS} />
            </div>
        )
    }

    // Set viewState
    const initialBounds = [3.1, 50.7, 7.2, 53.6]
    let bounds = initialBounds
    if (fieldsSaved) {
        try {
            bounds = geojsonExtent(fieldsSaved)
        }
        catch (error) {
            console.error("Failed to calculate bounds:", error)
            bounds = initialBounds
        }
    }
    if (fieldsSelected) {
        try {
            bounds = geojsonExtent(fieldsSelected)
        } catch (error) {
            console.error("Failed to calculate bounds:", error)
            bounds = initialBounds
        }
    }
    const viewState = {
        bounds: bounds,
        fitBoundsOptions: { padding: 100 },
    }

    return (
        <>
            <MapGL
                {...viewState}
                style={{ height: height || "100%", width: width || "100%" }}
                interactive={interactive}
                mapStyle={mapStyle}
                mapboxAccessToken={mapboxToken}
                interactiveLayerIds={[
                    "available-fields-fill",
                    "selected-fields-fill",
                    "saved-fields-fill",
                ]}
            >
                {Controls}
                <FieldsSource
                    id="selectedFields"
                    fieldsData={selectedFieldsData}
                    setFieldsData={setSelectedFieldsData}
                >
                    <Layer {...selectedFieldsStyle} />
                </FieldsSource>
                <AvailableFieldsSource
                    url={fieldsAvailableUrl}
                    zoomLevelFields={ZOOM_LEVEL_FIELDS}
                >
                    <Layer {...availableFieldsFillStyle} />
                    {/* <Layer {...availableFieldsLineStyle} /> */}
                </AvailableFieldsSource>
                <FieldsSource
                    id="savedFields"
                    fieldsData={fieldsSaved}
                    setFieldsData={null}
                >
                    <Layer {...savedFieldsStyle} />
                </FieldsSource>
                {Panels}
            </MapGL>
        </>
    )
}

const availableFieldsFillStyle: LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} = {
    id: "available-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#93c5fd",
        "fill-opacity": 0.5,
        "fill-outline-color": "#1e3a8a",
    },
}
const availableFieldsLineStyle = {
    id: "available-fields-line",
    type: "line",
    paint: {
        "line-color": "#1e3a8a",
        "line-opacity": 0.8,
        "line-width": 2,
    },
}
const selectedFieldsStyle: LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} = {
    id: "selected-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#fca5a5",
        "fill-opacity": 0.8,
        "fill-outline-color": "#1e3a8a",
    },
}

const savedFieldsStyle: LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} = {
    id: "saved-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#fca5a5",
        "fill-opacity": 0.8,
        "fill-outline-color": "#1e3a8a",
    },
}

interface MapFieldsProps {
    height: string | undefined
    width: string | undefined
    interactive: boolean
    mapboxToken: string
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12"
    fieldsSelected: FeatureCollection | null
    fieldsAvailableUrl: fieldsAvailableUrlType,
    fieldsSaved: FeatureCollection | null
}
