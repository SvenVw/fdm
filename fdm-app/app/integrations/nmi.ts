import { CurrentSoilData } from "@svenvw/fdm-core"
import centroid from "@turf/centroid"
import type { Feature, Geometry, Polygon } from "geojson"
import { number, z } from "zod"
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
    a_al_ox: number
    a_c_of: number
    a_ca_co: number
    a_ca_co_po: number
    a_caco3_if: number
    a_cec_co: number
    a_clay_mi: number
    a_cn_fr: number
    a_com_fr: number
    a_cu_cc: number
    a_density_sa: number
    a_fe_ox: number
    a_k_cc: number
    a_k_co: number
    a_k_co_po: number
    a_mg_cc: number
    a_mg_co: number
    a_mg_co_po: number
    a_n_pmn: number
    a_n_rt: number
    a_p_al: number
    a_p_cc: number
    a_p_ox: number
    a_p_rt: number
    a_p_sg: number
    a_p_wa: number
    a_ph_cc: number
    a_s_rt: number
    a_sand_mi: number
    a_silt_mi: number
    a_som_loi: number
    a_zn_cc: number
    b_soiltype_agr: string
    b_gwl_class: string
    a_source: string
    a_depth_upper: number
    a_depth_lower: number | undefined
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
    response.a_source = "nl-other-nmi"
    response.a_depth_upper = 0
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
    a_al_ox: z.number(),
    a_ca_co: z.number(),
    a_ca_co_po: z.number(),
    a_caco3_if: z.number(),
    a_cec_co: z.number(),
    a_clay_mi: z.number(),
    a_cn_fr: z.number(),
    a_com_fr: z.number(),
    a_cu_cc: z.number(),
    a_fe_ox: z.number(),
    a_k_cc: z.number(),
    a_k_co: z.number(),
    a_k_co_po: z.number(),
    a_mg_cc: z.number(),
    a_mg_co: z.number(),
    a_mg_co_po: z.number(),
    a_n_pmn: z.number(),
    a_n_rt: z.number(),
    a_p_al: z.number(),
    a_p_cc: z.number(),
    a_p_ox: z.number(),
    a_p_rt: z.number(),
    a_p_sg: z.number(),
    a_p_wa: z.number(),
    a_ph_cc: z.number(),
    a_s_rt: z.number(),
    a_sand_mi: z.number(),
    a_silt_mi: z.number(),
    a_som_loi: z.number(),
    a_zn_cc: z.number(),
    b_soiltype_agr: z.string(),
    b_gwl_class: z.string(),
    a_source: z.string(),
})

export async function getNutrientAdvice(
    b_lu_catalogue: string,
    b_centroid: [number, number],
    currentSoilData: CurrentSoilData,
) {
    const nmiApiKey = getNmiApiKey()

    if (!nmiApiKey) {
        throw new Error("NMI API key not configured")
    }

    const soilData: Record<string, number | string> = {}
    for (const key in currentSoilData) {
        if (currentSoilData[key].parameter === "a_nmin_cc") {
            if (currentSoilData[key].a_depth_lower <= 30) {
                soilData.a_nmin_cc_d30 = currentSoilData[key].value
            } else if (currentSoilData[key].a_depth_lower <= 60) {
                soilData.a_nmin_cc_d60 = currentSoilData[key].value
            }
        }
        soilData[currentSoilData[key].parameter] = currentSoilData[key].value
    }

    // Transform a_nmin_cc withy depth
    let a_nmin_cc_d30: number | undefined
    let a_nmin_cc_d60: number | undefined
    if (Object.keys(currentSoilData).includes("a_nmin_cc_")) {
        if (currentSoilData.a_depth_lower <= 30) {
            a_nmin_cc_d30 = currentSoilData.a_nmin_cc
        } else if (currentSoilData.a_depth_lower <= 60) {
            a_nmin_cc_d60 = currentSoilData.a_nmin_cc
        }
    }

    // Create request body
    const body = {
        a_lon: b_centroid[0],
        a_lat: b_centroid[1],
        b_lu_brp: [b_lu_catalogue.split("_")[1]],
        a_nmin_cc_d30: a_nmin_cc_d30,
        a_nmin_cc_d60: a_nmin_cc_d60,
        ...soilData,
    }

    // Send request to NMI API
    const responseApi = await fetch(
        "https://api.nmi-agro.nl/bemestingsplan/nutrients",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${nmiApiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        },
    )

    if (!responseApi.ok) {
        throw new Error("Request to NMI API failed")
    }

    const result = await responseApi.json()
    const response = result.data.year

    return response
}
