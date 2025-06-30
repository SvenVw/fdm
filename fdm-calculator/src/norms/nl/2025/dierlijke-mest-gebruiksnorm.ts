import type { Field } from "@svenvw/fdm-core"
import type {
    DierlijkeMestGebruiksnormInput,
    DierlijkeMestGebruiksnormResult,
} from "./types.d"

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
    input: DierlijkeMestGebruiksnormInput,
): Promise<DierlijkeMestGebruiksnormResult> {
    const { is_derogatie_bedrijf, field } = input

    const is_nv_gebied = await isFieldInNVGebied(field)

    let normValue: number
    let normSource: string

    if (is_derogatie_bedrijf) {
        if (is_nv_gebied) {
            normValue = 190
            normSource = "Derogatie - NV Gebied"
        } else {
            normValue = 200
            normSource = "Derogatie - Buiten NV Gebied"
        }
    } else {
        normValue = 170
        normSource = "Standaard"
    }

    return { normValue, normSource }
}
