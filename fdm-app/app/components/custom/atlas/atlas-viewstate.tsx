import type { FeatureCollection } from "geojson"
import geojsonExtent from "@mapbox/geojson-extent"

function getBounds(fields: FeatureCollection | null) {
    const initialBounds = [3.1, 50.7, 7.2, 53.6]

    let bounds = null
    if (fields) {
        try {
            bounds = geojsonExtent(fields)
        } catch (error) {
            console.error("Failed to calculate bounds:", error)
            bounds = initialBounds
        }
    }

    return bounds
}

export function getViewState(fields: FeatureCollection | null) {
    const bounds = getBounds(fields)
    const viewState = {
        bounds: bounds,
        fitBoundsOptions: { padding: 100 },
    }
    return viewState
}
