/**
 * @file This module calculates the usage norm for nitrogen (`stikstofgebruiksnorm`) for the
 * Dutch regulations of 2025. It is a complex calculation that depends on the primary
 * cultivation, soil type, geographical location (e.g., NV areas), and farm status (e.g., derogation).
 *
 * It also includes logic for applying a "korting" (reduction) to the norm based on the
 * presence of catch crops in the previous year.
 *
 * @packageDocumentation
 */
import { type Field, withCalculationCache } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import pkg from "../../../../package"
import { getGeoTiffValue } from "../../../../shared/geotiff"
import { getFdmPublicDataUrl } from "../../../../shared/public-data-url"
import { determineNL2025Hoofdteelt } from "./hoofdteelt"
import { nitrogenStandardsData } from "./stikstofgebruiksnorm-data"
import type {
    GebruiksnormResult,
    NitrogenStandard,
    NL2025NormsInput,
    NL2025NormsInputForCultivation,
    NormsByRegion,
    RegionKey,
} from "./types"

/**
 * Determines if a field is located within a nutrient-polluted area (`NV-gebied`).
 *
 * This function queries a specific GeoTIFF file using the field's centroid coordinates. A return
 * value of `1` from the GeoTIFF indicates the field is within an NV area, which typically
 * results in a stricter (lower) nitrogen norm.
 *
 * @param b_centroid - The longitude and latitude of the field's centroid.
 * @returns A promise that resolves to `true` if the field is in an NV area, otherwise `false`.
 * @throws {Error} If the GeoTIFF data returns an unexpected value.
 */
