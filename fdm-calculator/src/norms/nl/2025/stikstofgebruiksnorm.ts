import type { Field } from "@svenvw/fdm-core"
import { deserialize } from "flatgeobuf/lib/mjs/geojson.js"
import nitrogenStandardsData from "./stikstofgebruiksnorm-data.json"
import type {
    GebruiksnormResult,
    NitrogenStandard,
    NL2025NormsInput,
    NormsByRegion,
    RegionKey,
} from "./types"
import { determineNL2025Hoofdteelt } from "./hoofdteelt"
import { getFdmPublicDataUrl } from "../../../balance/nitrogen"

/**
 * Determines if a field is in an NV-area by checking its coordinates against a flatgeobuffer file.
 *
 * @param b_centroid - An object with the latitude and longitude of the field's centroid.
 * @returns A promise that resolves to `true` if the field is in an NV-area, `false` otherwise.
 */
// Helper function to check if a point is inside a single ring using the ray-casting algorithm.
const isPointInRing = (point: [number, number], ring: number[][]) => {
    let isInside = false
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const xi = ring[i][0]
        const yi = ring[i][1]
        const xj = ring[j][0]
        const yj = ring[j][1]
        const intersect =
            yi > point[1] !== yj > point[1] &&
            point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi
        if (intersect) {
            isInside = !isInside
        }
    }
    return isInside
}

/**
 * Determines if a field is in an NV-area by checking its coordinates against a flatgeobuffer file.
 *
 * @param b_centroid - An object with the latitude and longitude of the field's centroid.
 * @returns A promise that resolves to `true` if the field is in an NV-area, `false` otherwise.
 */
async function isFieldInNVGebied(
    b_centroid: Pick<Field, "latitude" | "longitude">,
): Promise<boolean> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2025/nv-gebied.fgb`

    const { latitude, longitude } = b_centroid

    // Create a small bounding box (1x1 meter) around the point for the spatial query
    const rect = {
        minX: longitude - 0.00001,
        minY: latitude - 0.00001,
        maxX: longitude + 0.00001,
        maxY: latitude + 0.00001,
    }

    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
        }
        const stream = response.body
        if (!stream) {
            throw new Error("Response body is null")
        }

        // Deserialize the flatgeobuffer stream into GeoJSON features within the specified bounding box
        for await (const feature of deserialize(stream, rect)) {
            const geometry = feature.geometry
            if (!geometry) {
                continue
            }

            if (geometry.type === "Polygon") {
                let inPolygon = false
                for (const ring of geometry.coordinates) {
                    if (isPointInRing([longitude, latitude], ring)) {
                        inPolygon = !inPolygon
                    }
                }
                if (inPolygon) {
                    return true
                }
            } else if (geometry.type === "MultiPolygon") {
                for (const polygon of geometry.coordinates) {
                    let inMultiPolygon = false
                    for (const ring of polygon) {
                        if (isPointInRing([longitude, latitude], ring)) {
                            inMultiPolygon = !inMultiPolygon
                        }
                    }
                    if (inMultiPolygon) {
                        return true
                    }
                }
            }
        }
    } catch (err) {
        throw new Error(
            `Error querying NV-Gebied flatgeobuffer: ${String(err)}`,
        )
    }

    // If no intersecting polygons were found
    return false
}

/**
 * Determines the region based on latitude and longitude by checking its coordinates against a flatgeobuffer file.
 *
 * @param b_centroid - An object with the latitude and longitude of the field's centroid.
 * @returns A promise that resolves to the `RegionKey` if the field is in a defined region, or throws an error otherwise.
 */
async function getRegion(
    b_centroid: Pick<Field, "latitude" | "longitude">,
): Promise<RegionKey> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2024/gs.fgb`

    const { latitude, longitude } = b_centroid

    const rect = {
        minX: longitude - 0.00001,
        minY: latitude - 0.00001,
        maxX: longitude + 0.00001,
        maxY: latitude + 0.00001,
    }

    try {
        const response = await fetch(url)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
        }
        const stream = response.body
        if (!stream) {
            throw new Error("Response body is null")
        }

        for await (const feature of deserialize(stream, rect)) {
            const geometry = feature.geometry
            if (!geometry) {
                continue
            }

            let inPolygon = false
            if (geometry.type === "Polygon") {
                for (const ring of geometry.coordinates) {
                    if (isPointInRing([longitude, latitude], ring)) {
                        inPolygon = !inPolygon
                    }
                }
            } else if (geometry.type === "MultiPolygon") {
                for (const polygon of geometry.coordinates) {
                    let inMultiPolygon = false
                    for (const ring of polygon) {
                        if (isPointInRing([longitude, latitude], ring)) {
                            inMultiPolygon = !inMultiPolygon
                        }
                    }
                    if (inMultiPolygon) {
                        inPolygon = true
                        break
                    }
                }
            }

            if (inPolygon) {
                const region = feature.properties?.region as RegionKey
                if (region) {
                    return region
                }
            }
        }
    } catch (err) {
        throw new Error(`Error querying region flatgeobuffer: ${String(err)}`)
    }

    throw new Error(
        `Could not determine region for coordinates: lat ${latitude}, lon ${longitude}`,
    )
}

