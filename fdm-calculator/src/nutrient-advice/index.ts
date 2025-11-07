/**
 * @file This module provides functionality to request nutrient advice from the external
 * NMI (Nutriënten Management Instituut) API. It formats the required input data and
 * handles the API communication.
 *
 * A cached version of the main request function is also provided for performance optimization.
 *
 * @packageDocumentation
 */
import { withCalculationCache } from "@svenvw/fdm-core"
import pkg from "../package"
import type {
    NutrientAdvice,
    NutrientAdviceInputs,
    NutrientAdviceResponse,
} from "./types"

/**
 * Fetches a nutrient application recommendation from the NMI API.
 *
 * This function constructs a request body with cultivation, location, and detailed soil data,
 * then sends it to the NMI's nutrient advice endpoint. It processes the response to extract
 * the relevant yearly advice data.
 *
 * @param params - The input object for the nutrient advice request.
 * @param params.b_lu_catalogue - The BRP code for the cultivation.
 * @param params.b_centroid - The geographical coordinates of the field.
 * @param params.currentSoilData - An array of the most recent soil analysis results.
 * @param params.nmiApiKey - The API key required for authenticating with the NMI service.
 * @returns A promise that resolves to the `NutrientAdvice` object returned by the API.
 * @throws {Error} If the NMI API key is missing, if the `b_lu_catalogue` is invalid, or if the API request fails.
 */
export async function requestNutrientAdvice({
    b_lu_catalogue,
    b_centroid,
    currentSoilData,
    nmiApiKey,
}: NutrientAdviceInputs): Promise<NutrientAdvice> {
    try {
        if (!nmiApiKey) {
            throw new Error("NMI API key not provided")
        }

        let a_nmin_cc_d30: number | undefined
        let a_nmin_cc_d60: number | undefined
        const soilData: Record<string, number | string> = {}
        // Extract Nmin values and other soil parameters from currentSoilData
        for (const item of currentSoilData) {
            // Exclude 'a_nmin_cc' from soilData as it's handled separately
            if (item.parameter === "a_nmin_cc") {
                if (item.a_depth_lower <= 30) {
                    a_nmin_cc_d30 = item.value
                } else if (item.a_depth_lower <= 60) {
                    a_nmin_cc_d60 = item.value
                }
                continue // Skip adding a_nmin_cc to soilData
            }
            soilData[item.parameter] = item.value
        }

        // Create request body for the NMI API
        const brpSegments = b_lu_catalogue.split("_")
        const brpCode = brpSegments[brpSegments.length - 1]
        if (!brpCode) {
            throw new Error("Invalid b_lu_catalogue provided")
        }
        const body = {
            a_lon: b_centroid[0],
            a_lat: b_centroid[1],
            b_lu_brp: [brpCode],
            a_nmin_cc_d30: a_nmin_cc_d30,
            a_nmin_cc_d60: a_nmin_cc_d60,
            ...soilData, // Include all other soil data parameters
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
            throw new Error(
                `Request to NMI API failed with status ${responseApi.status}: ${responseApi.statusText}`,
            )
        }

        const result: NutrientAdviceResponse = await responseApi.json()
        const response: NutrientAdvice = result.data.year

        return response
    } catch (error) {
        console.error("Error fetching nutrient advice:", error)
        throw error
    }
}

/**
 * A cached version of the `requestNutrientAdvice` function.
 *
 * This function enhances performance by caching the results of the API call. The cache
 * key is generated based on the function's input and the calculator's version, ensuring
 * that the cache is invalidated when the underlying logic or data changes.
 *
 * @param params - The input object for the nutrient advice request.
 * @returns A promise that resolves to the `NutrientAdvice` object returned by the API.
 */
export const getNutrientAdvice = withCalculationCache(
    requestNutrientAdvice,
    "requestNutrientAdvice",
    pkg.calculatorVersion,
)
