import { useEffect, useState } from "react"
import { Source, useMap } from "react-map-gl"
import { generateFeatureClass } from "./atlas-functions"
import type { fieldsAvailableUrlType } from "./atlas.d"
import type { FeatureCollection } from "geojson"
import throttle from "lodash.throttle"
import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"

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

    if (!setFieldsData) {
        useEffect(() => {
            function clickOnMap(evt) {
                if (!map) return

                const features = map.queryRenderedFeatures(evt.point, {
                    layers: [availableLayerId],
                })

                if (features.length > 0) {
                    // handleFieldClick(features[0], setFieldsData)
                }
            }

            if (map) {
                map.once("click", clickOnMap)
                return () => {
                    map.off("click", clickOnMap)
                }
            }
        }, [map, setFieldsData, availableLayerId])
    }

    return (
        <Source id={id} type="geojson" data={fieldsData}>
            {children}
        </Source>
    )
}

export function FieldsSourceAvailable({
    id,
    url,
    zoomLevelFields,
    children,
}: {
    id: string
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
                    const bounds = map.getBounds()

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
        <Source id={id} type="geojson" data={data}>
            {children}
        </Source>
    )
}
