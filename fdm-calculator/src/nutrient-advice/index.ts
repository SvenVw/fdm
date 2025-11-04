import { withCalculationCache } from "@svenvw/fdm-core"
import pkg from "../package"
import type {
    NutrientAdvice,
    NutrientAdviceInputs,
    NutrientAdviceResponse,
} from "./types"

/**
 * Requests nutrient advice from the NMI API based on provided field and soil data.
 *
 * @param {NutrientAdviceInputs} inputs - An object containing all necessary inputs for the nutrient advice calculation.
 * @param {string} inputs.b_lu_catalogue - The BRP cultivation catalogue identifier (e.g., "nl_2014").
 * @param {[number, number]} inputs.b_centroid - The centroid coordinates of the field [longitude, latitude].
 * @param {CurrentSoilData} inputs.currentSoilData - Current soil data for the field, used to extract Nmin values and other soil parameters.
 * @param {string | undefined} inputs.nmiApiKey - The NMI API key for authentication.
 * @returns {Promise<NutrientAdvice>} A promise that resolves to an object containing the nutrient advice for the year.
 * @throws {Error} If the NMI API key is not provided or if the request to the NMI API fails.
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
 * Cached version of `requestNutrientAdvice`.
 * This function uses `withCalculationCache` to store and retrieve results,
 * improving performance for repeated calls with the same inputs.
 * The cache key is based on the inputs and the calculator version.
 */
export const getNutrientAdvice = withCalculationCache(
    requestNutrientAdvice,
    "requestNutrientAdvice",
    pkg.calculatorVersion,
)