/**
 * Helper function to retrieve the correct set of nitrogen norms based on the selected
 * cultivation standard and specific conditions like variety, derogation status, and
 * cultivation period (for sub-types).
 *
 * @param selectedStandard - The `NitrogenStandard` object that matches the cultivation.
 * @param b_lu_variety - Optional. The specific variety of the cultivation, used for potato norms.
 * @param is_derogatie_bedrijf - Optional. A boolean indicating if the farm operates under derogation,
 *   relevant for certain crops like maize.
 * @param b_lu_end - The termination date of the cultivation, used to determine applicable sub-type periods.
 * @returns The `NormsByRegion` object containing standard and NV-area norms for all regions,
 *   or `undefined` if no applicable norms are found.
 */
function getNormsForCultivation(
    selectedStandard: NitrogenStandard,
    b_lu_variety: string | undefined,
    is_derogatie_bedrijf: boolean | undefined,
    b_lu_end: Date,
): NormsByRegion | undefined {
    // Handle sub-types, typically used for temporary grasslands where norms depend on the period.
    if (selectedStandard.sub_types) {
        const endDate = new Date(b_lu_end)
        const matchingSubType = selectedStandard.sub_types.find((sub) => {
            // Check if the cultivation end date falls within the sub-type's defined period.
            if (sub.period_start_month && sub.period_end_month) {
                const startPeriod = new Date(
                    endDate.getFullYear(),
                    sub.period_start_month - 1,
                    sub.period_start_day || 1,
                )
                const endPeriod = new Date(
                    endDate.getFullYear(),
                    sub.period_end_month - 1,
                    sub.period_end_day || 1,
                )
                // Adjust endYear if the period spans across a year boundary (e.g., starts in Oct, ends in Jan).
                if (sub.period_start_month > sub.period_end_month) {
                    endPeriod.setFullYear(endDate.getFullYear() + 1)
                }
                return endDate >= startPeriod && endDate <= endPeriod
            }
            return false
        })
        return matchingSubType?.norms // Return norms from the matching sub-type.
    }
    // Handle specific potato varieties which have 'high' or 'low' norms.
    if (selectedStandard.type === "aardappel" && b_lu_variety) {
        const varietyLower = b_lu_variety.toLowerCase()
        if (
            selectedStandard.varieties_hoge_norm?.some(
                (v) => v.toLowerCase() === varietyLower,
            )
        ) {
            return selectedStandard.norms_hoge_norm
        }
        if (
            selectedStandard.varieties_lage_norm?.some(
                (v) => v.toLowerCase() === varietyLower,
            )
        ) {
            return selectedStandard.norms_lage_norm
        }
        if (selectedStandard.norms_overig) {
            return selectedStandard.norms_overig // Fallback to 'overig' if variety not in specific lists.
        }
        return selectedStandard.norms // Fallback to general norms if specific potato norms are missing.
    }
    // Handle specific norms for maize based on derogation status.
    if (
        selectedStandard.type === "akkerbouw" &&
        selectedStandard.cultivation_rvo_table2 === "Akkerbouwgewassen, mais"
    ) {
        if (is_derogatie_bedrijf && selectedStandard.derogatie_norms) {
            return selectedStandard.derogatie_norms
        }
        if (!is_derogatie_bedrijf && selectedStandard.non_derogatie_norms) {
            return selectedStandard.non_derogatie_norms
        }
        return selectedStandard.norms // Fallback if derogation status doesn't match specific norms.
    }
    // Default case: return the primary norms defined for the standard.
    return selectedStandard.norms
}

