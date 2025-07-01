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
 * `isPointInRing` is a helper function that determines if a given geographical point
 * (represented by `point`) lies inside a polygon defined by a `ring` (an array of coordinates).
 * This function is crucial for spatial queries, such as checking if a field's centroid
 * falls within a specific geographical area like an NV-gebied (nutriënten verontreinigd)
 * or a soil region.
 *
 * @param point - A tuple `[longitude, latitude]` representing the coordinates of the point to check.
 *   Note that in GIS contexts, coordinates are often expressed as `[longitude, latitude]` (X, Y).
 * @param ring - An array of coordinate pairs `[[lon1, lat1], [lon2, lat2], ...]` that define
 *   the vertices of a polygon. The last point should typically be the same as the first to close the ring.
 * @returns `true` if the point is inside the polygon, `false` otherwise.
 *
 * @remarks
 * This function implements the **Ray-Casting Algorithm** (also known as the "crossing number" algorithm).
 * The core idea is to draw an imaginary horizontal ray (a line extending infinitely to the right)
 * from the `point` and count how many times this ray intersects with the edges of the polygon `ring`.
 *
 * Here's how the algorithm works, step-by-step:
 * 1.  **Initialization**: A boolean variable `isInside` is set to `false`. This variable will
 *     be toggled each time the ray crosses an edge of the polygon.
 * 2.  **Iterating Through Edges**: The function loops through each edge of the polygon. An edge
 *     is defined by two consecutive vertices (e.g., `(xi, yi)` and `(xj, yj)`).
 * 3.  **Horizontal Ray**: Imagine a horizontal line extending from the `point` (specifically,
 *     from its Y-coordinate `point[1]`) towards positive infinity (to the right).
 * 4.  **Intersection Check**: For each edge `(xi, yi)` to `(xj, yj)`, the algorithm checks
 *     two conditions to determine if the horizontal ray from `point` intersects this edge:
 *     *   **Vertical Span Check**: `yi > point[1] !== yj > point[1]`
 *         This checks if the ray's Y-coordinate (`point[1]`) is strictly between the Y-coordinates
 *         of the two vertices of the edge (`yi` and `yj`). In simpler terms, it ensures that
 *         the edge actually crosses the horizontal line at the `point`'s Y-level. If both `yi`
 *         and `yj` are on the same side (both above or both below) the ray, there's no intersection.
 *     *   **Horizontal Position Check**: `point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi`
 *         If the vertical span check passes, this part calculates the X-coordinate where the edge
 *         intersects the horizontal line at `point[1]`. It then checks if the `point`'s X-coordinate
 *         (`point[0]`) is to the left of this intersection point. If it is, the ray crosses the edge.
 *         This formula is derived from the equation of a line, solving for X at the given Y.
 * 5.  **Toggling `isInside`**: If both conditions are met (meaning the ray crosses the current edge),
 *     the `isInside` boolean is flipped (`isInside = !isInside`).
 * 6.  **Final Result**: After checking all edges, if `isInside` is `true`, it means the ray crossed
 *     an odd number of edges, indicating the point is inside the polygon. If `isInside` is `false`,
 *     it means an even number of crossings, indicating the point is outside.
 *
 * This algorithm is robust for most simple polygons and is a common method in computational geometry
 * for point-in-polygon tests.
 */
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
 * Determines if a field is located within a met nutriënten verontreinigde gebied (NV-gebied) in the Netherlands.
 * This is achieved by performing a spatial query against a `flatgeobuf` file containing
 * the boundaries of all NV-gebieden.
 *
 * @param b_centroid - An object containing the `latitude` and `longitude` of the field's centroid.
 *   This point is used to query the geographical data.
 * @returns A promise that resolves to `true` if the field's centroid is found within an NV-gebied,
 *   `false` otherwise.
 * @throws {Error} If there are issues fetching the `flatgeobuf` file or processing its stream.
 *
 * @remarks
 * The function leverages the `flatgeobuf` format for efficient spatial querying. Instead of
 * downloading and processing the entire large dataset of NV-gebieds, it performs a targeted
 * query:
 * 1.  **Data Source**: It constructs a URL to the `nv.fgb` file, which is a `flatgeobuf`
 *     file hosted publicly.
 * 2.  **Bounding Box Query**: A small bounding box (approximately 1x1 meter) is created around
 *     the `b_centroid`'s longitude and latitude. This bounding box is sent as part of the
 *     request to the `flatgeobuf` server. This is a key optimization: the server only sends
 *     back geographical features that intersect with this small box, significantly reducing
 *     data transfer and processing load.
 * 3.  **Stream Processing**: The response is received as a stream. The `deserialize` function
 *     from `flatgeobuf` processes this stream, yielding only the GeoJSON features (polygons)
 *     that intersect with the defined bounding box.
 * 4.  **Point-in-Polygon Test**: For each returned polygon (or multi-polygon), the `isPointInRing`
 *     helper function is used to accurately determine if the field's centroid is truly inside
 *     any of its rings. This handles complex polygon geometries, including those with holes.
 * 5.  **Early Exit**: As soon as the centroid is found to be within any NV-gebied polygon,
 *     the function returns `true`. If no intersecting polygons are found after checking
 *     all features, it returns `false`.
 *
 * This approach ensures that the check is both accurate and performant, especially for large
 * geographical datasets.
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
 * Determines the specific soil region (e.g., "zand_nwc", "zand_zuid", "klei", "veen", "loess") for a given field
 * based on its geographical coordinates. This is achieved by performing a spatial query
 * against a `flatgeobuf` file containing the boundaries of grondsoortenkaart in de Meststoffenwet in the Netherlands.
 *
 * @param b_centroid - An object containing the `latitude` and `longitude` of the field's centroid.
 *   This point is used to query the geographical data.
 * @returns A promise that resolves to a `RegionKey` (e.g., "zand_nwc", "zand_zuid", "klei", "veen", "loess") if the
 *   field's centroid is found within a defined soil region.
 * @throws {Error} If there are issues fetching the `flatgeobuf` file, processing its stream,
 *   or if the field's coordinates do not fall within any known region.
 *
 * @remarks
 * Similar to `isFieldInNVGebied`, this function uses the `flatgeobuf` format for efficient
 * spatial querying of soil region data:
 * 1.  **Data Source**: It constructs a URL to the `gs.fgb` file, which contains the
 *     geographical boundaries of different soil regions.
 * 2.  **Bounding Box Query**: A small bounding box (approximately 1x1 meter) is created around
 *     the `b_centroid`'s longitude and latitude. This box is used to request only the relevant
 *     geographical features from the `flatgeobuf` server, minimizing data transfer.
 * 3.  **Stream Processing**: The `deserialize` function processes the incoming stream,
 *     providing GeoJSON features that intersect with the bounding box.
 * 4.  **Point-in-Polygon Test**: For each returned polygon (or multi-polygon), the `isPointInRing`
 *     helper function is used to precisely check if the field's centroid is inside.
 * 5.  **Region Extraction**: If the centroid is found within a polygon, the function attempts
 *     to extract the `region` property from the GeoJSON feature's properties. This `region`
 *     value (e.g., "zand" for sandy soil) is then returned.
 * 6.  **Error Handling**: If no region can be determined after checking all intersecting features,
 *     an error is thrown, indicating that the coordinates do not fall into a defined region.
 *
 * This function is critical for applying region-specific nitrogen norms, as these norms
 * vary based on soil type.
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
 * Retrieves the appropriate set of nitrogen norms (`NormsByRegion`) for a given cultivation.
 * This function applies a set of specific rules and conditions to select the most accurate
 * norm from the available `NitrogenStandard` data, considering factors like cultivation
 * sub-types, specific varieties, and farm derogation status.
 *
 * @param selectedStandard - The base `NitrogenStandard` object that broadly matches the cultivation.
 *   This object contains various norm categories (e.g., general, sub-type specific, variety-specific).
 * @param b_lu_variety - Optional. The specific variety of the cultivation (e.g., a potato variety).
 *   This is used to apply variety-specific norms where applicable.
 * @param is_derogatie_bedrijf - Optional. A boolean indicating if the farm operates under
 *   derogation. This is relevant for certain crops like maize, which have different norms
 *   for derogated vs. non-derogated farms.
 * @param b_lu_end - The termination date of the cultivation. This is crucial for determining
 *   applicable sub-type periods, especially for temporary grasslands where norms can vary
 *   based on the period of the year.
 * @returns A `NormsByRegion` object containing standard and NV-gebied norms for all regions
 *   (e.g., "zand_nwc", "zand_zuid", "klei", "veen", "loess") that apply to the specific cultivation and conditions.
 *   Returns `undefined` if no applicable norms can be found based on the provided criteria.
 *
 * @remarks
 * The function prioritizes norm selection based on the following hierarchy:
 * 1.  **Sub-Type Norms (e.g., Temporary Grasslands)**:
 *     If `selectedStandard` has `sub_types` defined (e.g., for temporary grasslands),
 *     it checks if the `b_lu_end` date falls within any of the specified `period_start_month`
 *     and `period_end_month` ranges. If a matching sub-type period is found, its associated
 *     norms are returned. This ensures that time-sensitive norms are correctly applied.
 * 2.  **Variety-Specific Norms (e.g., Potatoes)**:
 *     If the `selectedStandard` is for "aardappel" (potato) and `b_lu_variety` is provided,
 *     the function checks if the variety matches any in `varieties_hoge_norm` (high norms)
 *     or `varieties_lage_norm` (low norms). If a match is found, the corresponding norms
 *     (`norms_hoge_norm` or `norms_lage_norm`) are returned. If the variety doesn't match
 *     these specific lists, it falls back to `norms_overig` (other) potato norms if available.
 * 3.  **Derogation-Specific Norms (e.g., Maize)**:
 *     If the `selectedStandard` is for "akkerbouw" and specifically "Akkerbouwgewassen, mais",
 *     it checks the `is_derogatie_bedrijf` status. If the farm is derogated, `derogatie_norms`
 *     are returned; otherwise, `non_derogatie_norms` are returned. This ensures that norms
 *     are correctly applied based on the farm's legal status.
 * 4.  **Default Norms**:
 *     If none of the above specific conditions are met, the function defaults to returning
 *     the primary `norms` defined directly within the `selectedStandard` object.
 *
 * This structured approach ensures that the most specific and applicable nitrogen norm
 * is always retrieved for the given cultivation context.
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
 * This function is the primary entry point for calculating the nitrogen usage norm
 * according to the Dutch RVO's "Tabel 2 Stikstof landbouwgrond 2025" and related annexes.
 *
 * @param input - An object of type `NL2025NormsInput` containing all necessary data:
 *   - `farm.is_derogatie_bedrijf`: A boolean indicating if the farm operates under derogation.
 *   - `field.b_centroid`: An object with the latitude and longitude of the field's centroid.
 *   - `cultivations`: An array of cultivation objects, from which the `hoofdteelt` (main crop)
 *     will be determined.
 * @returns A promise that resolves to an object of type `GebruiksnormResult` containing:
 *   - `normValue`: The determined nitrogen usage standard in kilograms per hectare (kg/ha).
 *   - `normSource`: The descriptive name from RVO Table 2 used for the calculation.
 *   Returns `null` if no matching standard or applicable norm can be found for the given input.
 * @throws {Error} If the `hoofdteelt` cultivation cannot be found or if geographical data
 *   queries fail.
 *
 * @remarks
 * The function follows a comprehensive, multi-step process to accurately determine the
 * correct nitrogen norm:
 *
 * 1.  **Identify Main Crop (`hoofdteelt`)**:
 *     The `determineNL2025Hoofdteelt` function is called to identify the primary cultivation
 *     (`b_lu_catalogue`) for the field based on the provided `cultivations` array. This is
 *     the first step to narrow down the applicable nitrogen standards.
 *
 * 2.  **Determine Geographical Context**:
 *     -   `isFieldInNVGebied`: This asynchronous helper function is called to check if the
 *         field's centroid falls within a Nitraatkwetsbaar Gebied (NV-gebied). Fields in NV-gebieds
 *         often have stricter (lower) nitrogen norms.
 *     -   `getRegion`: This asynchronous helper function determines the specific soil region
 *         (e.g., "zand" for sandy soil, "klei" for clay soil) based on the field's coordinates.
 *         Nitrogen norms can vary significantly by soil type.
 *     Both functions use efficient `flatgeobuf` spatial queries to retrieve this information.
 *
 * 3.  **Match Nitrogen Standard Data**:
 *     The `nitrogenStandardsData` (loaded from a JSON file) is filtered to find all entries
 *     (`NitrogenStandard` objects) whose `b_lu_catalogue_match` array includes the identified
 *     `b_lu_catalogue` of the `hoofdteelt`.
 *
 * 4.  **Refine by Variety (for Potatoes)**:
 *     If the `hoofdteelt` has a specific `b_lu_variety` (e.g., for potatoes), the matching
 *     standards are further filtered. Potatoes can have "high" (`varieties_hoge_norm`) or
 *     "low" (`varieties_lage_norm`) nitrogen norms based on their variety. If a specific
 *     variety match is not found, it falls back to "overig" (other) potato norms if available.
 *
 * 5.  **Select the Most Specific Standard**:
 *     If multiple `NitrogenStandard` entries still match after initial filtering and
 *     variety-specific refinement, the function attempts to select the most specific one.
 *     This prioritization ensures that detailed rules (e.g., those without `variety_type`
 *     or `sub_types` if a direct match is found) are applied correctly.
 *
 * 6.  **Retrieve Applicable Norms**:
 *     The `getNormsForCultivation` helper function is called with the `selectedStandard`
 *     and other relevant parameters (variety, derogation status, cultivation end date).
 *     This function applies a hierarchy of rules (sub-type periods, variety-specific,
 *     derogation-specific) to return the precise `NormsByRegion` object for the cultivation.
 *
 * 7.  **Calculate Final Norm Value**:
 *     From the `applicableNorms` object, the function retrieves the specific norms for the
 *     determined `region`. The final `normValue` is then selected: if the field is in an
 *     `is_nv_area`, the `nv_area` norm is used; otherwise, the `standard` norm is applied.
 *
 * This detailed process ensures that the calculated nitrogen usage norm is accurate and
 * compliant with RVO regulations, taking into account all relevant agricultural and
 * geographical factors.
 *
 * @see {@link https://www.rvo.nl/sites/default/files/2024-12/Tabel-2-Stikstof-landbouwgrond-2025_0.pdf | RVO Tabel 2 Stikstof landbouwgrond 2025} - Official document for nitrogen norms.
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiksnormen/stikstof-en-fosfaat/gebruiksnormen-stikstof | RVO Gebruiksnormen stikstof (official page)} - General information on nitrogen and phosphate norms.
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
