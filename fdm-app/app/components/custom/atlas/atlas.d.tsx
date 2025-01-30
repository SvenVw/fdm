import type { FeatureCollection } from "geojson"

export interface MapFieldsProps {
    height: string | undefined
    width: string | undefined
    interactive: boolean
    mapboxToken: string
    mapStyle: "mapbox://styles/mapbox/satellite-streets-v12"
    fieldsSelected: FeatureCollection | null
    fieldsAvailableUrl: fieldsAvailableUrlType
    fieldsSaved: FeatureCollection | null
}

export type fieldsAvailableUrlType = string | undefined