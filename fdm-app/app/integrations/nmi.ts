import centroid from "@turf/centroid"
import type { Feature, Geometry, Polygon } from "geojson"
import { z } from "zod"
import { serverConfig } from "~/lib/config.server"

export function getNmiApiKey() {
    if (!serverConfig.integrations.nmi) {
        return undefined
    }

    const nmiApiKey = serverConfig.integrations.nmi.api_key
    return nmiApiKey
}

export async function getSoilParameterEstimates(
    field: Feature | Polygon,
    nmiApiKey: string | undefined,
): Promise<{
    a_n_rt: number
    a_p_al: number
    a_p_cc: number
    a_som_loi: number
    b_soiltype_agr: string
    b_gwl_class: string
    a_source: string
    a_depth_lower: number
}> {
    if (!nmiApiKey) {
        throw new Error("Please provide a NMI API key")
    }

    let geometry: Geometry
    if ("geometry" in field) {
        geometry = field.geometry
    } else {
        geometry = field
    }
    const fieldCentroid = centroid(geometry)
    const a_lon = fieldCentroid.geometry.coordinates[0]
    const a_lat = fieldCentroid.geometry.coordinates[1]

    const responseApi = await fetch(
        `https://api.nmi-agro.nl/estimates?${new URLSearchParams({
            a_lat: a_lat.toString(),
            a_lon: a_lon.toString(),
        })}`,
        {
            method: "GET",
            headers: {
                Authorization: `Bearer ${nmiApiKey}`,
            },
        },
    )

    if (!responseApi.ok) {
        throw new Error("Request to NMI API failed")
    }

    const result = await responseApi.json()
    const response = result.data
    response.a_source = "NMI"
    response.a_depth_lower = undefined

    // Validate the response using the Zod schema
    const parsedResponse = soilParameterEstimatesSchema.safeParse(result.data)
    if (!parsedResponse.success) {
        console.error(
            "NMI API response validation failed:",
            JSON.stringify(parsedResponse.error.format(), null, 2),
        )
        throw new Error(
            `Invalid response from NMI API: ${parsedResponse.error.message}`,
        )
    }

    return response
}

const soilParameterEstimatesSchema = z.object({
    a_n_rt: z.number(),
    a_p_al: z.number(),
    a_p_cc: z.number(),
    a_som_loi: z.number(),
    b_soiltype_agr: z.string(),
    b_gwl_class: z.string(),
    a_source: z.string(),
    a_depth_lower: z.number(),
})
