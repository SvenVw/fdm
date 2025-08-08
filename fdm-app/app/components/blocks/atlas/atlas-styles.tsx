import type { ExpressionSpecification } from "mapbox-gl"
import type { LayerProps } from "react-map-gl/mapbox"
import {
    getCultivationColor,
    getCultivationTypesHavingColors,
} from "~/components/custom/cultivation-colors"

const baseFieldsFillColorExpr: ExpressionSpecification = [
    "match",
    ["get", "b_lu_croprotation"],
    ...getCultivationTypesHavingColors().flatMap((k) => [
        k,
        getCultivationColor(k),
    ]),
    getCultivationColor("other"),
]

export function getFieldsStyle(layerId: string): LayerProps {
    const style = getFieldsStyleInner(layerId)
    style.id = layerId
    return style
}

function getFieldsStyleInner(layerId: string): LayerProps {
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
                "fill-color": "#000000",
                "fill-opacity": 0,
            },
        }
    }

    if (layerId === "fieldsSavedOutline") {
        return {
            type: "line",
            paint: {
                ...baseLineStyles,
                "line-color": "#10b981",
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
        },
    }
}
