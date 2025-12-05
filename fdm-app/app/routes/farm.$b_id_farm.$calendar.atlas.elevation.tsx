import {
    cogProtocol,
    getCogMetadata,
    locationValues,
    proj4,
} from "@geomatico/maplibre-cog-protocol"
import { getFields } from "@svenvw/fdm-core"
import throttle from "lodash.throttle"
import type { FeatureCollection } from "geojson"
import maplibregl from "maplibre-gl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
    Layer,
    Map as MapGL,
    Source,
    type MapRef,
    type ViewState,
    type ViewStateChangeEvent,
} from "react-map-gl/maplibre"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { Controls } from "~/components/blocks/atlas/atlas-controls"
import { ElevationLegend } from "~/components/blocks/atlas/atlas-legend"
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { getMapStyle } from "~/integrations/map"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Register the projection for RD New (EPSG:28992)
proj4.defs(
    "EPSG:28992",
    "+proj=sterea +lat_0=52.15616055555555 +lon_0=5.38763888888889 +k=0.9999079 +x_0=155000 +y_0=463000 +ellps=bessel +towgs84=565.2369,50.0087,465.658,-0.406857330322398,0.350732676542563,-1.8703473836068,4.0812 +units=m +no_defs",
)

// Register the COG protocol
maplibregl.addProtocol("cog", cogProtocol)

// Helper: Simple Point in Polygon for RD coordinates (Ray Casting)
function isPointInPolygon(point: [number, number], vs: [number, number][]) {
    const x = point[0]
    const y = point[1]
    let inside = false
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        const xi = vs[i][0]
        const yi = vs[i][1]
        const xj = vs[j][0]
        const yj = vs[j][1]
        const intersect =
            yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
        if (intersect) inside = !inside
    }
    return inside
}

// Helper: Check if polygon intersects polygon (simple AABB check for index speed, then detail?)
// For now, we just check if any point of tile is in view or view in tile?
// Simpler: Convert Viewport to RD Polygon, check intersection with Tile Polygon (also RD).
function polygonIntersectsPolygon(poly1: [number, number][], poly2: [number, number][]) {
    // Simplified: Check if any point of poly1 is in poly2 OR any point of poly2 is in poly1
    // This is not 100% robust for crossing polygons but good enough for tiles
    for (const p of poly1) if (isPointInPolygon(p, poly2)) return true
    for (const p of poly2) if (isPointInPolygon(p, poly1)) return true
    return false
}

interface ActiveTile {
    id: string
    url: string
    cogUrl: string | null
}

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Hoogte - Kaart | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk hoogtegegevens op de kaart.",
        },
    ]
}

