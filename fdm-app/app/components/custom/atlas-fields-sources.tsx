import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"
import type { FeatureCollection } from "geojson"
import throttle from "lodash.throttle"
import { useEffect, useState } from "react"
import { Source, useMap } from "react-map-gl"

export function AvailableFieldsSource({
    url,
    zoomLevelFields,
    children,
}: {
    url: fieldsAvailableUrlType
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
                    const bounds = map.getBounds(0.8)

                    if (bounds) {
                        const [[minX, minY], [maxX, maxY]] = bounds.toArray()
                        const bbox = {
                            minX,
                            maxX,
                            minY,
                            maxY,
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
        <Source id="availableFields" type="geojson" data={data}>
            {children}
        </Source>
    )
}

export function FieldsSource({
    id,
    fieldsData,
    setFieldsData,
    children,
}: {
    id: string
    fieldsData: FeatureCollection
    setFieldsData: React.Dispatch<
        React.SetStateAction<FeatureCollection>
    > | null
    children: JSX.Element
}) {
    const { current: map } = useMap()

    if (!setFieldsData) {
        useEffect(() => {
            function clickOnMap(evt) {
                if (!map) return

                const features = map.queryRenderedFeatures(evt.point, {
                    layers: ["available-fields-fill"],
                })

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
        }, [map, setFieldsData])
    }

    return (
        <Source id={id} type="geojson" data={fieldsData}>
            {children}
        </Source>
    )
}

function handleFieldClick(feature, setFieldsData) {
    const fieldData = {
        type: feature.type,
        geometry: feature.geometry,
        properties: feature.properties,
    }

    setFieldsData((prevFieldsData) => {
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

export function generateFeatureClass(): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: [],
    }
}

export type fieldsAvailableUrlType = string | undefined
