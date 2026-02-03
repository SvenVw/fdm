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
    b_gwl_ghg: number
    b_gwl_glg: number
    cultivations: { year: number; b_lu_brp: number }[]
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
            JSON.stringify(z.treeifyError(parsedResponse.error), null, 2),
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
    b_gwl_ghg: z.number(),
    b_gwl_glg: z.number(),
    cultivations: z.array(z.object({ year: z.number(), b_lu_brp: z.number() })),
    a_source: z.string(),
})

export async function extractSoilAnalysis(formData: FormData) {
    const nmiApiKey = getNmiApiKey()

    if (!nmiApiKey) {
        throw new Error("NMI API key not configured")
    }

    // Validate that FormData contains a file
    const file = formData.get("soilAnalysisFile") as File
    if (!file || !(file instanceof File)) {
        throw new Error("No file provided in FormData")
    }

    const responseApi = await fetch("https://api.nmi-agro.nl/soilreader", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${nmiApiKey}`,
        },
        body: formData,
    })

    if (!responseApi.ok) {
        throw new Error("Request to NMI API failed")
    }

    const result = await responseApi.json()
    const response = result.data

    // Validate response structure
    if (
        !response.fields ||
        !Array.isArray(response.fields) ||
        response.fields.length === 0
    ) {
        throw new Error("Invalid API response: no fields found")
    }

    // Process the response
    const field = response.fields[0]

    // Select the a_* parameters
    const soilAnalysis: { [key: string]: string | number | Date } = {}
    for (const key of Object.keys(field).filter((key) =>
        key.startsWith("a_"),
    )) {
        soilAnalysis[key] = field[key]
    }

    // Check if soil parameters are returned
    if (Object.keys(soilAnalysis).length <= 1) {
        // a_source is returned with invalid soil analysis
        throw new Error("Invalid soil analysis")
    }

    // Process the other parameters
    if (field.b_date) {
        // As b_date is in format dd-mm-yyyy
        const dateParts = field.b_date.split("-")
        if (dateParts.length === 3) {
            const day = Number.parseInt(dateParts[0], 10)
            const month = Number.parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
            const year = Number.parseInt(dateParts[2], 10)
            soilAnalysis.b_sampling_date = new Date(year, month, day)
        }
    }
    if (field.b_soiltype_agr) {
        soilAnalysis.b_soil_type = field.b_soiltype_agr
    }
    if (field.b_depth) {
        const depthParts = field.b_depth.split("-")
        if (depthParts.length !== 2) {
            throw new Error(`Invalid depth format: ${field.b_depth}`)
        }
        soilAnalysis.a_depth_upper = Number(depthParts[0]) as number
        soilAnalysis.a_depth_lower = Number(depthParts[1]) as number
        // Validate that the conversion to numbers was successful
        if (
            Number.isNaN(soilAnalysis.a_depth_upper) ||
            Number.isNaN(soilAnalysis.a_depth_lower)
        ) {
            throw new Error(`Invalid numeric depth values: ${field.b_depth}`)
        }
    }
    return soilAnalysis
}

export async function extractBulkSoilAnalyses(formData: FormData) {
    const nmiApiKey = getNmiApiKey()

    if (!nmiApiKey) {
        throw new Error("NMI API key not configured")
    }
    
    const responseApi = await fetch("https://api.nmi-agro.nl/soilreader", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${nmiApiKey}`,
        },
        body: formData,
    })

    if (!responseApi.ok) {
        const text = await responseApi.text()
        console.error(`NMI API Error: ${responseApi.status} ${responseApi.statusText}`, text)
        throw new Error(`Request to NMI API failed: ${responseApi.status} ${responseApi.statusText}`)
    }

    const text = await responseApi.text()
    try {
        const result = JSON.parse(text)
        const response = result.data

        if (!response.fields || !Array.isArray(response.fields)) {
            console.error("Invalid NMI API response structure:", JSON.stringify(result, null, 2))
            throw new Error("Invalid API response: no fields found")
        }

        return response.fields.map((field: any, index: number) => {
            const soilAnalysis: { [key: string]: any } = {
                id: crypto.randomUUID(),
                filename: field.filename || `Analyse ${index + 1}`,
            }
    
            for (const key of Object.keys(field).filter((key) => key.startsWith("a_"))) {
                soilAnalysis[key] = field[key]
            }
    
            if (field.b_date) {
                const dateParts = field.b_date.split("-")
                if (dateParts.length === 3) {
                    const day = Number.parseInt(dateParts[0], 10)
                    const month = Number.parseInt(dateParts[1], 10) - 1
                    const year = Number.parseInt(dateParts[2], 10)
                    soilAnalysis.b_sampling_date = new Date(year, month, day)
                }
            }
    
            if (field.b_soiltype_agr) {
                soilAnalysis.b_soil_type = field.b_soiltype_agr
            }
    
            if (field.b_depth) {
                const depthParts = field.b_depth.split("-")
                if (depthParts.length === 2) {
                    soilAnalysis.a_depth_upper = Number(depthParts[0])
                    soilAnalysis.a_depth_lower = Number(depthParts[1])
                }
            }
    
            // Add coordinates if present in the response for geometry matching
            if (field.a_lat && field.a_lon) {
                soilAnalysis.location = {
                    type: "Point",
                    coordinates: [Number(field.a_lon), Number(field.a_lat)]
                }
            }
    
            return soilAnalysis
        })
    } catch (e) {
        console.error("Failed to parse NMI API response:", text)
        throw e
    }
}
