import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"
import type { FeatureCollection, GeoJsonProperties, Geometry } from "geojson"
import throttle from "lodash.throttle"
import centroid from "@turf/centroid"
import {
    type Dispatch,
    type JSX,
    type SetStateAction,
    useEffect,
    useMemo,
    useState,
} from "react"
import { Source, useMap } from "react-map-gl/mapbox"
import { generateFeatureClass } from "./atlas-functions"
import type { Field } from "@svenvw/fdm-core"
import { getAvailableFieldsUrl } from "./atlas-url"
import { useNavigate } from "react-router"
import {
    type CatalogueCultivationItem,
    getCultivationCatalogue,
} from "@svenvw/fdm-data"

export function FieldsSourceNotClickable({
    id,
    fieldsData,
    children,
}: {
    id: string
    fieldsData: FeatureCollection
    children: ReactNode
}) {
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
    excludedLayerId,
}: {
    id: string
    availableLayerId: string
    excludedLayerId?: string
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

            if (
                map.queryRenderedFeatures(evt.point, {
                    layers: [excludedLayerId],
                }).length
            ) {
                return
            }

            const features = map.queryRenderedFeatures(evt.point, {
                layers: [availableLayerId],
            })
            console.log(features)

            if (
                features.length > 0 &&
                features[0].layer &&
                features[0].layer !== excludedLayerId
            ) {
                handleFieldClick(features[0], setFieldsData)
            }
        }

        if (map) {
            map.on("click", clickOnMap)
            return () => {
                map.off("click", clickOnMap)
            }
        }
    }, [map, availableLayerId, excludedLayerId, setFieldsData])

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
    calendar,
    exclude,
    zoomLevelFields,
    redirectToDetailsPage = false,
    children,
}: {
    id: string
    calendar: string
    exclude: Field[]
    zoomLevelFields: number
    redirectToDetailsPage: boolean
    children: JSX.Element
}) {
    const unwantedIds = new Set(
        exclude
            ? exclude.map((f) => f.properties.b_id_source).filter((id) => id)
            : [],
    )
    const { current: map } = useMap()
    const [data, setData] = useState(generateFeatureClass())
    const availableFieldsUrl = getAvailableFieldsUrl(calendar)

    const navigate = useNavigate()

    const cultivationCataloguePromise = useMemo(async () => {
        try {
            const items = await getCultivationCatalogue("brp")
            const result: Record<string, CatalogueCultivationItem> = {}
            for (const item of items) {
                result[item.b_lu_catalogue] = item
            }
            return result
        } catch (err) {
            console.error(
                "Failed to load cultivation catalogue; defaulting to other color.",
                err,
            )
            return {}
        }
    }, [])

    useEffect(() => {
        if (map && redirectToDetailsPage) {
            const handleClick = (e: any) => {
                // Get the coordinates of the centroid of the clicked field
                if (e.features) {
                    try {
                        const clickedFeature = e.features[0]
                        const featureCentroid = centroid(clickedFeature)
                        const featureCentroidCoordinates =
                            featureCentroid.geometry.coordinates.join(",")
                        navigate(featureCentroidCoordinates)
                    } catch (error) {
                        console.error(
                            "Failed to calculate centroid or navigate:",
                            error,
                        )
                    }
                }
            }
            map.on("click", id, handleClick)
            return () => {
                map.off("click", id, handleClick)
            }
        }
    }, [map, id, redirectToDetailsPage, navigate])

    useEffect(() => {
        async function loadData() {
            if (map) {
                const zoom = map.getZoom()

                if (zoom && zoom > zoomLevelFields) {
                    const bounds = map.getBounds()

                    if (bounds) {
                        const [[minX, minY], [maxX, maxY]] = bounds.toArray()
                        const bbox = {
                            minX: 0.9995 * minX,
                            maxX: 1.0005 * maxX,
                            minY: 0.9995 * minY,
                            maxY: 1.0005 * maxY,
                        }
                        const cultivationCatalogue =
                            await cultivationCataloguePromise
                        try {
                            const iter = deserialize(availableFieldsUrl, bbox)

                            let i = 0
                            const featureClass = generateFeatureClass()

                            for await (const feature of iter) {
                                if (
                                    !unwantedIds.has(
                                        feature.properties!.b_id_source,
                                    )
                                ) {
                                    const catalogueKey =
                                        feature.properties?.b_lu_catalogue
                                    featureClass.features.push({
                                        ...feature,
                                        id: i,
                                        properties: {
                                            ...feature.properties,
                                            b_lu_croprotation:
                                                cultivationCatalogue[
                                                    catalogueKey
                                                ]?.b_lu_croprotation,
                                        },
                                    })
                                }
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
    }, [
        map,
        availableFieldsUrl,
        zoomLevelFields,
        unwantedIds,
        cultivationCataloguePromise,
    ])

    return (
        <Source id={id} type="geojson" data={data}>
            {children}
        </Source>
    )
}
