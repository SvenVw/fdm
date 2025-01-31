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
            "fill-color": "#93c5fd",
            "fill-opacity": 0.5,
            "fill-outline-color": "#1e3a8a",
        },
    }

    if (layerId === "fieldsSelected") {
        fieldsStyle.paint["fill-color"] = "#fca5a5"
        fieldsStyle.paint["fill-opacity"] = 0.8
    }
    return fieldsStyle
}
