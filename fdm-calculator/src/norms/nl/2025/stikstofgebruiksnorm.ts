import type { Field } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import { nitrogenStandardsData } from "./stikstofgebruiksnorm-data"
import type {
    GebruiksnormResult,
    NitrogenStandard,
    NL2025NormsInput,
    NormsByRegion,
    RegionKey,
    NL2025NormsInputForCultivation,
} from "./types"
import { determineNL2025Hoofdteelt } from "./hoofdteelt"

/**
 * Determines if a field is located within a met nutriënten verontreinigde gebied (NV-gebied) in the Netherlands.
 * This is achieved by performing a spatial query against a vector file containing
 * the boundaries of all NV-gebieden.
 *
 * @param b_centroid - An array containing the `longitude` and `latitude` of the field's centroid.
 *   This point is used to query the geographical data.
 * @returns A promise that resolves to `true` if the field's centroid is found within an NV-gebied,
 *   `false` otherwise.
 * @throws {Error} If there are issues fetching the file or processing its stream.
 */
export async function isFieldInNVGebied(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const url =
        "https://api.ellipsis-drive.com/v3/path/992a7db3-01ea-4c8f-a172-268333e22706/vector/timestamp/1bc2cc57-e0dd-4f49-a290-f600780dd3fe/location"

    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    try {
        const params = new URLSearchParams()
        params.append("locations", `[[${longitude}, ${latitude}]]`)
        const response = await fetch(`${url}?${params.toString()}`)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
        }
        const json = await response.json()
        if (json.length > 0) {
            // Check if not single array response
            const feature = json[0][0]
            if (feature) {
                return true
            }
        }
        return false
    } catch (err) {
        throw new Error(`Error querying NV-Gebied : ${String(err)}`)
    }
}

/**
 * Determines the specific soil region (e.g., "zand_nwc", "zand_zuid", "klei", "veen", "loess") for a given field
 * based on its geographical coordinates. This is achieved by performing a spatial query
 * against a vector file containing the boundaries of grondsoortenkaart in de Meststoffenwet in the Netherlands.
 *
 * @param b_centroid - An array containing the `longitude` and `latitude` of the field's centroid.
 *   This point is used to query the geographical data.
 * @returns A promise that resolves to a `RegionKey` (e.g., "zand_nwc", "zand_zuid", "klei", "veen", "loess") if the
 *   field's centroid is found within a defined soil region.
 * @throws {Error} If there are issues fetching the file, processing its stream,
 *   or if the field's coordinates do not fall within any known region.
 *
 * @remarks
 * This function is critical for applying region-specific nitrogen norms, as these norms
 * vary based on soil type.
 */
