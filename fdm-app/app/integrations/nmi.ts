/**
 * @file This module handles all integrations with the NMI (Nutriënten Management Instituut) API.
 *
 * It provides functions for:
 * - Retrieving the NMI API key from server-side configuration.
 * - Fetching estimated soil parameter data for a given geographical location.
 * - Uploading a soil analysis PDF and extracting its data using the NMI SoilReader API.
 *
 * The module also includes Zod schemas for validating the API responses to ensure data integrity.
 *
 * @packageDocumentation
 */
import centroid from "@turf/centroid"
import type { Feature, Geometry, Polygon } from "geojson"
import { z } from "zod"
import { serverConfig } from "~/lib/config.server"

/**
 * Retrieves the NMI API key from the server-side configuration.
 *
 * @returns The NMI API key as a string, or `undefined` if it is not configured.
 */
export function getNmiApiKey(): string | undefined {
    if (!serverConfig.integrations.nmi) {
        return undefined
    }
    return serverConfig.integrations.nmi.api_key
}

/**
 * Fetches estimated soil parameters for a given field from the NMI API.
 *
 * This function calculates the centroid of the field's geometry and uses it to query
 * the NMI's estimates endpoint. The response is validated against a Zod schema.
 *
 * @param field - A GeoJSON Feature or Polygon representing the field.
 * @param nmiApiKey - The API key for authenticating with the NMI service.
 * @returns A promise that resolves to an object containing the estimated soil parameters.
 * @throws {Error} If the NMI API key is missing, the API request fails, or the response is invalid.
 */
export async function getSoilParameterEstimates(
    field: Feature | Polygon,
    nmiApiKey: string | undefined,
): Promise<ReturnType<typeof soilParameterEstimatesSchema.parse>> {
    if (!nmiApiKey) {
        throw new Error("Please provide a NMI API key")
    }

    const geometry: Geometry = "geometry" in field ? field.geometry : field
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
    const response = {
        ...result.data,
        a_source: "nl-other-nmi",
        a_depth_upper: 0,
        a_depth_lower: undefined,
    }

    const parsedResponse = soilParameterEstimatesSchema.safeParse(response)
    if (!parsedResponse.success) {
        console.error(
            "NMI API response validation failed:",
            JSON.stringify(parsedResponse.error.format(), null, 2),
        )
        throw new Error(
            `Invalid response from NMI API: ${parsedResponse.error.message}`,
        )
    }

    return parsedResponse.data
}

/**
 * Zod schema for validating the response from the NMI's soil parameter estimates endpoint.
 * @internal
 */
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
    a_depth_upper: z.number(),
    a_depth_lower: z.number().optional().undefined(),
})

/**
 * Extracts soil analysis data from a PDF file using the NMI SoilReader API.
 *
 * This function takes a `FormData` object containing a file upload, sends it to the
 * NMI API, and processes the response to extract and format the soil analysis parameters.
 *
 * @param formData - A `FormData` object containing the soil analysis PDF file under the key "soilAnalysisFile".
 * @returns A promise that resolves to a structured object of soil analysis parameters.
 * @throws {Error} If the NMI API key is not configured, no file is provided, the API request fails,
 *   or the API response is invalid or contains no valid soil parameters.
 */
export async function extractSoilAnalysis(formData: FormData) {
    const nmiApiKey = getNmiApiKey()

    if (!nmiApiKey) {
        throw new Error("NMI API key not configured")
    }

    const file = formData.get("soilAnalysisFile")
    if (!(file instanceof File)) {
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

    if (
        !response.fields ||
        !Array.isArray(response.fields) ||
        response.fields.length === 0
    ) {
        throw new Error("Invalid API response: no fields found")
    }

    const field = response.fields[0]
    const soilAnalysis: { [key: string]: string | number | Date } = {}

    // Extract all `a_*` parameters (analysis values).
    for (const key of Object.keys(field).filter((key) =>
        key.startsWith("a_"),
    )) {
        soilAnalysis[key] = field[key]
    }

    // Check if any soil parameters were actually found.
    if (Object.keys(soilAnalysis).length <= 1) {
        throw new Error("Invalid soil analysis: No parameters found")
    }

    // Process and format other relevant fields from the response.
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
            if (
                Number.isNaN(soilAnalysis.a_depth_upper) ||
                Number.isNaN(soilAnalysis.a_depth_lower)
            ) {
                throw new Error(
                    `Invalid numeric depth values: ${field.b_depth}`,
                )
            }
        }
    }
    return soilAnalysis
}