/**
 * Loads farm field data for the elevation feature.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        const session = await getSession(request)
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        const featureCollection: FeatureCollection = {
            type: "FeatureCollection",
            features: fields.map((field) => ({
                type: "Feature",
                properties: {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    b_area: Math.round(field.b_area * 10) / 10,
                },
                geometry: field.b_geometry,
            })),
        }

        const mapStyle = getMapStyle("satellite")

        return {
            fields: featureCollection,
            mapStyle,
            calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmAtlasElevationBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fields = loaderData.fields
    const mapStyle = loaderData.mapStyle

    const mapRef = useRef<MapRef>(null)

    // State
    const [indexData, setIndexData] = useState<FeatureCollection | null>(null)
    const [activeTiles, setActiveTiles] = useState<ActiveTile[]>([])
    const [isLoadingCog, setIsLoadingCog] = useState(true)
    const [isUpdating, setIsUpdating] = useState(false)
    const [legendMin, setLegendMin] = useState<number>(-5)
    const [legendMax, setLegendMax] = useState<number>(50)

    // ViewState logic
    const initialViewState = getViewState(fields)
    const [viewState, setViewState] = useState<ViewState>(() => {
        if (typeof window !== "undefined") {
            const savedViewState = sessionStorage.getItem(
                "mapViewStateElevation",
            )
            if (savedViewState) {
                try {
                    return JSON.parse(savedViewState)
                } catch {
                    sessionStorage.removeItem("mapViewStateElevation")
                }
            }
        }
        return initialViewState as ViewState
    })

    const onViewportChange = useCallback((event: ViewStateChangeEvent) => {
        setViewState(event.viewState)
    }, [])

    // Save viewState
    const isFirstRender = useRef(true)
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        sessionStorage.setItem(
            "mapViewStateElevation",
            JSON.stringify(viewState),
        )
    }, [viewState])

    // Fetch COG Index once
    useEffect(() => {
        async function fetchIndex() {
            try {
                const response = await fetch(
                    "https://service.pdok.nl/rws/ahn/atom/downloads/dtm_05m/kaartbladindex.json",
                )
                if (!response.ok) throw new Error("Failed to fetch COG index")
                const data = (await response.json()) as FeatureCollection
                setIndexData(data)
            } catch (e) {
                console.error("Error fetching COG index:", e)
                setIsLoadingCog(false)
            }
        }
        fetchIndex()
    }, [])

    // Function to update visible tiles
    const updateVisibleTiles = useCallback(async () => {
        if (!mapRef.current || !indexData) return
        
        setIsUpdating(true)

        const bounds = mapRef.current.getBounds()
        const sw = bounds.getSouthWest()
        const ne = bounds.getNorthEast()
        const nw = bounds.getNorthWest()
        const se = bounds.getSouthEast()

        // Convert viewport corners to RD (EPSG:28992)
        // We catch projection errors if points are outside valid range
        try {
            const rdCoords = [
                proj4("EPSG:28992").forward([nw.lng, nw.lat]),
                proj4("EPSG:28992").forward([ne.lng, ne.lat]),
                proj4("EPSG:28992").forward([se.lng, se.lat]),
                proj4("EPSG:28992").forward([sw.lng, sw.lat]),
            ] as [number, number][]

            // Find intersecting tiles
            // Optimization: limit to e.g. 6 tiles to avoid overload
            const visibleFeatures = indexData.features.filter((f) => {
                if (!f.geometry || f.geometry.type !== "Polygon") return false
                const ring = (f.geometry as any).coordinates[0]
                return polygonIntersectsPolygon(rdCoords, ring)
            }).slice(0, 6)

            // Calculate global min/max for the viewport by sampling
            const samplePoints: {lng: number, lat: number}[] = []
            const gridSize = 4 // 4x4 = 16 points
            for (let i = 0; i <= gridSize; i++) {
                for (let j = 0; j <= gridSize; j++) {
                    const lng = sw.lng + (ne.lng - sw.lng) * (i / gridSize)
                    const lat = sw.lat + (ne.lat - sw.lat) * (j / gridSize)
                    samplePoints.push({ lng, lat })
                }
            }

            let min = 1000
            let max = -1000
            
            // Gather values for samples
            const values = await Promise.all(samplePoints.map(async (p) => {
                const rdP = proj4("EPSG:28992").forward([p.lng, p.lat]) as [number, number]
                // Find which tile contains this point
                const feature = visibleFeatures.find(f => {
                    if (!f.geometry || f.geometry.type !== "Polygon") return false
                    const ring = (f.geometry as any).coordinates[0]
                    return isPointInPolygon(rdP, ring)
                })
                if (feature && feature.properties) {
                     const url = feature.properties.url || feature.properties.href || feature.properties.download_url
                     if (url) {
                         try {
                             // Requesting location value
                             // Note: locationValues caches internal resources so it's efficient
                             const vals = await locationValues(url, { longitude: p.lng, latitude: p.lat })
                             if (vals && vals.length > 0 && !isNaN(vals[0]) && vals[0] > -100 && vals[0] < 1000) {
                                 return vals[0]
                             }
                         } catch {}
                     }
                }
                return null
            }))

            const validValues = values.filter(v => v !== null) as number[]
            if (validValues.length > 0) {
                min = Math.min(...validValues)
                max = Math.max(...validValues)
            } else {
                // Fallback if no data found (e.g. outside coverage or error)
                min = -5
                max = 50
            }

            // Ensure minimum contrast
            if (max - min < 1) {
                min -= 0.5
                max += 0.5
            }
            
            // Pad range slightly
            const range = max - min
            min -= range * 0.05
            max += range * 0.05
            
            setLegendMin(min)
            setLegendMax(max)

            // Format for color scale
            const colorParam = `#color:BrewerSpectral11,${min},${max},-`

            const newTiles: ActiveTile[] = []
            for (const feature of visibleFeatures) {
                if (!feature.properties) continue
                const url =
                    feature.properties.url ||
                    feature.properties.href ||
                    feature.properties.download_url
                
                if (!url) continue
                const id = feature.properties.kaartbladNr || url
                
                newTiles.push({ id, url, cogUrl: `cog://${url}${colorParam}` })
            }

            // Update state 
            setActiveTiles(newTiles)
            setIsLoadingCog(false)
            
        } catch (e) {
            console.error("Error updating visible tiles:", e)
        } finally {
            setIsUpdating(false)
        }
        
    }, [indexData, activeTiles])

    // Throttle updates
    // const throttledUpdate = useMemo(() => throttle(updateVisibleTiles, 500), [updateVisibleTiles]) 
    // Using throttle directly in render is tricky with deps.
    // We will use a ref to store the latest updateVisibleTiles and throttle that.
    
    const updateRef = useRef(updateVisibleTiles)
    useEffect(() => { updateRef.current = updateVisibleTiles }, [updateVisibleTiles])
    
    const throttledUpdate = useMemo(() => throttle(() => updateRef.current(), 500, { leading: true, trailing: true }), [])

    // Initial update
    useEffect(() => {
        const timer = setTimeout(() => {
            throttledUpdate()
        }, 1000)
        return () => clearTimeout(timer)
    }, [indexData])

    return (
        <div className="relative h-full w-full">
            {isLoadingCog && (
                <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2 rounded bg-background p-2 shadow">
                    <div className="flex items-center gap-2">
                        <LoadingSpinner />
                        <span className="text-sm">Hoogtekaart laden...</span>
                    </div>
                </div>
            )}

            <MapGL
                ref={mapRef}
                {...viewState}
                style={{ height: "calc(100vh - 64px)", width: "100%" }}
                interactive={true}
                mapStyle={mapStyle}
                mapLib={maplibregl}
                onMove={onViewportChange}
                onMoveEnd={throttledUpdate} // Update on move end
                onLoad={throttledUpdate}
            >
                <Controls
                    onViewportChange={({ longitude, latitude, zoom }) =>
                        setViewState((currentViewState) => ({
                            ...currentViewState,
                            longitude,
                            latitude,
                            zoom,
                        }))
                    }
                />

                {/* Render Active Tiles */}
                {activeTiles.map((tile) => (
                    <Source
                        key={tile.id}
                        id={`ahn-cog-${tile.id}`}
                        type="raster"
                        url={tile.cogUrl!}
                        tileSize={256}
                        bounds={[3.3, 50.7, 7.2, 53.7]}
                        minzoom={0}
                        maxzoom={24}
                    >
                        <Layer 
                            id={`ahn-layer-${tile.id}`} 
                            type="raster" 
                            paint={{ "raster-opacity": 1 }}
                        />
                    </Source>
                ))}

                <ElevationLegend 
                    min={legendMin} 
                    max={legendMax} 
                    loading={isUpdating}
                />
            </MapGL>
        </div>
    )
}
