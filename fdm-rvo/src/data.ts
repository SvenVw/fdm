import { RvoClient } from "@nmi-agro/rvo-connector"
import { RvoFieldSchema, type RvoField } from "./types"
import { z } from "zod"

export async function fetchRvoFields(
    rvoClient: RvoClient,
    year: number,
    kvkNumber: string,
): Promise<RvoField[]> {
    const fieldsRaw = await rvoClient.opvragenBedrijfspercelen({
        periodBeginDate: `${year}-01-01`,
        periodEndDate: `${year}-12-31`,
        farmId: kvkNumber,
        outputFormat: "geojson",
    })

    // Check if fieldsRaw has 'features' property (i.e. is a FeatureCollection)
    const features = (fieldsRaw as any).features // Temporary unsafe cast to access features

    if (Array.isArray(features)) {
        const RvoFieldsArraySchema = z.array(RvoFieldSchema)
        return RvoFieldsArraySchema.parse(features)
    }

    return [] // Return empty if no features or wrong format
}
