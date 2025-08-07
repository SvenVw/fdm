import type {
    FillLayerSpecification,
    LayerProps,
    SymbolLayerSpecification,
} from "react-map-gl/mapbox"

export const CROP_ROTATION_COLORS = {
    grass: "#558B2F",
    maize: "#FBC02D",
    cereal: "#C2B280",
    potato: "#8D6E63",
    sugarbeet: "#9B2D30",
    rapeseed: "#D4AC0D",
    clover: "#8BC34A",
    alfalfa: "#7E57C2",
    catchcrop: "#4DD0E1",
    nature: "#00796B",
    starch: "#F57C00",
    other: "#9E9E9E",
}

const baseFieldsFillColorExpr = ["match", ["get", "b_lu_croprotation"]]

for (const [key, value] of Object.entries(CROP_ROTATION_COLORS)) {
    baseFieldsFillColorExpr.push(key, value)
}

baseFieldsFillColorExpr.push("#60a5fa")

export function getFieldsStyle(layerId: string): LayerProps &
    (
        | {
              id: string
              type: "fill"
              paint: FillLayerSpecification["paint"]
          }
        | {
              id: string
              type: "symbol"
              layout: SymbolLayerSpecification["layout"]
              paint: SymbolLayerSpecification["paint"]
          }
    ) {
    const baseFieldsStyle: Omit<FillLayerSpecification, "id" | "source"> = {
        type: "fill",
        paint: {
            "fill-color": baseFieldsFillColorExpr,
            "fill-opacity": 0.5,
            "fill-outline-color": "#1e3a8a",
        },
    } as FillLayerSpecification // Cast to FillLayerSpecification to allow modification of paint

    const fieldsStyle = {
        ...baseFieldsStyle,
        id: layerId,
    } as LayerProps & FillLayerSpecification // Cast to FillLayerSpecification to allow modification of paint

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
