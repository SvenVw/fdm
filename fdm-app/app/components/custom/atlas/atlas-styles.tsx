import type { LayerProps } from "react-map-gl"

export const availableFieldsFillStyle: LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} = {
    id: "available-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#93c5fd",
        "fill-opacity": 0.5,
        "fill-outline-color": "#1e3a8a",
    },
}
export function getFieldsStyle(layerId: string): LayerProps {
    return {
        id: layerId,
        type: "fill",
        paint: {
            "fill-color": "#93c5fd",
            "fill-opacity": 0.5,
            "fill-outline-color": "#1e3a8a",
        },
    }
}
const fieldsStyle: LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} = {
    id: "selected-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#fca5a5",
        "fill-opacity": 0.8,
        "fill-outline-color": "#1e3a8a",
    },
}

export const savedFieldsStyle: LayerProps & {
    id: string
    type: string
    paint: {
        "fill-color": string
        "fill-opacity": number
        "fill-outline-color": string
    }
} = {
    id: "saved-fields-fill",
    type: "fill",
    paint: {
        "fill-color": "#fca5a5",
        "fill-opacity": 0.8,
        "fill-outline-color": "#1e3a8a",
    },
}