export async function getRegion(
    b_centroid: Field["b_centroid"],
): Promise<RegionKey> {
    const url =
        "https://api.ellipsis-drive.com/v3/path/9d3c44e3-d737-492b-9358-4b26f6c2aeb3/vector/timestamp/89db219b-9d9d-42a6-b4a1-50728ab1d7cf/location"

    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    try {
        const params = new URLSearchParams()
        params.append("locations", `[[${longitude}, ${latitude}]]`)
        const response = await fetch(`${url}?${params.toString()}`)
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.statusText}`)
        }
        const json = await response.json()
        const feature = json[0][0]
        if (feature) {
            return feature.region as RegionKey
        }
    } catch (err) {
        throw new Error(`Error querying region: ${String(err)}`)
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
 * Calculates the "korting" (reduction) on the nitrogen usage norm based on the presence
 * of winter crops or catch crops in the previous year.
 *
 * @param cultivations - An array of cultivation objects for the current and previous year.
 * @param region - The soil region of the field (e.g., "zand_nwc", "zand_zuid", "loess").
 * @returns An object containing the reduction amount in kilograms of nitrogen per hectare (kg N/ha) and a description.
 */
function calculateKorting(
    cultivations: NL2025NormsInputForCultivation[],
    region: RegionKey,
): { amount: Decimal; description: string } {
    const currentYear = 2025
    const previousYear = currentYear - 1

    const sandyOrLoessRegions: RegionKey[] = ["zand_nwc", "zand_zuid", "loess"]

    // Check if field is outside regions with korting
    if (!sandyOrLoessRegions.includes(region)) {
        return {
            amount: new Decimal(0),
            description: ".",
        }
    }

    // Determine hoofdteelt for the current year (2025)
    const hoofdteelt2025 = determineNL2025Hoofdteelt(
        cultivations.filter((c) => c.b_lu_start.getFullYear() === currentYear),
    )
    const hoofdteelt2025Standard = nitrogenStandardsData.find((ns) =>
        ns.b_lu_catalogue_match.includes(hoofdteelt2025),
    )

    // Check for winterteelt exception (hoofdteelt of 2025 is winterteelt, sown in late 2024)
    if (hoofdteelt2025Standard?.is_winterteelt) {
        return {
            amount: new Decimal(0),
            description: ". Geen korting: winterteelt aanwezig",
        }
    }

    // Filter cultivations for the previous year (2024)
    const cultivations2024 = cultivations.filter(
        (c) => c.b_lu_start.getFullYear() === previousYear,
    )

    // Check for vanggewas exception in 2024
    const vanggewassen2024 = cultivations2024.filter((prevCultivation) => {
        const matchingStandard = nitrogenStandardsData.find((ns) =>
            ns.b_lu_catalogue_match.includes(prevCultivation.b_lu_catalogue),
        )
        const matchingYear =
            prevCultivation.b_lu_start.getTime() <
                new Date(currentYear, 1, 1).getTime() &&
            prevCultivation.b_lu_start.getTime() >
                new Date(previousYear, 6, 15).getTime() // Vanggewas should be sown between July 15th, 2024 and January 31th 2025
        return matchingStandard?.is_vanggewas === true && matchingYear === true
    })
    if (vanggewassen2024.length === 0) {
        return {
            amount: new Decimal(20),
            description: ". Korting: 20kg N/ha: geen vanggewas of winterteelt",
        }
    }

    // Check if a vanggewas is present to February 1st
    const vanggewassenCompleted2024 = vanggewassen2024.filter(
        (prevCultivation) => {
            return (
                prevCultivation.b_lu_end.getTime() >= new Date(currentYear, 1) // Month 1 is February
            )
        },
    )
    if (vanggewassenCompleted2024.length === 0) {
        return {
            amount: new Decimal(20),
            description:
                ". Korting: 20kg N/ha: vanggewas staat niet tot 1 februari",
        }
    }
    // If multiple vanggewassen are completed to February 1st select the vangewas that was first sown
    const sortedVanggewassen = vanggewassenCompleted2024.sort((a, b) => {
        return a.b_lu_start.getTime() - b.b_lu_start.getTime()
    })
    const vanggewas2024 = sortedVanggewassen[0]

    const sowDate = vanggewas2024.b_lu_start
    const october1 = new Date(previousYear, 9, 1) // October 1st
    const october15 = new Date(previousYear, 9, 15) // October 15th
    const november1 = new Date(previousYear, 10, 1) // November 1st

    let kortingAmount = new Decimal(20) // Default korting
    let kortingDescription =
        ". Korting: 20kg N/ha, geen vanggewas of te laat gezaaid"

    if (sowDate <= october1) {
        kortingAmount = new Decimal(0)
        kortingDescription =
            ". Geen korting: vanggewas gezaaid uiterlijk 1 oktober"
    } else if (sowDate > october1 && sowDate <= october15) {
        kortingAmount = new Decimal(5)
        kortingDescription =
            ". Korting: 5kg N/ha, vanggewas gezaaid tussen 2 t/m 14 oktober"
    } else if (sowDate > october15 && sowDate < november1) {
        kortingAmount = new Decimal(10)
        kortingDescription =
            ". Korting: 10kg N/ha, vanggewas gezaaid tussen 15 t/m 31 oktober"
    } else {
        kortingAmount = new Decimal(20)
        kortingDescription =
            ". Korting: 20kg N/ha, vanggewas gezaaid op of na 1 november"
    }

    return { amount: kortingAmount, description: kortingDescription }
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
 *   - `kortingDescription`: A description of any korting (reduction) applied to the norm.
 * Returns `null` if no matching standard or applicable norm can be found for the given input.
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
 *     Both functions use efficient spatial queries to retrieve this information.
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
 * 8.  **Apply "Korting" (Reduction)**:
 *     The `calculateKorting` function is called to determine if a reduction should be applied
 *     based on the previous year's cultivations and the field's region. The calculated
 *     `kortingAmount` is then subtracted from the `normValue`.
 *
 * This detailed process ensures that the calculated nitrogen usage norm is accurate and
 * compliant with RVO regulations, taking into account all relevant agricultural and
 * geographical factors.
 *
 * @see {@link https://www.rvo.nl/sites/default/files/2024-12/Tabel-2-Stikstof-landbouwgrond-2025_0.pdf | RVO Tabel 2 Stikstof landbouwgrond 2025} - Official document for nitrogen norms.
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiken-en-uitrijden/stikstof-en-fosfaat/gebruiksnormen-stikstof | RVO Gebruiksnormen stikstof (official page)} - General information on nitrogen and phosphate norms.
 */
export async function getNL2025StikstofGebruiksNorm(
    input: NL2025NormsInput,
): Promise<GebruiksnormResult> {
    const is_derogatie_bedrijf = input.farm.is_derogatie_bedrijf
    const field = input.field
    const cultivations = input.cultivations

    // Determine hoofdteelt
    const b_lu_catalogue = determineNL2025Hoofdteelt(cultivations)
    let cultivation = cultivations.find(
        (c) => c.b_lu_catalogue === b_lu_catalogue,
    )

    //Create cultivation in case of braak
    if (b_lu_catalogue === "nl_6794") {
        cultivation = {
            b_lu: "Groene braak, spontane opkomst",
            b_lu_catalogue: "nl_6794",
            b_lu_start: new Date("2025-01-01"),
            b_lu_end: new Date("2025-12-31"),
            b_lu_variety: null,
        }
    }
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
        throw new Error(
            `No matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue}.`,
        )
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
        throw new Error(
            `No specific matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue} with variety ${
                cultivation.b_lu_variety || "N/A"
            } in region ${region}.`,
        )
    }

    const applicableNorms = getNormsForCultivation(
        selectedStandard,
        cultivation.b_lu_variety,
        is_derogatie_bedrijf,
        cultivation.b_lu_end,
    )

    if (!applicableNorms) {
        throw new Error(
            `Applicable norms object is undefined for ${selectedStandard.cultivation_rvo_table2} in region ${region}.`,
        )
    }

    const normsForRegion: { standard: number; nv_area: number } =
        applicableNorms[region]

    if (!normsForRegion) {
        throw new Error(
            `No norms found for region ${region} for ${selectedStandard.cultivation_rvo_table2}.`,
        )
    }

    let normValue = is_nv_area
        ? normsForRegion.nv_area
        : normsForRegion.standard

    // Apply korting
    const { amount: kortingAmount, description: kortingDescription } =
        calculateKorting(cultivations, region)
    normValue = new Decimal(normValue).minus(kortingAmount).toNumber()

    return {
        normValue: normValue,
        normSource: `${selectedStandard.cultivation_rvo_table2}${kortingDescription}`,
    }
}
