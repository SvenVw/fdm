import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"
import type { Feature, GeoJsonProperties, Geometry } from "geojson"
import { getAvailableFieldsUrl } from "../atlas/atlas-url"

export async function getFieldByCentroid(
    longitude: number,
    latitude: number,
    calendar: string,
): Promise<Feature<Geometry, GeoJsonProperties> | null> {
    // Create a small bounding box around the centroid to query the FGB file
    const buffer = 0.000001 // A very small buffer to ensure the point is within the bbox
    const bbox = {
        minX: longitude - buffer,
        maxX: longitude + buffer,
        minY: latitude - buffer,
        maxY: latitude + buffer,
    }

    try {
        const availableFieldsUrl = getAvailableFieldsUrl(calendar)

        const iter = deserialize(availableFieldsUrl, bbox)
        for await (const feature of iter) {
            // For simplicity, we'll assume the first feature found in the bbox is the one we want (as the buffer is very small).
            return feature
        }
    } catch (error) {
        console.error("Failed to query FGB data by centroid: ", error)
    }
    return null
}
