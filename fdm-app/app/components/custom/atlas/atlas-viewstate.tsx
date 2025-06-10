import geojsonExtent from "@mapbox/geojson-extent"
import type { FeatureCollection } from "geojson"

function getBounds(fields: FeatureCollection | null) {
    const initialBounds = [3.1, 50.7, 7.2, 53.6]

    let bounds = initialBounds
    if (fields) {
        try {
            bounds = geojsonExtent(fields)
        } catch (error) {
            console.error("Failed to calculate bounds:", error)
        }
    }

    return bounds
}

export function getViewState(fields: FeatureCollection | null) {
    if (fields) {
        const bounds = getBounds(fields)

        const viewState = {
            bounds: bounds,
            fitBoundsOptions: { padding: 100 },
            // pitch: 0, // Default pitch
            // bearing: 0, // Default bearing
            padding: { top: 0, bottom: 0, left: 0, right: 0 }, // Default padding
        }
        return viewState
    }

    const viewState = {
        fitBoundsOptions: { padding: 100 },
        longitude: 4.9, // Default longitude for initial view
        latitude: 52.2, // Default latitude for initial view
        zoom: 6, // Default zoom level
        pitch: 0, // Default pitch
        bearing: 0, // Default bearing
        padding: { top: 0, bottom: 0, left: 0, right: 0 }, // Default padding
    }
    return viewState
}
