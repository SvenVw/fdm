import type { FeatureCollection } from "geojson"

export function generateFeatureClass(): FeatureCollection {
    return {
        type: "FeatureCollection",
        features: [],
    }
}

export function handleFieldClick(feature, setFieldsData) {
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