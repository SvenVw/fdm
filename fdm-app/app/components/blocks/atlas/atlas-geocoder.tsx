import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder"
import type {
    ControlPosition,
    GeoJSONFeature,
    Map as MapboxMap,
} from "mapbox-gl"
import { type IControl, useControl } from "react-map-gl/mapbox"
import { getMapboxToken } from "~/integrations/mapbox"
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css"

interface GeocoderResult extends GeoJSONFeature {
    center: [number, number]
    bbox?: [number, number, number, number]
}

type GeocoderControlProps = {
    marker?: boolean
    collapsed?: boolean
    onResult?: (result: GeocoderResult) => void
    onViewportChange?: (viewport: {
        longitude: number
        latitude: number
        zoom: number
    }) => void
}

class GeocoderControlClass implements IControl {
    _geocoder: MapboxGeocoder
    _map: MapboxMap | undefined
    _container: HTMLElement | undefined

    constructor(props: GeocoderControlProps) {
        this._geocoder = new MapboxGeocoder({
            accessToken: getMapboxToken(),
            marker: props.marker,
            collapsed: props.collapsed,
            countries: "nl",
            language: "nl",
        })

        this._geocoder.on("result", (e: { result: GeocoderResult }) => {
            try {
                if (!e.result || !e.result.center) {
                    console.warn("Invalid geocoder result:", e.result)
                    return
                }

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
            } catch (error) {
                console.error("Error handling geocoder result:", error)
            }
        })
    }

    onAdd(map: MapboxMap): HTMLElement {
        this._map = map
        this._container = this._geocoder.onAdd(map as any) // Cast to any to bypass type checking
        return this._container
    }

    onRemove(): void {
        if (this._map && this._container) {
            this._geocoder.onRemove()
            this._map = undefined
            this._container = undefined
        }
    }

    getDefaultPosition(): ControlPosition {
        return "top-right"
    }
}

export function GeocoderControl(props: GeocoderControlProps) {
    useControl(() => new GeocoderControlClass(props))
    return null
}
