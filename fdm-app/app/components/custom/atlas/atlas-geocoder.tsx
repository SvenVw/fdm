import { useControl } from "react-map-gl/mapbox"
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import { getMapboxToken } from "@/app/integrations/mapbox"
import type { GeoJSONFeature } from "mapbox-gl"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"

interface GeocoderResult extends GeoJSONFeature {
    center: [number, number]
    bbox?: [number, number, number, number]
}

type GeocoderControlProps = {
    marker?: boolean
    onResult?: (result: GeocoderResult) => void
    onViewportChange?: (viewport: { longitude: number; latitude: number; zoom: number }) => void
}

export function GeocoderControl(props: GeocoderControlProps) {
    useControl(
        () => {
            const geocoder = new MapboxGeocoder({
                accessToken: getMapboxToken(),
                marker: props.marker,
                collapsed: false,
                countries: "nl",
                language: "nl"
            })
            geocoder.on("result", (e: { result: GeocoderResult }) => {
                if (props.onResult) {
                    props.onResult(e.result)
                }
                if (props.onViewportChange) {
                    const { center, bbox } = e.result
                    const [minLng, minLat, maxLng, maxLat] = bbox || [
                        center[0],
                        center[1],
                        center[0],
                        center[1],
                    ]
                    const newViewport = {
                        longitude: (minLng + maxLng) / 2,
                        latitude: (minLat + maxLat) / 2,
                        zoom: 14, // Default zoom
                    }
                    props.onViewportChange(newViewport)
                }
            })
            return geocoder
        },
        {
            position: "top-right",
        },
    )

    return null
}
