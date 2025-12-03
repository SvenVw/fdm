import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder"
import "@maplibre/maplibre-gl-geocoder/dist/maplibre-gl-geocoder.css"
import type {
    ControlPosition,
    GeoJSONFeature,
    Map as MapLibreMap,
} from "maplibre-gl"
import maplibregl from "maplibre-gl"
import { type IControl, useControl } from "react-map-gl/maplibre"
import { clientConfig } from "~/lib/config"

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

interface ForwardGeocodeConfig {
    query?: string | number[]
    limit?: number
}

interface NominatimItem {
    place_id: number
    lon: string
    lat: string
    display_name: string
    type: string
    boundingbox?: [string, string, string, string]
}

class GeocoderControlClass implements IControl {
    _geocoder: MaplibreGeocoder
    _map: MapLibreMap | undefined
    _container: HTMLElement | undefined

    constructor(props: GeocoderControlProps) {
        const { provider, maptilerKey } = clientConfig.integrations.map

        const geocoderApi = {
            forwardGeocode: async (config: ForwardGeocodeConfig) => {
                const features: GeocoderResult[] = []
                try {
                    const query = String(config.query ?? "")
                    if (provider === "maptiler" && maptilerKey) {
                        const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(
                            query,
                        )}.json?key=${maptilerKey}&limit=${config.limit || 5}`
                        const res = await fetch(url)
                        const data = await res.json()
                        return data
                    }
                    if (provider === "osm") {
                        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
                            query,
                        )}&format=json&addressdetails=1&limit=${
                            config.limit || 5
                        }&accept-language=nl`
                        const res = await fetch(url)
                        const data = await res.json()

                        if (Array.isArray(data)) {
                            const features = data.map((item: NominatimItem) => {
                                const bbox:
                                    | [number, number, number, number]
                                    | undefined = item.boundingbox
                                    ? [
                                          Number.parseFloat(
                                              item.boundingbox[2],
                                          ), // minLon
                                          Number.parseFloat(
                                              item.boundingbox[0],
                                          ), // minLat
                                          Number.parseFloat(
                                              item.boundingbox[3],
                                          ), // maxLon
                                          Number.parseFloat(
                                              item.boundingbox[1],
                                          ), // maxLat
                                      ]
                                    : undefined

                                return {
                                    id: item.place_id,
                                    type: "Feature",
                                    geometry: {
                                        type: "Point",
                                        coordinates: [
                                            Number.parseFloat(item.lon),
                                            Number.parseFloat(item.lat),
                                        ],
                                    },
                                    properties: item,
                                    place_name: item.display_name,
                                    place_type: [item.type],
                                    text:
                                        item.display_name?.split(",")[0] ||
                                        item.display_name,
                                    center: [
                                        Number.parseFloat(item.lon),
                                        Number.parseFloat(item.lat),
                                    ] as [number, number],
                                    bbox: bbox,
                                } as unknown as GeocoderResult
                            })
                            return { features }
                        }
                        console.warn(
                            "Nominatim response is not an array:",
                            data,
                        )
                        return { features: [] }
                    }
                } catch (e) {
                    console.error("Geocoding error:", e)
                }
                return { features }
            },
        }

        this._geocoder = new MaplibreGeocoder(geocoderApi, {
            maplibregl: maplibregl,
            marker: props.marker,
            collapsed: props.collapsed,
            showResultsWhileTyping: true,
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

    onAdd(map: MapLibreMap): HTMLElement {
        this._map = map
        this._container = this._geocoder.onAdd(map as unknown as maplibregl.Map)
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
