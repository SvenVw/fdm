import { useEffect, useState } from 'react';
import { useMap, Source } from 'react-map-gl'
import { deserialize } from 'flatgeobuf/lib/mjs/geojson.js';
import type { FeatureCollection } from "geojson";
import throttle from "lodash.throttle";

export function AvailableFieldsSource({ url, zoomLevelFields, children }: { url: fieldsAvailableUrlType, zoomLevelFields: number, children: JSX.Element }) {

    if (!url) throw new Error("url is required");

    const { current: map } = useMap();
    const [data, setData] = useState(generateFeatureClass());

    useEffect(() => {
        async function loadData() {

            if (map) {

                const zoom = map.getZoom()

                if (zoom && zoom > zoomLevelFields) {
                    const bounds = map.getBounds(0.8)

                    if (bounds) {
                        const [[minX, minY], [maxX, maxY]] = bounds.toArray();
                        const bbox = {
                            minX,
                            maxX,
                            minY,
                            maxY
                        };
                        try {
                            const iter = deserialize(url, bbox);

                            let i = 0;
                            const featureClass = generateFeatureClass();

                            for await (let feature of iter) {
                                featureClass.features.push({ ...feature, id: i });
                                i += 1;
                            }
                            setData(featureClass);
                        } catch (error) {
                            console.error("Failed to deserialize data: ", error);
                            setData(generateFeatureClass());
                        }

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

export function SelectedFieldsSource({ selectedFieldsData, setSelectedFieldsData, children }: { selectedFieldsData: FeatureCollection, setSelectedFieldsData: React.Dispatch<React.SetStateAction<FeatureCollection>>, children: JSX.Element }) {

    const { current: map } = useMap();

    useEffect(() => {
        function clickOnMap(evt) {
            if (map) {

                const features = map.queryRenderedFeatures(evt.point, {
                    layers: ['available-fields-fill'] // Specify the layer ID
                });

                if (features.length > 0) {

                    // console.log(features[0].properties);
                    const feature = {
                        type: features[0].type,
                        geometry: features[0].geometry,
                        properties: features[0].properties
                    }

                    setSelectedFieldsData(prevFieldsData => {
                        // Check if field is not already selected by comparing ids
                        const isAlreadySelected = prevFieldsData.features.some(f => f.properties.b_id_source === feature.properties.b_id_source);
                        if (isAlreadySelected) {
                            // Remove field from selection
                            return {
                                ...prevFieldsData,
                                features: prevFieldsData.features.filter(f => f.properties.b_id_source !== feature.properties.b_id_source)
                            };
                        } else {
                            // Add field to selection
                            return {
                                ...prevFieldsData,
                                features: [...prevFieldsData.features, feature]
                            };
                        }
                    })
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

export function generateFeatureClass(): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: []
    }
};

export type fieldsAvailableUrlType = string | undefined