/**
 * Determines the 'gebruiksnorm' (usage standard) for nitrogen for a given cultivation
 * based on its BRP code, geographical location, and other specific characteristics.
 *
 * This function consults the RVO's "Tabel 2 Stikstof landbouwgrond 2025" and related
 * annexes to provide the legally defined nitrogen limits.
 *
 * @param b_lu_catalogue - The BRP (Basisregistratie Percelen) cultivation code (e.g., "nl_265").
 *   This code is used to match the cultivation to the appropriate nitrogen standard entry.
 * @param latitude - The latitude of the field. Used to determine the soil region.
 * @param longitude - The longitude of the field. Used to determine the soil region.
 * @param b_lu_end - The termination date of the cultivation. This is crucial for
 *   determining the correct norm for temporary grasslands, as their norms vary by period.
 * @param is_nv_area - A boolean indicating whether the field is located in a
 *   Nitraatkwetsbaar Gebied (NV-area). Fields in NV-areas often have lower nitrogen norms.
 * @param b_lu_variety - Optional. The specific variety of the cultivation (e.g., a potato variety).
 *   This parameter is used to apply variety-specific nitrogen norms where applicable (e.g., for potatoes).
 * @param is_derogatie_bedrijf - Optional. A boolean indicating whether the farm operates
 *   under derogation. This affects nitrogen norms for certain crops like maize.
 * @returns An object of type `GebruiksnormResult` containing the determined nitrogen
 *   usage standard (`normValue`) and the `cultivationNameTabel2` (the descriptive name
 *   from RVO Table 2 used for the calculation). Returns `null` if no matching standard
 *   or applicable norm can be found.
 *
 * @remarks
 * The function follows a multi-step process to determine the correct nitrogen norm:
 * 1.  **Matching Standard**: It first filters the `nitrogenStandardsData` to find entries
 *     that match the provided `b_lu_catalogue`.
 * 2.  **Variety-Specific Filtering (Potatoes)**: If a `b_lu_variety` is provided, it attempts
 *     to refine the matching standards based on specific potato varieties that might have
 *     different norm categories (e.g., 'high' or 'low' norms). If no specific variety match
 *     is found, it falls back to 'overig' (other) potato norms if available.
 * 3.  **Standard Selection**: If multiple standards still match after variety filtering,
 *     it prioritizes more specific entries (e.g., those without `variety_type` or `sub_types`
 *     if a direct match is found, otherwise takes the first available).
 * 4.  **Region Determination**: The `getRegion` helper function (currently a placeholder)
 *     determines the soil region based on latitude and longitude.
 * 5.  **Applicable Norms Retrieval**: The `getNormsForCultivation` helper function is called
 *     to retrieve the specific set of norms (e.g., default, sub-type specific, variety-specific,
 *     or derogation-specific) based on the `selectedStandard` and other parameters.
 * 6.  **Norm Value Calculation**: The final `normValue` is selected from the `applicableNorms`
 *     based on the determined `region` and whether the field is an `is_nv_area`.
 *
 * @see {@link https://www.rvo.nl/sites/default/files/2024-12/Tabel-2-Stikstof-landbouwgrond-2025_0.pdf | RVO Tabel 2 Stikstof landbouwgrond 2025}
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiksnormen/stikstof-en-fosfaat/gebruiksnormen-stikstof | RVO Gebruiksnormen stikstof (official page)}
 */
