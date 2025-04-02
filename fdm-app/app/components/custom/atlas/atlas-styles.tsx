import type { LayerProps } from "react-map-gl"

export function getFieldsStyle(layerId: string): LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} {
    const fieldsStyle = {
        id: layerId,
        type: "fill",
        paint: {
            "fill-color": "#3b82f6",
            "fill-opacity": 0.5,
            "fill-outline-color": "#1e3a8a",
        },
    }

    if (layerId === "fieldsSelected") {
        fieldsStyle.paint["fill-color"] = "#f43f5e"
        fieldsStyle.paint["fill-opacity"] = 0.8
    }
    if (layerId === "fieldsSaved") {
        fieldsStyle.paint["fill-color"] = "#10b981"
        fieldsStyle.paint["fill-opacity"] = 0.8
    }
    return fieldsStyle
}
