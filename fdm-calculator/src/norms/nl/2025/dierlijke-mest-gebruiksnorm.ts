import type { Field } from "@svenvw/fdm-core"
import { isFieldInNVGebied } from "./stikstofgebruiksnorm"
import type {
    DierlijkeMestGebruiksnormResult,
    NL2025NormsInput,
} from "./types.d"

/**
 * Determines if a field is located within a grondwaterbeschermingsgebied (GWBG) in the Netherlands.
 * This is achieved by performing a spatial query against a vector file containing
 * the boundaries of all GWBG-gebieden.
 *
 * @param b_centroid - An array containing the `longitude` and `latitude` of the field's centroid.
 *   This point is used to query the geographical data.
 * @returns A promise that resolves to `true` if the field's centroid is found within an GWBG-gebied,
 *   `false` otherwise.
 * @throws {Error} If there are issues fetching the file or processing its stream.
 */
export async function isFieldInGWGBGebied(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const url =
        "https://api.ellipsis-drive.com/v3/path/6e87a86a-4548-4bed-b47e-06a47e4b59fa/vector/timestamp/8780e629-668c-40fd-bbc0-4fa15e5557f7/location"

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
        throw new Error(`Error querying GWGB-Gebied : ${String(err)}`)
    }
}

/**
 * Determines the 'gebruiksnorm' (usage standard) for nitrogen from animal manure
 * for a given farm and parcel in the Netherlands for the year 2025.
 *
 * This function implements the rules and norms specified by the RVO for 2025,
 * taking into account derogation status and location within NV-gebieden.
 *
 * @param input - An object containing all necessary parameters for the calculation.
 *   See {@link DierlijkeMestGebruiksnormInput} for details.
 * @returns An object of type `DierlijkeMestGebruiksnormResult` containing the determined
 *   nitrogen usage standard (`normValue`) and a `normSource` string explaining the rule applied.
 *
 * @remarks
 * The rules for 2025 are as follows:
 * - **Standard Norm (No Derogation)**: If the farm does NOT have a derogation permit,
 *   the norm is 170 kg N/ha from animal manure.
 * - **Derogation Norm (With Derogation)**: If the farm HAS a derogation permit:
 *   - **Inside NV-Gebied**: If the parcel is located in a Nutriënt-Verontreinigd Gebied,
 *     the norm is 190 kg N/ha from animal manure.
 *   - **Outside NV-Gebied**: If the parcel is NOT located in a Nutriënt-Verontreinigd Gebied,
 *     the norm is 200 kg N/ha from animal manure.
 *
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiken-en-uitrijden/dierlijke-mest-landbouwgrond | RVO Hoeveel dierlijke mest landbouwgrond (official page)}
 * @see {@link https://www.rvo.nl/onderwerpen/mest/derogatie | RVO Derogatie (official page)}
 * @see {@link https://www.rvo.nl/onderwerpen/mest/met-nutrienten-verontreinigde-gebieden-nv-gebieden | RVO Met nutriënten verontreinigde gebieden (NV-gebieden) (official page)}
 */
export async function getNL2025DierlijkeMestGebruiksNorm(
    input: NL2025NormsInput,
): Promise<DierlijkeMestGebruiksnormResult> {
    const is_derogatie_bedrijf = input.farm.is_derogatie_bedrijf || false
    const field = input.field

    const is_nv_gebied = await isFieldInNVGebied(field.b_centroid)
    const is_gwbg_gebied = await isFieldInGWGBGebied(field.b_centroid)

    let normValue: number
    let normSource: string

    if (is_derogatie_bedrijf) {
        if (is_nv_gebied) {
            normValue = 190
            normSource = "Derogatie - NV Gebied"
        } else if (is_gwbg_gebied) {
            normValue = 170
            normSource = "Derogatie - Grondwaterbeschermingsgebied"
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
