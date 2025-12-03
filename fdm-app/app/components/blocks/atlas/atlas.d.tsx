import type { FeatureCollection } from "geojson"

export interface FeatureFdm {
    type: "feature"
    geometry: FeatureCollection
    properties: {
        b_id_source: string
        [key: string]: unknown
    }
}

export interface FeatureCollectionFdm {
    type: "FeatureCollection"
    features: FeatureFdm[]
}
