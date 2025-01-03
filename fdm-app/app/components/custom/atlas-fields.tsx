import { Map as MapGL, useMap, GeolocateControl, NavigationControl, Source, Layer } from 'react-map-gl'
import 'mapbox-gl/dist/mapbox-gl.css';
import geojsonExtent from '@mapbox/geojson-extent'
import type { FeatureCollection } from "geojson";
import { useEffect, useMemo, useState } from 'react';
import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js';
import type { LayerProps } from 'react-map-gl';
import throttle from "lodash.throttle";
import xxhash from "xxhash-wasm";
import FieldsPanel from './atlas-fields-panel';

const { create64 } = await xxhash();

export function AtlasFields({
    interactive,
    mapboxToken,
    mapStyle,
    fieldsSelected,
    fieldsAvailableUrl
}: MapFieldsProps) {
    const [selectedFieldsData, setSelectedFieldsData] = useState(generateFeatureClass());

    // Set controls
    let Controls = <></>
    if (interactive === true) {
        Controls = <div><GeolocateControl /><NavigationControl /></div>
    }

    // Set viewState
    const initialBounds = [3.1, 50.7, 7.2, 53.6];
    const [viewState, setViewState] = useState({
        bounds: initialBounds,
        fitBoundsOptions: {
            padding: 0
        }
    });
    if (fieldsSelected) {
        const bounds = useMemo(() => {
            try {
                return geojsonExtent(fieldsSelected);
            } catch (error) {
                console.error('Failed to calculate bounds:', error);
                return initialBounds;
            }
        }, [fieldsSelected]);
        setViewState({
            bounds: bounds,
            fitBoundsOptions: {
                padding: 10
            }
        })
    }

    return (
        <>
            <MapGL
                {...viewState}
                style={{ height: "calc(100vh - 64px - 123px)" }}
                interactive={interactive}
                mapStyle={mapStyle}
                mapboxAccessToken={mapboxToken}
                // onClick={evt => handleClickOnField(evt)}
                interactiveLayerIds={['available-fields-fill', 'selected-fields-fill']}
            >

                {Controls}
                <SelectedFieldsSource selectedFieldsData={selectedFieldsData} setSelectedFieldsData={setSelectedFieldsData} >
                    <Layer {...selectedFieldsStyle} />
                </SelectedFieldsSource>
                <AvailableFieldsSource url={fieldsAvailableUrl} >
                    <Layer {...availableFieldsFillStyle} />
                    {/* <Layer {...availableFieldsLineStyle} /> */}
                </AvailableFieldsSource>
                <FieldsPanel fields={selectedFieldsData} />
            </MapGL>

        </>

    )
}

const generateFeatureClass = () => ({
    type: "FeatureCollection",
    features: []
});


function AvailableFieldsSource({ url, children }: { url: fieldsAvailableUrlType, children: JSX.Element }) {

    if (!url) throw new Error("url is required");

    const { current: map } = useMap();
    const [data, setData] = useState(generateFeatureClass());

    useEffect(() => {
        async function loadData() {

            if (map) {

                const zoom = map.getZoom()

                if (zoom && zoom > 12) {
                    const bounds = map.getBounds(0.8)

                    if (bounds) {
                        const [[minX, minY], [maxX, maxY]] = bounds.toArray();
                        const bbox = {
                            minX,
                            maxX,
                            minY,
                            maxY
                        };
                        const iter = deserialize(url, bbox);

                        let i = 0;
                        const featureClass = generateFeatureClass();

                        for await (let feature of iter) {
                            featureClass.features.push({ ...feature, id: i });
                            i += 1;
                        }
                        console.log(featureClass)
                        setData(featureClass);
                    } else {
                        setData(generateFeatureClass())
                    }
                } else {
                    setData(generateFeatureClass())
                }
            }
        }

        const throttledLoadData = throttle(loadData, 250, { trailing: true });

        if (map) {
            map.on("moveend", throttledLoadData);
            map.on("zoomend", throttledLoadData);
            map.once("load", loadData);
            return () => {
                map.off("moveend", throttledLoadData);
                map.off("zoomend", throttledLoadData);
            };
        }

    }, []);

    return (
        <Source id="availableFields" type="geojson" data={data}>
            {children}
        </Source>
    );
}

function SelectedFieldsSource({ selectedFieldsData, setSelectedFieldsData, children }: { selectedFieldsData: FeatureCollection, setSelectedFieldsData: React.Dispatch<React.SetStateAction<FeatureCollection>>, children: JSX.Element }) {

    const { current: map } = useMap();

    useEffect(() => {
        function clickOnMap(evt) {
            // console.log('hoi')

            if (map) {

                const features = map.queryRenderedFeatures(evt.point, {
                    layers: ['available-fields-fill'] // Specify the layer ID
                });
                // console.log(features);

                if (features.length > 0) {

                    // console.log(features[0].properties);
                    const feature = {
                        type: features[0].type,
                        geometry: features[0].geometry,
                        properties: features[0].properties
                    }
                    const featureWithId = {
                        ...feature,
                        id: create64().update(JSON.stringify(features[0])).digest().toString()
                    }

                    setSelectedFieldsData(prevFieldsData => {                      

                        // Check if field is not already selected by comparing ids
                        const isAlreadySelected = prevFieldsData.features.some(f => f.id === featureWithId.id);
                        if (isAlreadySelected) {
                            // Remove field from selection
                            return {
                                ...prevFieldsData,
                                features: prevFieldsData.features.filter(f => f.id !== featureWithId.id)
                            };
                        } else {
                            // Add field to selection
                            return {
                                ...prevFieldsData,
                                features: [...prevFieldsData.features, featureWithId]
                            };
                        }

                    })

                } else {
                    console.log("No features found at clicked point.");
                }

                console.log(selectedFieldsData)
            }
        }

        if (map) {
            map.on("click", clickOnMap);
            return () => {
                map.off("click", clickOnMap);
            };
        }

    }, []);

    return (
        <Source id="selectedFields" type="geojson" data={selectedFieldsData}>
            {children}
        </Source>
    );
}



const availableFieldsFillStyle: LayerProps & { id: string; type: string; paint: { 'fill-color': string; 'fill-opacity': number; 'fill-outline-color': string; } } = {
    id: 'available-fields-fill',
    type: 'fill',
    paint: {
        'fill-color': "#93c5fd",
        'fill-opacity': 0.5,
        'fill-outline-color': "#1e3a8a"
    },
};
const availableFieldsLineStyle = {
    id: 'available-fields-line',
    type: 'line',
    paint: {
        'line-color': "#1e3a8a",
        'line-opacity': 0.8,
        'line-width': 2,
    }
};
const selectedFieldsStyle: LayerProps & { id: string; type: string; paint: { 'fill-color': string; 'fill-opacity': number; 'fill-outline-color': string; } } = {
    id: 'selected-fields-fill',
    type: 'fill',
    paint: {
        'fill-color': "#fca5a5",
        'fill-opacity': 0.8,
        'fill-outline-color': "#1e3a8a"
    }
};

type fieldsAvailableUrlType = string | undefined

interface MapFieldsProps {
    interactive: boolean
    mapboxToken: string
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12"
    fieldsSelected: FeatureCollection | null
    fieldsAvailableUrl: fieldsAvailableUrlType
}
