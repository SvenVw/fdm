import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"
import type { FeatureCollection } from "geojson"
import throttle from "lodash.throttle"
import { useEffect, useState } from "react"
import { Source, useMap } from "react-map-gl"



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






