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
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    Fragment,
} from "react"
import {
    Layer,
    Map as MapGL,
    Source,
    type MapRef,
    type ViewState,
    type ViewStateChangeEvent,
    type MapLayerMouseEvent,
} from "react-map-gl/maplibre"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { Controls } from "~/components/blocks/atlas/atlas-controls"
import { ElevationLegend } from "~/components/blocks/atlas/atlas-legend"
import { FieldsPanelHover } from "~/components/blocks/atlas/atlas-panels"
import { getFieldsStyle } from "~/components/blocks/atlas/atlas-styles"
import { ZOOM_LEVEL_FIELDS } from "~/components/blocks/atlas/atlas"
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
function polygonIntersectsPolygon(
    poly1: [number, number][],
    poly2: [number, number][],
) {
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
    cogUrlHillshade: string | null
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
    const [isUpdating, setIsUpdating] = useState(false)
    const [legendMin, setLegendMin] = useState<number>(-5)
    const [legendMax, setLegendMax] = useState<number>(50)
    const [hoverElevation, setHoverElevation] = useState<number | null>(null)
    const [showFields, setShowFields] = useState(true)
    const [showElevation, setShowElevation] = useState(true)

    const fieldsSavedId = "fieldsSaved"
    const fieldsSavedStyle = getFieldsStyle(fieldsSavedId)
    const fieldsSavedOutlineStyle = getFieldsStyle("fieldsSavedOutline")
    const layerLayout = { visibility: showFields ? "visible" : "none" } as const

    const onToggleElevation = useCallback(() => {
        setShowElevation((prev) => !prev)
    }, [])

    // ViewState logic
    const initialViewState = getViewState(fields)
    const [viewState, setViewState] = useState<ViewState>(() => {
        if (typeof window !== "undefined") {
            const savedViewState = sessionStorage.getItem("mapViewState")
            if (savedViewState) {
                try {
                    return JSON.parse(savedViewState)
                } catch {
                    sessionStorage.removeItem("mapViewState")
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
        sessionStorage.setItem("mapViewState", JSON.stringify(viewState))
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
            }
        }
        fetchIndex()
    }, [])

    // Function to update visible tiles
    const updateVisibleTiles = useCallback(async () => {
        if (!mapRef.current || !indexData) return

        const bounds = mapRef.current.getBounds()
        const zoom = mapRef.current.getZoom()

        // If zoomed out, clear active tiles to save resources (WMS will take over)
        if (zoom < 13) {
            if (activeTiles.length > 0) {
                setActiveTiles([])
            }
            return
        }

        setIsUpdating(true)
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
            // Optimization: limit to e.g. 24 tiles to avoid overload
            const visibleFeatures = indexData.features
                .filter((f) => {
                    if (!f.geometry || f.geometry.type !== "Polygon")
                        return false
                    const ring = (f.geometry as any).coordinates[0]
                    return polygonIntersectsPolygon(rdCoords, ring)
                })
                .slice(0, 24)

            // Calculate global min/max for the viewport by sampling
            const samplePoints: { lng: number; lat: number }[] = []
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
            const values = await Promise.all(
                samplePoints.map(async (p) => {
                    try {
                        const rdP = proj4("EPSG:28992").forward([
                            p.lng,
                            p.lat,
                        ]) as [number, number]
                        // Find which tile contains this point
                        const feature = visibleFeatures.find((f) => {
                            if (!f.geometry || f.geometry.type !== "Polygon")
                                return false
                            const ring = (f.geometry as any).coordinates[0]
                            return isPointInPolygon(rdP, ring)
                        })
                        if (feature?.properties) {
                            const url =
                                feature.properties.url ||
                                feature.properties.href ||
                                feature.properties.download_url
                            if (url) {
                                // Requesting location value
                                const vals = await locationValues(url, {
                                    longitude: p.lng,
                                    latitude: p.lat,
                                })
                                if (
                                    vals &&
                                    vals.length > 0 &&
                                    !isNaN(vals[0]) &&
                                    vals[0] > -100 &&
                                    vals[0] < 1000
                                ) {
                                    return vals[0]
                                }
                            }
                        }
                    } catch {
                        // Ignore errors for individual points
                    }
                    return null
                }),
            )

            const validValues = values.filter((v) => v !== null) as number[]
            if (validValues.length > 0) {
                min = Math.min(...validValues)
                max = Math.max(...validValues)
            } else {
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
            const colorParam = `#color:BrewerSpectral11,${min},${max},-c`

            const newTiles: ActiveTile[] = []
            for (const feature of visibleFeatures) {
                if (!feature.properties) continue
                const url =
                    feature.properties.url ||
                    feature.properties.href ||
                    feature.properties.download_url

                if (!url) continue
                const id = feature.properties.kaartbladNr || url

                newTiles.push({
                    id,
                    url,
                    cogUrl: `cog://${url}${colorParam}`,
                    cogUrlHillshade: `cog://${url}#dem`,
                })
            }

            const keyNew = newTiles
                .map((t) => t.cogUrl)
                .sort()
                .join("|")

            setActiveTiles(newTiles)
        } catch (e) {
            console.error("Error updating visible tiles:", e)
        } finally {
            setIsUpdating(false)
        }
    }, [indexData, activeTiles])

    // Throttle updates
    const updateRef = useRef(updateVisibleTiles)
    useEffect(() => {
        updateRef.current = updateVisibleTiles
    }, [updateVisibleTiles])

    const throttledUpdate = useMemo(
        () =>
            throttle(() => updateRef.current(), 500, {
                leading: true,
                trailing: true,
            }),
        [],
    )

    // Initial update when map loads or index loads
    useEffect(() => {
        const timer = setTimeout(() => {
            throttledUpdate()
        }, 1000)
        return () => clearTimeout(timer)
    }, [throttledUpdate])

    // Refs for state accessible in throttled functions
    const stateRef = useRef({ indexData, activeTiles })
    useEffect(() => {
        stateRef.current = { indexData, activeTiles }
    }, [indexData, activeTiles])

    // Handle hover to show elevation value
    const handleMouseMove = useMemo(
        () =>
            throttle(async (event: MapLayerMouseEvent) => {
                const { indexData, activeTiles } = stateRef.current

                if (!mapRef.current || mapRef.current.getZoom() < 13) {
                    setHoverElevation(null)
                    return
                }

                if (!indexData || activeTiles.length === 0) return

                const { lng, lat } = event.lngLat

                try {
                    const rdP = proj4("EPSG:28992").forward([lng, lat]) as [
                        number,
                        number,
                    ]

                    const feature = indexData.features.find((f) => {
                        if (!f.geometry || f.geometry.type !== "Polygon")
                            return false
                        const ring = (f.geometry as any).coordinates[0]
                        return isPointInPolygon(rdP, ring)
                    })

                    if (feature?.properties) {
                        const url =
                            feature.properties.url ||
                            feature.properties.href ||
                            feature.properties.download_url
                        if (url) {
                            const values = await locationValues(url, {
                                longitude: lng,
                                latitude: lat,
                            })
                            if (
                                values &&
                                values.length > 0 &&
                                !isNaN(values[0])
                            ) {
                                setHoverElevation(values[0])
                                return
                            }
                        }
                    }
                    setHoverElevation(null)
                } catch (e) {
                    setHoverElevation(null)
                }
            }, 100),
        [],
    )

    return (
        <div className="relative h-full w-full">
            <MapGL
                ref={mapRef}
                {...viewState}
                style={{ height: "calc(100vh - 64px)", width: "100%" }}
                interactive={true}
                mapStyle={mapStyle}
                mapLib={maplibregl}
                onMove={onViewportChange}
                onMoveEnd={throttledUpdate}
                onLoad={throttledUpdate}
                onMouseMove={showElevation ? handleMouseMove : undefined}
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
                    showFields={showFields}
                    onToggleFields={() => setShowFields(!showFields)}
                    showElevation={showElevation}
                    onToggleElevation={onToggleElevation}
                />

                {/* WMS Overview Layer (Zoom < 13) */}
                {viewState.zoom < 13 && showElevation && (
                    <Source
                        id="ahn-wms"
                        type="raster"
                        tiles={[
                            "https://service.pdok.nl/rws/ahn/wms/v1_0?service=WMS&request=GetMap&layers=dtm_05m&styles=&format=image/png&transparent=true&version=1.3.0&width=256&height=256&crs=EPSG:3857&bbox={bbox-epsg-3857}",
                        ]}
                        tileSize={256}
                        attribution="&copy; <a href='https://www.pdok.nl/'>PDOK</a>, <a href='https://www.ahn.nl/'>AHN</a>"
                    >
                        <Layer
                            id="ahn-wms-layer"
                            type="raster"
                            paint={{ "raster-opacity": 0.8 }}
                            beforeId="fieldsSavedOutline"
                        />
                    </Source>
                )}

                {/* Render Active Tiles (Zoom >= 13) */}
                {viewState.zoom >= 13 &&
                    showElevation &&
                    activeTiles.map((tile) => (
                        <Fragment key={tile.id}>
                            <Source
                                id={`ahn-cog-${tile.id}`}
                                type="raster"
                                url={tile.cogUrl!}
                                tileSize={256}
                                bounds={[3.3, 50.7, 7.2, 53.7]}
                                minzoom={0}
                                maxzoom={24}
                                attribution="&copy; <a href='https://www.pdok.nl/'>PDOK</a>, <a href='https://www.ahn.nl/'>AHN</a>"
                            >
                                <Layer
                                    id={`ahn-layer-${tile.id}`}
                                    type="raster"
                                    paint={{ "raster-opacity": 1 }}
                                    beforeId="fieldsSavedOutline"
                                />
                            </Source>
                            <Source
                                id={`ahn-dem-${tile.id}`}
                                type="raster-dem"
                                url={tile.cogUrlHillshade!}
                                tileSize={256}
                                bounds={[3.3, 50.7, 7.2, 53.7]}
                                minzoom={0}
                                maxzoom={16}
                            >
                                <Layer
                                    id={`ahn-hillshade-${tile.id}`}
                                    type="hillshade"
                                    paint={{
                                        "hillshade-exaggeration": 0.3,
                                        "hillshade-shadow-color": "#000000",
                                        "hillshade-highlight-color": "#ffffff",
                                        "hillshade-accent-color": "#000000",
                                    }}
                                    beforeId="fieldsSavedOutline"
                                />
                            </Source>
                        </Fragment>
                    ))}

                {/* Fields Overlay (Saved Fields) */}
                {fields && (
                    <Source id={fieldsSavedId} type="geojson" data={fields}>
                        {/* Outline Layer - Visual */}
                        <Layer
                            {...({
                                ...fieldsSavedOutlineStyle,
                                layout: layerLayout,
                            } as any)}
                        />
                        {/* Fill Layer - Invisible but Clickable/Hoverable */}
                        <Layer
                            {...({
                                ...fieldsSavedStyle,
                                layout: layerLayout,
                            } as any)}
                        />
                    </Source>
                )}

                <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
                    <ElevationLegend
                        min={legendMin}
                        max={legendMax}
                        loading={isUpdating}
                        hoverValue={hoverElevation}
                        showScale={viewState.zoom >= 13 && showElevation}
                    />
                    <div className="grid gap-4 w-[350px]">
                        <FieldsPanelHover
                            zoomLevelFields={ZOOM_LEVEL_FIELDS}
                            layer={fieldsSavedId}
                        />
                    </div>
                </div>
            </MapGL>
        </div>
    )
}
