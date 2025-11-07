import { getFields } from "@svenvw/fdm-core"
import type { FeatureCollection } from "geojson"
import { useCallback, useEffect, useRef, useState } from "react"
import {
    Layer,
    Map as MapGL,
    Source,
    type MapRef,
    type ViewState,
    type ViewStateChangeEvent,
} from "react-map-gl/mapbox"
import type { MetaFunction } from "react-router"
import { type LoaderFunctionArgs, useLoaderData } from "react-router"
import { fromUrl } from 'geotiff';
import proj4 from 'proj4';
import throttle from 'lodash.throttle';
import { scaleSequential } from 'd3-scale';
import { interpolateTurbo } from 'd3-scale-chromatic';
import { ZOOM_LEVEL_FIELDS } from "~/components/blocks/atlas/atlas"
import { Controls } from "~/components/blocks/atlas/atlas-controls"
import { LegendElevation } from "~/components/blocks/atlas/atlas-legend-elevation"
import { getViewState } from "~/components/blocks/atlas/atlas-viewstate"
import { getMapboxStyle, getMapboxToken } from "~/integrations/mapbox"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

export const meta: MetaFunction = () => {
    return [
        { title: `Hoogte - Kaart | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk hoogtegegevens op de kaart.",
        },
    ]
}

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        const session = await getSession(request)
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        let featureCollection: FeatureCollection | undefined
        if (b_id_farm && b_id_farm !== "undefined") {
            const fields = await getFields(
                fdm,
                session.principal_id,
                b_id_farm,
                timeframe,
            )
            const features = fields.map((field) => ({
                type: "Feature" as const,
                properties: {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    b_area: Math.round(field.b_area * 10) / 10,
                    b_lu_name: field.b_lu_name,
                    b_id_source: field.b_id_source,
                },
                geometry: field.b_geometry,
            }))

            featureCollection = {
                type: "FeatureCollection",
                features: features,
            }
        }

        const mapboxToken = getMapboxToken()
        const mapboxStyle = getMapboxStyle()

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

export default function FarmAtlasElevationBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const [cogIndex, setCogIndex] = useState([])
    const [elevationData, setElevationData] = useState<{
        imageData: ImageData | null,
        min: number,
        max: number,
        palette: any,
        pixelData: { data: Float32Array, width: number, height: number } | null,
    }>({ imageData: null, min: 0, max: 0, palette: [], pixelData: null });
    const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);
    const [loading, setLoading] = useState(false);
    const [imageUrl, setImageUrl] = useState<string>("");
    const workerRef = useRef<Worker | null>(null);
    const mapRef = useRef<MapRef | null>(null);

    useEffect(() => {
        workerRef.current = new Worker(new URL('../elevation.worker.ts', import.meta.url));
        workerRef.current.onmessage = (event) => {
            if (event.data.error) {
                // Handle error
                setLoading(false);
                return;
            }
            const { imageData, min, max, paletteDomain, paletteInterpolator, pixelData } = event.data;
            const palette = scaleSequential(interpolateTurbo).domain(paletteDomain);
            setElevationData({ imageData, min, max, palette, pixelData });
            setLoading(false);
        };
        return () => {
            workerRef.current?.terminate();
        };
    }, []);

    useEffect(() => {
        fetch("https://service.pdok.nl/rws/ahn/atom/downloads/dtm_05m/kaartbladindex.json")
            .then(res => res.json())
            .then(index => setCogIndex(index.features));
    }, []);

    const updateMapData = useCallback(throttle((bounds) => {
        if (!cogIndex.length || !workerRef.current) return;
        setLoading(true);
        workerRef.current.postMessage({ bounds: bounds.toArray().flat(), cogIndex });
    }, 300), [cogIndex]);

    function createImageUrl(imageData: ImageData) {
        const canvas = document.createElement("canvas");
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.putImageData(imageData, 0, 0);
            return new Promise(resolve => canvas.toBlob(blob => resolve(URL.createObjectURL(blob!))));
        }
        return Promise.resolve("");
    }

    const initialViewState = getViewState(loaderData.savedFields)

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
        setViewState(event.viewState);
        updateMapData(event.target.getBounds());
    }, [updateMapData]);

    useEffect(() => {
        if (elevationData.imageData) {
            createImageUrl(elevationData.imageData).then(url => setImageUrl(url as string));
        }
    }, [elevationData.imageData]);

    const isFirstRender = useRef(true)
    const initialLoadDone = useRef(false);

    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false
            return
        }
        sessionStorage.setItem("mapViewState", JSON.stringify(viewState))
    }, [viewState])

    useEffect(() => {
        if (mapRef.current && cogIndex.length > 0 && !initialLoadDone.current) {
            initialLoadDone.current = true;
            updateMapData(mapRef.current.getBounds());
        }
    }, [cogIndex, updateMapData]);

    return (
        <MapGL
            ref={mapRef}
            {...viewState}
            style={{ height: "calc(100vh - 64px)", width: "100%" }}
            interactive={true}
            mapStyle={loaderData.mapboxStyle}
            mapboxAccessToken={loaderData.mapboxToken}
            interactiveLayerIds={[]}
            onMove={onViewportChange}
            onMouseMove={(e) => {
                if (!elevationData.pixelData || !mapRef.current) return;
                const { lng, lat } = e.lngLat;
                const rdProjection = proj4("EPSG:4326", "EPSG:28992");
                const [x, y] = rdProjection.forward([lng, lat]);
                const { data, width, height } = elevationData.pixelData;
                const bounds = mapRef.current.getBounds();
                const [minLon, minLat, maxLon, maxLat] = bounds.toArray().flat();
                const minRD = rdProjection.forward([minLon, minLat]);
                const maxRD = rdProjection.forward([maxLon, maxLat]);
                const rdWidth = maxRD[0] - minRD[0];
                const rdHeight = maxRD[1] - minRD[1];
                const xPct = (x - minRD[0]) / rdWidth;
                const yPct = (y - minRD[1]) / rdHeight;
                const xPx = Math.floor(width * xPct);
                const yPx = Math.floor(height * (1 - yPct));
                const index = (yPx * width + xPx);
                const value = data[index];
                setHoverValue(value);
            }}
        >
            {loading && (
                <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md">
                    Laden...
                </div>
            )}
            {!loading && !elevationData.imageData && (
                <div className="absolute top-4 left-4 bg-white p-2 rounded-md shadow-md">
                    De AHN service is momenteel niet beschikbaar.
                </div>
            )}
            <LegendElevation
                min={elevationData.min}
                max={elevationData.max}
                palette={elevationData.palette}
                hoverValue={hoverValue}
            />
            {imageUrl && (
                <Source
                    id="elevation"
                    type="image"
                    url={imageUrl}
                    coordinates={[
                        mapRef.current.getBounds().getNorthWest().toArray(),
                        mapRef.current.getBounds().getNorthEast().toArray(),
                        mapRef.current.getBounds().getSouthEast().toArray(),
                        mapRef.current.getBounds().getSouthWest().toArray(),
                    ]}
                >
                    <Layer id="elevation" type="raster" />
                </Source>
            )}
            <Controls
                onViewportChange={({ longitude, latitude, zoom }) =>
                    setViewState((currentViewState) => ({
                        ...currentViewState,
                        longitude,
                        latitude,
                        zoom,
                        pitch: currentViewState.pitch,
                        bearing: currentViewState.bearing,
                    }))
                }
            />
        </MapGL>
    )
}
