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

export type FieldsAvailableUrlType = string | undefined

export interface FeatureFdm {
    type: "feature"
    geometry: FeatureCollection
    properties: {
        b_id_source: string
        [key: string]: any
    }
}

export interface FeatureCollectionFdm {
    type: "FeatureCollection"
    features: FeatureFdm[]
}