export async function getNL2025StikstofGebruiksNorm(
    input: NL2025NormsInput,
): Promise<GebruiksnormResult | null> {
    const is_derogatie_bedrijf = input.farm.is_derogatie_bedrijf
    const field = input.field
    const cultivations = input.cultivations

    // Determine hoofdteelt
    const b_lu_catalogue = determineNL2025Hoofdteelt(cultivations)
    const cultivation = cultivations.find(
        (c) => c.b_lu_catalogue === b_lu_catalogue,
    )
    if (!cultivation) {
        throw new Error(
            `Cultivation with b_lu_catalogue ${b_lu_catalogue} not found`,
        )
    }

    // Determine region and NV gebied
    const is_nv_area = await isFieldInNVGebied(field.b_centroid)
    const region = await getRegion(field.b_centroid)

    // Find matching nitrogen standard data based on b_lu_catalogue_match
    let matchingStandards: NitrogenStandard[] = nitrogenStandardsData.filter(
        (ns: NitrogenStandard) =>
            ns.b_lu_catalogue_match.includes(b_lu_catalogue),
    )

    if (matchingStandards.length === 0) {
        console.warn(
            `No matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue}.`,
        )
        return null
    }

    // Handle specific cases for potatoes based on variety
    // This logic assumes that the b_lu_catalogue for potatoes will match one of the potato entries
    // and then the variety_type will further refine it.
    if (cultivation.b_lu_variety) {
        const varietyLower = cultivation.b_lu_variety.toLowerCase()
        const filteredByVariety = matchingStandards.filter(
            (ns: NitrogenStandard) =>
                ns.varieties?.some((v) => v.toLowerCase() === varietyLower),
        )

        if (filteredByVariety.length > 0) {
            matchingStandards = filteredByVariety
        } else {
            // Fallback to 'overig' if variety not found in high/low lists for potatoes
            const overigPotato = matchingStandards.find(
                (ns: NitrogenStandard) =>
                    ns.type === "aardappel" &&
                    ns.variety_type?.includes("overig"),
            )
            if (overigPotato) {
                matchingStandards = [overigPotato]
            }
        }
    }

    // Prioritize exact matches if multiple exist (e.g., for specific potato types)
    let selectedStandard: NitrogenStandard | undefined

    if (matchingStandards.length === 1) {
        selectedStandard = matchingStandards[0]
    } else if (matchingStandards.length > 1) {
        // If multiple standards match b_lu_catalogue, try to find a more specific one
        // This could be based on variety_type for potatoes, or other criteria if added later
        if (cultivation.b_lu_variety) {
            const varietyLower = cultivation.b_lu_variety.toLowerCase() // Define varietyLower here
            const varietySpecific = matchingStandards.find(
                (ns) =>
                    ns.varieties_hoge_norm?.some(
                        (v) => v.toLowerCase() === varietyLower,
                    ) ||
                    ns.varieties_lage_norm?.some(
                        (v) => v.toLowerCase() === varietyLower,
                    ) ||
                    ns.varieties?.some((v) => v.toLowerCase() === varietyLower),
            )
            if (varietySpecific) {
                selectedStandard = varietySpecific
            } else {
                // If variety doesn't match a specific list, check for an "overig" type for potatoes
                const overigPotato = matchingStandards.find(
                    (ns) =>
                        ns.type === "aardappel" &&
                        ns.variety_type?.includes("overig"),
                )
                if (overigPotato) selectedStandard = overigPotato
            }
        }
        if (!selectedStandard) {
            // If still no specific match, take the first one (or implement more sophisticated disambiguation)
            selectedStandard =
                matchingStandards.find(
                    (ns) => !ns.variety_type && !ns.sub_types,
                ) || matchingStandards[0]
        }
    }

    if (!selectedStandard) {
        console.warn(
            `No specific matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue} with variety ${
                cultivation.b_lu_variety || "N/A"
            } in region ${region}.`,
        )
        return null
    }

    const applicableNorms = getNormsForCultivation(
        selectedStandard,
        cultivation.b_lu_variety,
        is_derogatie_bedrijf,
        cultivation.b_lu_end,
    )

    if (!applicableNorms) {
        console.warn(
            `Applicable norms object is undefined for ${selectedStandard.cultivation_rvo_table2} in region ${region}.`,
        )
        return null
    }

    const normsForRegion: { standard: number; nv_area: number } =
        applicableNorms[region]

    if (!normsForRegion) {
        console.warn(
            `No norms found for region ${region} for ${selectedStandard.cultivation_rvo_table2}.`,
        )
        return null
    }

    const normValue = is_nv_area
        ? normsForRegion.nv_area
        : normsForRegion.standard

    return {
        normValue: normValue,
        normSource: selectedStandard.cultivation_rvo_table2,
    }
}
