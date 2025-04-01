import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson"
import throttle from "lodash.throttle"
import { type Dispatch, type SetStateAction, useEffect, useState } from "react"
import { Source, useMap } from "react-map-gl"
import { generateFeatureClass } from "./atlas-functions"
import type { FieldsAvailableUrlType } from "./atlas.d"

export function FieldsSourceNotClickable({
    id,
    fieldsData,
    children,
}: { id: string; fieldsData: FeatureCollection; children: JSX.Element }) {
    return (
        <Source id={id} type="geojson" data={fieldsData}>
            {children}
        </Source>
    )
}

export function FieldsSourceSelected({
    id,
    availableLayerId,
    fieldsData,
    setFieldsData,
    children,
}: {
    id: string
    availableLayerId: string
    fieldsData: FeatureCollection
    setFieldsData: React.Dispatch<
        React.SetStateAction<FeatureCollection>
    > | null
    children: JSX.Element
}) {
    const { current: map } = useMap()

    useEffect(() => {
        function clickOnMap(evt) {
            if (!map) return

            const features = map.queryRenderedFeatures(evt.point, {
                layers: [availableLayerId],
            })
            console.log(features)

            if (features.length > 0) {
                handleFieldClick(features[0], setFieldsData)
            }
        }

        if (map) {
            map.once("click", clickOnMap)
            return () => {
                map.off("click", clickOnMap)
            }
        }
    }, [map, fieldsData, availableLayerId, setFieldsData])

    return (
        <Source id={id} type="geojson" data={fieldsData}>
            {children}
        </Source>
    )
}

function handleFieldClick(
    feature: GeoJSON.Feature<Geometry, GeoJsonProperties>,
    setSelectedFieldsData: Dispatch<
        SetStateAction<FeatureCollection<Geometry, GeoJsonProperties>>
    >,
) {
    const fieldData = {
        type: feature.type,
        geometry: feature.geometry,
        properties: feature.properties,
    }

    setSelectedFieldsData((prevFieldsData) => {
        const isAlreadySelected = prevFieldsData.features.some(
            (f) =>
                f.properties.b_id_source === fieldData.properties.b_id_source,
        )

        if (isAlreadySelected) {
            return {
                ...prevFieldsData,
                features: prevFieldsData.features.filter(
                    (f) =>
                        f.properties.b_id_source !==
                        fieldData.properties.b_id_source,
                ),
            }
        }

        return {
            ...prevFieldsData,
            features: [...prevFieldsData.features, fieldData],
        }
    })
}

export function FieldsSourceAvailable({
    id,
    url,
    zoomLevelFields,
    children,
}: {
    id: string
    url: FieldsAvailableUrlType
    zoomLevelFields: number
    children: JSX.Element
}) {
    if (!url) return null

    const { current: map } = useMap()
    const [data, setData] = useState(generateFeatureClass())

    useEffect(() => {
        async function loadData() {
            if (map) {
                const zoom = map.getZoom()

                if (zoom && zoom > zoomLevelFields) {
                    const bounds = map.getBounds()

                    if (bounds) {
                        const [[minX, minY], [maxX, maxY]] = bounds.toArray()
                        const bbox = {
                            minX: 0.9999 * minX,
                            maxX: 1.0001 * maxX,
                            minY: 0.9999 * minY,
                            maxY: 1.0001 * maxY,
                        }
                        try {
                            const iter = deserialize(url, bbox)

                            let i = 0
                            const featureClass = generateFeatureClass()

                            for await (const feature of iter) {
                                featureClass.features.push({
                                    ...feature,
                                    id: i,
                                })
                                i += 1
                            }
                            setData(featureClass)
                        } catch (error) {
                            console.error("Failed to deserialize data: ", error)
                            setData(generateFeatureClass())
                        }
                    } else {
                        setData(generateFeatureClass())
                    }
                } else {
                    setData(generateFeatureClass())
                }
            }
        }

        const throttledLoadData = throttle(loadData, 250, { trailing: true })

        if (map) {
            map.on("moveend", throttledLoadData)
            map.on("zoomend", throttledLoadData)
            map.once("load", loadData)
            return () => {
                map.off("moveend", throttledLoadData)
                map.off("zoomend", throttledLoadData)
            }
        }
    }, [map, url, zoomLevelFields])

    return (
        <Source id={id} type="geojson" data={data}>
            {children}
        </Source>
    )
}
