import type { FeatureCollection } from "geojson"
import { useState, useEffect } from "react"
import { Layer, Source } from "react-map-gl"
import MapGL, {MapError, ViewStateChangeInfo } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"
import { Controls } from "~/components/custom/atlas/atlas-controls"
import { getViewState } from "~/components/custom/atlas/atlas-viewstate"

type MapViewport = {
    longitude: number
    latitude: number
    zoom: number
    bounds?: [number, number, number, number]
    fitBoundsOptions?: { padding: number }
}

interface FieldMapType {
    b_geojson: FeatureCollection
    mapboxToken: string
}

const brpFieldsFillStyle = {
    id: "brp-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#93c5fd",
        "fill-opacity": 0.5,
        "fill-outline-color": "#1e3a8a",
    },
}
const brpFieldsLineStyle = {
    id: "brp-fields-line",
    type: "line",
    paint: {
        "line-color": "#1e3a8a",
        "line-opacity": 0.8,
        "line-width": 2,
    },
}

export function FieldMap(props: FieldMapType) {
    const mapboxToken = props.mapboxToken
    const [viewport, setViewport] = useState<MapViewport>({
        longitude: 4.895168,
        latitude: 52.370216,
        zoom: 9,
    })

    useEffect(() => {
        const initial = getViewState(props.b_geojson)
        const [minLng, minLat, maxLng, maxLat] = initial.bounds
        setViewport((currentViewport) => ({
            ...currentViewport,
            longitude: (minLng + maxLng) / 2,
            latitude: (minLat + maxLat) / 2,
            zoom: 9, 
            bounds: initial.bounds as [number, number, number, number],
            fitBoundsOptions: initial.fitBoundsOptions,
        }))
    }, [props.b_geojson])

    return (
        <MapGL
            {...(viewport as any)}
            style={{ width: "100%", height: "100%" }}
            mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
            mapboxApiAccessToken={mapboxToken}
            onMove={(evt: ViewStateChangeInfo) => setViewport(evt.viewState as MapViewport)}
            onError={(e: MapError) => console.error("Map error:", e)}
        >
            <Source id="fieldMap" type="geojson" data={props.b_geojson}>
                <Layer {...brpFieldsFillStyle} />
                <Layer {...brpFieldsLineStyle} />
            </Source>
            <Controls onViewportChange={setViewport} />
        </MapGL>
    )
}
