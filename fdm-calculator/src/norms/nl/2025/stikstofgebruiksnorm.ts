import type { Field } from "@svenvw/fdm-core"
import nitrogenStandardsData from "./stikstofgebruiksnorm-data.json"

/**
 * Defines the structure for a single nitrogen standard entry,
 * based on the RVO's "Tabel 2 Stikstof landbouwgrond 2025" and related documents.
 * This interface supports various complexities like different norms for regions,
 * specific varieties, derogation status, and sub-types for temporary grasslands.
 */
interface NitrogenStandard {
    /**
     * The cultivation name as it appears in RVO's "Tabel 2 Stikstof landbouwgrond 2025".
     * This is used for descriptive purposes and as part of the function's return value.
     * @example "Grasland", "Akkerbouwgewassen, mais"
     */
    cultivation_rvo_table2: string
    /**
     * An array of BRP (Basisregistratie Percelen) cultivation codes that match this standard.
     * This allows a single standard entry to apply to multiple BRP codes.
     * @example ["nl_265", "nl_331"]
     */
    b_lu_catalogue_match: string[]
    /**
     * A general type classification for the cultivation (e.g., "grasland", "aardappel", "akkerbouw").
     * Used internally for conditional logic in norm determination.
     */
    type: string
    /**
     * Optional. A more specific classification for varieties, particularly for potatoes.
     * @example "consumptie_overig", "poot_overig"
     */
    variety_type?: string
    /**
     * Optional. A list of specific varieties that fall under this standard.
     * Used for filtering when a `b_lu_variety` is provided.
     */
    varieties?: string[]
    /**
     * Optional. The default nitrogen norms (standard and NV-area) per region.
     * This is the most common structure for norms.
     */
    norms?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. A list of varieties that qualify for a 'high norm' for certain crops (e.g., potatoes).
     */
    varieties_hoge_norm?: string[]
    /**
     * Optional. A list of varieties that qualify for a 'low norm' for certain crops (e.g., potatoes).
     */
    varieties_lage_norm?: string[]
    /**
     * Optional. Nitrogen norms specifically for 'high norm' varieties, per region.
     */
    norms_hoge_norm?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms specifically for 'low norm' varieties, per region.
     */
    norms_lage_norm?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms for 'other' varieties when specific high/low norms don't apply.
     */
    norms_overig?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms specifically for farms with derogation status, per region.
     * Applicable for certain crops like maize.
     */
    derogatie_norms?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. Nitrogen norms specifically for farms without derogation status, per region.
     * Applicable for certain crops like maize.
     */
    non_derogatie_norms?: {
        klei: { standard: number; nv_area: number }
        zand_nwc: { standard: number; nv_area: number }
        zand_zuid: { standard: number; nv_area: number }
        loss: { standard: number; nv_area: number }
        veen: { standard: number; nv_area: number }
    }
    /**
     * Optional. An array of sub-types for a cultivation, each with its own norms and period descriptions.
     * Used for crops like temporary grassland where norms vary based on the period of cultivation.
     */
    sub_types?: Array<{
        omschrijving?: string
        period_description?: string
        period_start_month?: number
        period_start_day?: number
        period_end_month?: number
        period_end_day?: number
        norms: {
            klei: { standard: number; nv_area: number }
            zand_nwc: { standard: number; nv_area: number }
            zand_zuid: { standard: number; nv_area: number }
            loss: { standard: number; nv_area: number }
            veen: { standard: number; nv_area: number }
        }
        // Note: winterteelt properties are removed from the top-level NitrogenStandard
        // but are kept here within sub_types if specific sub-periods have them.
        winterteelt_voor_31_12?: {
            klei: { standard: number; nv_area: number }
            zand_nwc: { standard: number; nv_area: number }
            zand_zuid: { standard: number; nv_area: number }
            loss: { standard: number; nv_area: number }
            veen: { standard: number; nv_area: number }
        }
        winterteelt_na_31_12?: {
            klei: { standard: number; nv_area: number }
            zand_nwc: { standard: number; nv_area: number }
            zand_zuid: { standard: number; nv_area: number }
            loss: { standard: number; nv_area: number }
            veen: { standard: number; nv_area: number }
        }
    }>
}

