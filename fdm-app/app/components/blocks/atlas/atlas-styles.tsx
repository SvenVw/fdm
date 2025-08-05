import type {
    FillLayerSpecification,
    LayerProps,
    SymbolLayerSpecification,
} from "react-map-gl/mapbox"

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
            "fill-color": "#60a5fa",
            "fill-opacity": 0.5,
            "fill-outline-color": "#1e3a8a",
        },
    } as FillLayerSpecification // Cast to FillLayerSpecification to allow modification of paint

    const fieldsStyle = {
        ...baseFieldsStyle,
        id: layerId,
    } as LayerProps & FillLayerSpecification // Cast to FillLayerSpecification to allow modification of paint

    if (layerId === "fieldsSelected") {
        fieldsStyle.paint["fill-color"] = "#ffcf0d"
        fieldsStyle.paint["fill-opacity"] = 0.6
    }
    if (layerId === "fieldsSaved") {
        fieldsStyle.paint["fill-color"] = "#10b981"
        fieldsStyle.paint["fill-opacity"] = 0.9
    }

    return fieldsStyle
}
