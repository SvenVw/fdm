import type { Field } from "@svenvw/fdm-core"
import { isFieldInNVGebied } from "./stikstofgebruiksnorm"
import type {
    DierlijkeMestGebruiksnormResult,
    NL2025NormsInput,
} from "./types.d"

const FETCH_TIMEOUT_MS = 8000

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

    const params = new URLSearchParams()
    params.append("locations", `[[${longitude}, ${latitude}]]`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
        const response = await fetch(`${url}?${params.toString()}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
        })
        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
            )
        }
        const json = await response.json()
        const feature = json?.[0]?.[0]
        return Boolean(feature)
    } catch (err) {
        if ((err as any)?.name === "AbortError") {
            throw new Error(
                `Timeout querying GWGB-Gebied after ${FETCH_TIMEOUT_MS}ms`,
            )
        }
        throw new Error(`Error querying GWGB-Gebied : ${String(err)}`)
    } finally {
        clearTimeout(timeout)
    }
}

/**
 * Determines if a field is located within a Natura 2000 in the Netherlands.
 * This is achieved by performing a spatial query against a vector file containing
 * the boundaries of all natura200-gebieden, including the 100m buffer.
 *
 * @param b_centroid - An array containing the `longitude` and `latitude` of the field's centroid.
 *   This point is used to query the geographical data.
 * @returns A promise that resolves to `true` if the field's centroid is found within an natura2000-gebied or within 100m buffer,
 *   `false` otherwise.
 * @throws {Error} If there are issues fetching the file or processing its stream.
 */
export async function isFieldInNatura2000Gebied(
    b_centroid: Field["b_centroid"],
): Promise<boolean> {
    const url =
        "https://api.ellipsis-drive.com/v3/path/153b4c2f-d250-4edd-ab19-9320245de431/vector/timestamp/ce0e4ac3-42aa-4e85-a321-9561ffa1183e/location"

    const longitude = b_centroid[0]
    const latitude = b_centroid[1]

    const params = new URLSearchParams()
    params.append("locations", `[[${longitude}, ${latitude}]]`)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

    try {
        const response = await fetch(`${url}?${params.toString()}`, {
            headers: { Accept: "application/json" },
            signal: controller.signal,
        })
        if (!response.ok) {
            throw new Error(
                `Failed to fetch ${url}: ${response.status} ${response.statusText}`,
            )
        }
        const json = await response.json()
        const feature = json?.[0]?.[0]
        return Boolean(feature)
    } catch (err) {
        if ((err as any)?.name === "AbortError") {
            throw new Error(
                `Timeout querying Natura2000-Gebied after ${FETCH_TIMEOUT_MS}ms`,
            )
        }
        throw new Error(`Error querying Natura2000-Gebied : ${String(err)}`)
    } finally {
        clearTimeout(timeout)
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
 *   - **Inside Natura2000-Gebied**: If the parcel is located in a Natura200-Gebied or within 100m of it,
 *     the norm is 170 kg N/ha from animal manure.
 *   - **Inside GWBG-Gebied**: If the parcel is located in a GWBG Gebied or within 100m of it,
 *     the norm is 170 kg N/ha from animal manure.
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

    const [is_nv_gebied, is_gwbg_gebied, is_natura2000_gebied] =
        await Promise.all([
            isFieldInNVGebied(field.b_centroid),
            isFieldInGWGBGebied(field.b_centroid),
            isFieldInNatura2000Gebied(field.b_centroid),
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