/**
 * Defines the valid keys for different soil regions in the Netherlands.
 */
type RegionKey = "klei" | "zand_nwc" | "zand_zuid" | "loss" | "veen"

/**
 * A utility type to represent nitrogen norms structured by region.
 */
type NormsByRegion = {
    [key in RegionKey]: { standard: number; nv_area: number }
}

/**
 * Placeholder function to determine if a field is in an NV-area.
 * In a real implementation, this would perform a spatial query.
 * @param _field - The field object, containing geometry or centroid.
 * @returns A promise that resolves to a boolean.
 */
async function isFieldInNVGebied(
    _field: Pick<Field, "b_id" | "b_centroid">,
): Promise<boolean> {
    // This function would typically use a service to check if the field's coordinates
    // fall within a designated NV-area. For now, it returns a default value.
    return Promise.resolve(false)
}

/**
 * The result object returned by the `getNL2025StikstofGebruiksNorm` function,
 * containing the calculated norm value and the name of the cultivation used for the calculation.
 */
export interface GebruiksnormResult {
    /**
     * The determined nitrogen usage standard in kg N per hectare.
     */
    normValue: number
    /**
     * The cultivation name according to RVO's "Tabel 2 Stikstof landbouwgrond 2025"
     * that was used to determine the legal limit.
     */
    normSource: string
}

/**
 * Placeholder for the function that determines the region based on latitude and longitude.
 * This function needs to be provided by the user.
 * For now, it returns a hardcoded 'klei' for demonstration purposes.
 * @param latitude - The latitude of the location.
 * @param longitude - The longitude of the location.
 * @returns The region key (e.g., 'klei', 'zand_nwc', 'loss').
 * @todo Implement actual region determination logic based on lat/lon.
 */
function getRegion(latitude: number, longitude: number): RegionKey {
    // This is a placeholder. User will provide the actual implementation.
    // Example logic:
    if (latitude > 52 && longitude > 5) return "zand_nwc" // Example: Northern/Western/Central Sand
    if (latitude < 52 && longitude > 5) return "zand_zuid" // Example: Southern Sand
    if (latitude > 51 && longitude < 5) return "klei" // Example: Clay
    if (latitude < 51 && longitude < 5) return "veen" // Example: Peat
    return "loss" // Default or fallback
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
export interface StikstofGebruiksnormInput {
    b_lu_catalogue: string
    field: Pick<Field, "b_id" | "b_centroid">
    b_lu_end: Date
    b_lu_variety?: string
    is_derogatie_bedrijf?: boolean
}

export async function getNL2025StikstofGebruiksNorm(
    input: StikstofGebruiksnormInput,
): Promise<GebruiksnormResult | null> {
    const {
        b_lu_catalogue,
        field,
        b_lu_end,
        b_lu_variety,
        is_derogatie_bedrijf,
    } = input

    const is_nv_area = await isFieldInNVGebied(field)
    const [longitude, latitude] = field.b_centroid

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

    const region = getRegion(latitude, longitude)

    // Handle specific cases for potatoes based on variety
    // This logic assumes that the b_lu_catalogue for potatoes will match one of the potato entries
    // and then the variety_type will further refine it.
    if (b_lu_variety) {
        const varietyLower = b_lu_variety.toLowerCase()
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
        if (b_lu_variety) {
            const varietyLower = b_lu_variety.toLowerCase() // Define varietyLower here
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
                b_lu_variety || "N/A"
            } in region ${region}.`,
        )
        return null
    }

    const applicableNorms = getNormsForCultivation(
        selectedStandard,
        b_lu_variety,
        is_derogatie_bedrijf,
        b_lu_end,
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