export async function isFieldInNVGebied(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2025/nv.tiff`
    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    const NVGebiedCode = await getGeoTiffValue(url, longitude, latitude)

    switch (NVGebiedCode) {
        case 1: {
            return true
        }
        case 0: {
            return false
        }
        default: {
            throw new Error(
                `Unknown NV-gebied code: ${NVGebiedCode} for coordinates ${longitude}, ${latitude}`,
            )
        }
    }
}

/**
 * Determines the soil type region of a field based on its geographical coordinates.
 *
 * This function queries the official Dutch soil type map (`grondsoortenkaart`) to classify
 * the field into one of five regulatory regions: "klei", "loess", "veen", "zand_nwc", or "zand_zuid".
 * This classification is essential as nitrogen norms differ across these regions.
 *
 * @param b_centroid - The longitude and latitude of the field's centroid.
 * @returns A promise that resolves to the `RegionKey` representing the soil type.
 * @throws {Error} If the GeoTIFF data returns an unknown region code.
 */
export async function getRegion(
    b_centroid: Field["b_centroid"],
): Promise<RegionKey> {
    const fdmPublicDataUrl = getFdmPublicDataUrl()
    const url = `${fdmPublicDataUrl}norms/nl/2024/grondsoorten.tiff`
    const longitude = b_centroid[0]
    const latitude = b_centroid[1]
    const grondoortCode = await getGeoTiffValue(url, longitude, latitude)

    switch (grondoortCode) {
        case 1: {
            return "klei"
        }
        case 2: {
            return "loess"
        }
        case 3: {
            return "veen"
        }
        case 4: {
            return "zand_nwc"
        }
        case 5: {
            return "zand_zuid"
        }
        default: {
            throw new Error(
                `Unknown region code: ${grondoortCode} for coordinates ${longitude}, ${latitude}`,
            )
        }
    }
}

/**
 * Selects the appropriate set of regional norms for a cultivation from a `NitrogenStandard` object.
 *
 * This helper function applies a series of rules to find the correct `NormsByRegion` object
 * within a given standard, accounting for differentiation by sub-type. It first checks for a
 * direct match on the sub-type description and then falls back to time-based logic for
 * temporary grasslands. If no sub-types match, it returns the default norms from the standard.
 *
 * @param selectedStandard - The `NitrogenStandard` object for the primary cultivation.
 * @param b_lu_end - The end date of the cultivation, used for time-based sub-type matching.
 * @param subTypeOmschrijving - An optional string describing the specific sub-type,
 *   determined by `determineSubTypeOmschrijving`.
 * @returns The applicable `NormsByRegion` object, or `undefined` if no match is found.
 * @internal
 */
function getNormsForCultivation(
    selectedStandard: NitrogenStandard,
    b_lu_end: Date,
    subTypeOmschrijving?: string,
): NormsByRegion | undefined {
    if (selectedStandard.sub_types) {
        type SubType = NonNullable<NitrogenStandard["sub_types"]>[number]
        let matchingSubType: SubType | undefined

        // 1. Check for a direct match on omschrijving
        if (subTypeOmschrijving) {
            matchingSubType = selectedStandard.sub_types.find(
                (sub) => sub.omschrijving === subTypeOmschrijving,
            )
            if (matchingSubType) {
                return matchingSubType.norms
            }
        }

        // 2. Fallback to time-based logic for temporary grasslands if no omschrijving match
        const endDate = new Date(b_lu_end)
        matchingSubType = selectedStandard.sub_types.find((sub) => {
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
                if (sub.period_start_month > sub.period_end_month) {
                    endPeriod.setFullYear(endDate.getFullYear() + 1)
                }
                return endDate >= startPeriod && endDate <= endPeriod
            }
            return false
        })

        return matchingSubType?.norms
    }

    // Default case if no sub_types are defined
    return selectedStandard.norms
}

/**
 * Determines the specific sub-type description (`omschrijving`) for a cultivation.
 *
 * Many nitrogen standards are further differentiated into sub-types (e.g., winter vs. summer
 * varieties, first-year vs. subsequent years). This function contains the logic to identify
 * the correct sub-type based on context such as farm status, cultivation history, and
 * specific crop varieties.
 *
 * @param cultivation - The specific cultivation being analyzed.
 * @param standard - The general `NitrogenStandard` that matches the cultivation.
 * @param is_derogatie_bedrijf - A flag for the farm's derogation status.
 * @param cultivations - The full list of cultivations for the field, used for historical checks.
 * @param has_grazing_intention - A flag for the farm's grazing intention.
 * @returns The `omschrijving` of the matching sub-type, or `undefined` if none applies.
 * @internal
 */
function determineSubTypeOmschrijving(
    cultivation: NL2025NormsInputForCultivation,
    standard: NitrogenStandard,
    is_derogatie_bedrijf: boolean | undefined,
    cultivations: NL2025NormsInputForCultivation[],
    has_grazing_intention: boolean | undefined,
): string | undefined {
    // Grasland logic based on grazing intention
    if (standard.type === "grasland") {
        return has_grazing_intention ? "beweiden" : "volledig maaien"
    }

    // Potato logic based on variety
    if (standard.type === "aardappel") {
        if (cultivation.b_lu_variety) {
            const varietyLower = cultivation.b_lu_variety.toLowerCase()
            const subType = standard.sub_types?.find((sub) =>
                sub.varieties?.some((v) => v.toLowerCase() === varietyLower),
            )
            if (subType) {
                return subType.omschrijving
            }
        }

        // Fallback for potatoes is 'overig' if a variety is present but not in a specific list
        return standard.sub_types?.find((s) => s.omschrijving === "overig")
            ?.omschrijving
    }

    // Maize logic based on derogation status
    if (standard.cultivation_rvo_table2 === "Akkerbouwgewassen, mais") {
        return is_derogatie_bedrijf ? "derogatie" : "non-derogatie"
    }

    // Luzerne logic based on cultivation history
    if (standard.cultivation_rvo_table2 === "Akkerbouwgewassen, Luzerne") {
        const lucerneCultivationCodes = standard.b_lu_catalogue_match
        const hasLucernceCultivationInPreviousYear = cultivations.some(
            (c) =>
                lucerneCultivationCodes.includes(c.b_lu_catalogue) &&
                c.b_lu_start.getFullYear() <= 2024,
        )
        return hasLucernceCultivationInPreviousYear
            ? "volgende jaren"
            : "eerste jaar"
    }

    // Koolzaad logic based on specific BRP code
    if (standard.cultivation_rvo_table2 === "Akkerbouwgewassen, koolzaad") {
        if (cultivation.b_lu_catalogue === "nl_1922") return "winter"
        if (cultivation.b_lu_catalogue === "nl_1923") return "zomer"
    }

    // Gras voor industriële verwerking logic based on cultivation history
    if (
        standard.cultivation_rvo_table2 ===
        "Akkerbouwgewassen, Gras voor industriële verwerking"
    ) {
        const grasCultivationCodes = standard.b_lu_catalogue_match
        const hasGrasCultivationInPreviousYear = cultivations.some(
            (c) =>
                grasCultivationCodes.includes(c.b_lu_catalogue) &&
                c.b_lu_start.getFullYear() <= 2024,
        )
        return hasGrasCultivationInPreviousYear
            ? "inzaai voor 15 mei en volgende jaren"
            : "inzaai in september en eerste jaar"
    }

    // Graszaad, Engels raaigras logic based on cultivation history
    if (
        standard.cultivation_rvo_table2 ===
        "Akkerbouwgewassen, Graszaad, Engels raaigras"
    ) {
        const graszaadCultivationCodes = standard.b_lu_catalogue_match
        const hasGraszaadCultivationInPreviousYear = cultivations.some(
            (c) =>
                graszaadCultivationCodes.includes(c.b_lu_catalogue) &&
                c.b_lu_start.getFullYear() <= 2024,
        )
        return hasGraszaadCultivationInPreviousYear ? "overjarig" : "1e jaars"
    }

    // Roodzwenkgras logic based on cultivation history
    if (
        standard.cultivation_rvo_table2 === "Akkerbouwgewassen, Roodzwenkgras"
    ) {
        const roodzwenkgrasCultivationCodes = standard.b_lu_catalogue_match
        const hasRoodzwenkgrasCultivationInPreviousYear = cultivations.some(
            (c) =>
                roodzwenkgrasCultivationCodes.includes(c.b_lu_catalogue) &&
                c.b_lu_start.getFullYear() <= 2024,
        )
        return hasRoodzwenkgrasCultivationInPreviousYear
            ? "overjarig"
            : "1e jaars"
    }

    // Winterui (Onion) logic based on specific BRP codes
    if (
        standard.cultivation_rvo_table2 ===
        "Akkerbouwgewassen, Ui overig, zaaiui of winterui."
    ) {
        if (cultivation.b_lu_catalogue === "nl_1932") return "1e jaars"
        if (cultivation.b_lu_catalogue === "nl_1933") return "2e jaars"
    }

    // Bladgewassen logic based on hoofdteelt
    const bladgewasRvoTable2s = [
        "Bladgewassen, Spinazie",
        "Bladgewassen, Slasoorten",
        "Bladgewassen, Andijvie eerste teelt volgteelt",
    ]

    if (bladgewasRvoTable2s.includes(standard.cultivation_rvo_table2)) {
        const hoofdteeltCatalogue = determineNL2025Hoofdteelt(cultivations)
        if (cultivation.b_lu_catalogue === hoofdteeltCatalogue) {
            return "1e teelt"
        }
        // TODO: Implement volgteelt logic here later
    }

    /*
     * --- Cultivations with Unclear Differentiation Logic (may require matching on b_lu string or external context): ---
     * - Bladgewassen, Bladgewassen overig (e.g., "eenmalige oogst" vs. "meermalige oogst")
     * - Kruiden (differentiating between bladgewas, wortelgewassen, zaadgewassen)
     * - Bloembollengewassen, Iris (e.g., "grofbollig" vs. "fijnbollig")
     * - Bloembollengewassen, Krokus (e.g., "grote gele" vs. "overig")
     * - Bloembollengewassen, Gladiool (e.g., "pitten" vs. "kralen")
     */

    return undefined
}

/**
 * Calculates the nitrogen norm reduction (`korting`) for fields in sandy or loess regions.
 *
 * This function implements the regulation that applies a reduction to the nitrogen norm if no
 * catch crop or winter crop was present in the preceding autumn and winter. The amount of the
 * reduction depends on the sowing date of the catch crop.
 *
 * @param cultivations - An array of cultivations for the current and previous years.
 * @param region - The soil region of the field.
 * @returns An object containing the `amount` of the reduction (in kg N/ha) and a `description`
 *   explaining the reason for the reduction (or lack thereof).
 * @internal
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
                prevCultivation.b_lu_end === null ||
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
 * Calculates the nitrogen usage norm for a specific field for the year 2025.
 *
 * This is the main function for determining the nitrogen norm. It orchestrates a multi-step
 * process that includes:
 * 1.  Identifying the primary cultivation (`hoofdteelt`).
 * 2.  Determining the field's geographical context (soil type and NV area status).
 * 3.  Finding the matching nitrogen standard from the regulations.
 * 4.  Refining the standard based on specific sub-types (e.g., crop variety, farm status).
 * 5.  Selecting the final norm value based on the region and NV status.
 * 6.  Applying a `korting` (reduction) if applicable.
 *
 * @param input - A standardized object containing all necessary farm, field, and cultivation data.
 * @returns A promise that resolves to an object containing the final `normValue` (in kg N/ha)
 *   and a detailed `normSource` string explaining how the value was derived.
 * @throws {Error} If any step in the process fails, such as not finding a matching norm.
 */
export async function calculateNL2025StikstofGebruiksNorm(
    input: NL2025NormsInput,
): Promise<GebruiksnormResult> {
    const is_derogatie_bedrijf = input.farm.is_derogatie_bedrijf
    const has_grazing_intention = input.farm.has_grazing_intention
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
    const matchingStandards: NitrogenStandard[] = nitrogenStandardsData.filter(
        (ns: NitrogenStandard) =>
            ns.b_lu_catalogue_match.includes(b_lu_catalogue),
    )

    if (matchingStandards.length === 0) {
        throw new Error(
            `No matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue}.`,
        )
    }

    // Prioritize exact matches if multiple exist (e.g., for specific potato types)
    let selectedStandard: NitrogenStandard | undefined

    if (matchingStandards.length === 1) {
        selectedStandard = matchingStandards[0]
    } else if (matchingStandards.length > 1) {
        // If multiple standards match b_lu_catalogue, try to find a more specific one
        // This could be based on sub_types with specific omschrijving or varieties
        selectedStandard =
            matchingStandards.find((ns) =>
                ns.sub_types?.some((sub) => sub.omschrijving || sub.varieties),
            ) || matchingStandards[0] // Fallback to the first if no specific sub_type is found
    }

    if (!selectedStandard) {
        throw new Error(
            `No specific matching nitrogen standard found for b_lu_catalogue ${b_lu_catalogue} with variety ${
                cultivation.b_lu_variety || "N/A"
            } in region ${region}.`,
        )
    }

    // Determine the sub-type omschrijving
    const subTypeOmschrijving = determineSubTypeOmschrijving(
        cultivation,
        selectedStandard,
        is_derogatie_bedrijf,
        cultivations,
        has_grazing_intention,
    )

    const applicableNorms = getNormsForCultivation(
        selectedStandard,
        cultivation.b_lu_end,
        subTypeOmschrijving,
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

    let normValue = new Decimal(
        is_nv_area ? normsForRegion.nv_area : normsForRegion.standard,
    )

    // Apply korting
    const { amount: kortingAmount, description: kortingDescription } =
        calculateKorting(cultivations, region)
    normValue = new Decimal(normValue).minus(kortingAmount)

    // If normvalue is negative, e.g. Geen plaatsingsruimte plus korting, set it to 0
    if (normValue.isNegative()) {
        normValue = new Decimal(0)
    }

    const subTypeText = subTypeOmschrijving ? ` (${subTypeOmschrijving})` : ""
    return {
        normValue: normValue.toNumber(),
        normSource: `${selectedStandard.cultivation_rvo_table2}${subTypeText}${kortingDescription}`,
    }
}

/**
 * A cached version of the `calculateNL2025StikstofGebruiksNorm` function.
 *
 * This function enhances performance by caching the results of the norm calculation.
 * The cache key is generated based on the function's input and the calculator's version,
 * ensuring that the cache is invalidated when the underlying logic or data changes.
 *
 * @param input - A standardized object containing all necessary farm, field, and cultivation data.
 * @returns A promise that resolves to an object containing the final `normValue` and `normSource`.
 */
export const getNL2025StikstofGebruiksNorm = withCalculationCache(
    calculateNL2025StikstofGebruiksNorm,
    "calculateNL2025StikstofGebruiksNorm",
    pkg.calculatorVersion,
)
