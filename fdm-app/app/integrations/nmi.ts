import { serverConfig } from "@/app/lib/config"
import centroid from "@turf/centroid"
import type { Feature } from "geojson"

export function getNmiApiKey() {
    if (!serverConfig.integrations.nmi) {
        return undefined
    }

    const nmiApiKey = serverConfig.integrations.nmi.api_key
    return nmiApiKey
}

export async function getSoilParameterEstimates(
    field: Feature,
    nmiApiKey: string | undefined,
): Promise<{
    a_p_al: number
    a_p_cc: number
    a_som_loi: number
    b_soiltype_agr: string
    b_gwl_class: string
    a_source: string
    a_depth: number
}> {
    if (!nmiApiKey) {
        throw new Error("Please provide a NMI API key")
    }

    const fieldCentroid = centroid(field.geometry)
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
    response.a_depth = 0.3

    return response
}
