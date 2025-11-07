/**
 * @file This module calculates the usage norm for nitrogen from animal manure (`dierlijke mest gebruiksnorm`)
 * for the Dutch regulations of 2025. It includes functions to determine if a field lies within
 * specific geographically designated areas, which is a key factor in the norm calculation.
 *
 * The main function, `calculateNL2025DierlijkeMestGebruiksNorm`, integrates these geographical
 * checks with the farm's derogation status to determine the final norm value.
 *
 * @packageDocumentation
 */
import { type Field, withCalculationCache } from "@svenvw/fdm-core"
import pkg from "../../../../package"
import { getGeoTiffValue } from "../../../../shared/geotiff"
import { getFdmPublicDataUrl } from "../../../../shared/public-data-url"
import { isFieldInNVGebied } from "./stikstofgebruiksnorm"
import type {
    DierlijkeMestGebruiksnormResult,
    NL2025NormsInput,
} from "./types.d"

/**
 * Determines if a field is located within a groundwater protection area (`Grondwaterbeschermingsgebied`).
 *
 * This function queries a specific GeoTIFF file using the field's centroid coordinates. A return
 * value of `1` from the GeoTIFF indicates the field is within a protection area.
 *
 * @param b_centroid - The longitude and latitude of the field's centroid.
 * @returns A promise that resolves to `true` if the field is in a groundwater protection area,
 *   otherwise `false`.
 * @throws {Error} If the GeoTIFF data returns an unexpected value.
 */
export async function isFieldInGWGBGebied(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2024/gwbg.tiff`
    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    const gwbgCode = await getGeoTiffValue(url, longitude, latitude)

    switch (gwbgCode) {
        case 1: {
            return true
        }
        case 0: {
            return false
        }
        default: {
            throw new Error(
                `Unknown GWBG code: ${gwbgCode} for coordinates ${longitude}, ${latitude}`,
            )
        }
    }
}

/**
 * Determines if a field is located within a Natura 2000 area.
 *
 * This function queries a specific GeoTIFF file using the field's centroid coordinates. A return
 * value of `1` from the GeoTIFF indicates the field is within a Natura 2000 area.
 *
 * @param b_centroid - The longitude and latitude of the field's centroid.
 * @returns A promise that resolves to `true` if the field is in a Natura 2000 area, otherwise `false`.
 * @throws {Error} If the GeoTIFF data returns an unexpected value.
 */
export async function isFieldInNatura2000Gebied(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2024/natura2000.tiff`
    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    const natura2000Code = await getGeoTiffValue(url, longitude, latitude)

    switch (natura2000Code) {
        case 1: {
            return true
        }
        case 0: {
            return false
        }
        default: {
            throw new Error(
                `Unknown Natura2000 code: ${natura2000Code} for coordinates ${longitude}, ${latitude}`,
            )
        }
    }
}

/**
 * Determines if a field is located within a derogation-free zone (`derogatie-vrije zone`).
 *
 * This function queries a specific GeoTIFF file using the field's centroid coordinates. A return
 * value of `1` from the GeoTIFF indicates the field is within a derogation-free zone.
 *
 * @param b_centroid - The longitude and latitude of the field's centroid.
 * @returns A promise that resolves to `true` if the field is in a derogation-free zone, otherwise `false`.
 * @throws {Error} If the GeoTIFF data returns an unexpected value.
 */
export async function isFieldInDerogatieVrijeZone(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2025/derogatievrije_zones.tiff`
    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    const derogatieVrijeZoneCode = await getGeoTiffValue(
        url,
        longitude,
        latitude,
    )

    switch (derogatieVrijeZoneCode) {
        case 1: {
            return true
        }
        case 0: {
            return false
        }
        default: {
            throw new Error(
                `Unknown  derogatieVrijeZoneCodes code: ${derogatieVrijeZoneCode} for coordinates ${longitude}, ${latitude}`,
            )
        }
    }
}

/**
 * Calculates the animal manure usage norm for a specific field for the year 2025.
 *
 * This function determines the maximum permissible amount of nitrogen from animal manure
 * that can be applied to a field. The calculation follows a decision tree based on the
 * farm's derogation status and the field's location relative to various protected zones.
 *
 * @param input - A standardized object containing the farm and field data.
 * @returns A promise that resolves to an object containing the calculated `normValue` (in kg N/ha)
 *   and a `normSource` string explaining the basis for the norm.
 */
export async function calculateNL2025DierlijkeMestGebruiksNorm(
    input: NL2025NormsInput,
): Promise<DierlijkeMestGebruiksnormResult> {
    const is_derogatie_bedrijf = input.farm.is_derogatie_bedrijf || false
    const field = input.field

    const [
        is_nv_gebied,
        is_gwbg_gebied,
        is_natura2000_gebied,
        is_derogatie_vrije_zone,
    ] = await Promise.all([
        isFieldInNVGebied(field.b_centroid),
        isFieldInGWGBGebied(field.b_centroid),
        isFieldInNatura2000Gebied(field.b_centroid),
        isFieldInDerogatieVrijeZone(field.b_centroid),
    ])

    let normValue: number
    let normSource: string

    if (is_derogatie_bedrijf) {
        if (is_natura2000_gebied) {
            normValue = 170
            normSource = "Derogatie - Natura2000 Gebied"
        } else if (is_gwbg_gebied) {
            normValue = 170
            normSource = "Derogatie - Grondwaterbeschermingsgebied"
        } else if (is_derogatie_vrije_zone) {
            normValue = 170
            normSource = "Derogatie - Derogatie-vrije zone"
        } else if (is_nv_gebied) {
            normValue = 190
            normSource = "Derogatie - NV Gebied"
        } else {
            normValue = 200
            normSource = "Derogatie"
        }
    } else {
        normValue = 170
        normSource = "Standaard - geen derogatie"
    }

    return { normValue, normSource }
}

/**
 * A cached version of the `calculateNL2025DierlijkeMestGebruiksNorm` function.
 *
 * This function enhances performance by caching the results of the norm calculation.
 * The cache key is generated based on the function's input and the calculator's version,
 * ensuring that the cache is invalidated when the underlying logic or data changes.
 *
 * @param input - A standardized object containing the farm and field data.
 * @returns A promise that resolves to an object containing the calculated `normValue` (in kg N/ha)
 *   and a `normSource` string explaining the basis for the norm.
 */
export const getNL2025DierlijkeMestGebruiksNorm = withCalculationCache(
    calculateNL2025DierlijkeMestGebruiksNorm,
    "calculateNL2025DierlijkeMestGebruiksNorm",
    pkg.calculatorVersion,
)
