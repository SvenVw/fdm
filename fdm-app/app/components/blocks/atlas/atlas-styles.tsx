import type { ExpressionSpecification } from "mapbox-gl"
import type { LayerProps } from "react-map-gl/mapbox"
import {
    getCultivationColor,
    getCultivationTypesHavingColors,
} from "~/components/custom/cultivation-colors"

const baseFieldsFillColorExpr: ExpressionSpecification = [
    "match",
    ["get", "b_lu_croprotation"],
]

for (const key of getCultivationTypesHavingColors()) {
    baseFieldsFillColorExpr.push(key, getCultivationColor(key))
}

baseFieldsFillColorExpr.push("#60a5fa")

export function getFieldsStyle(layerId: string) {
    const style = getFieldsStyleInner(layerId) as LayerProps
    style.id = layerId
    return style
}

function getFieldsStyleInner(layerId: string): Omit<LayerProps, "id"> {
    const baseFillStyles = {
        "fill-outline-color": "#1e3a8a",
    }

    const baseLineStyles = {
        "line-width": 4,
    }

    if (layerId === "fieldsSelected") {
        return {
            type: "line",
            paint: {
                ...baseLineStyles,
                "line-color": "#ffcf0d",
            },
        }
    }

    if (layerId === "fieldsSaved") {
        return {
            type: "fill",
            paint: {
                ...baseFillStyles,
                "fill-color": "#10b981",
                "fill-opacity": 0.8,
            },
        }
    }

    // default styles
    return {
        type: "fill",
        paint: {
            ...baseFillStyles,
            "fill-color": baseFieldsFillColorExpr,
            "fill-opacity": 0.8,
            "fill-outline-color": "#1e3a8a",
        },
    }
}
