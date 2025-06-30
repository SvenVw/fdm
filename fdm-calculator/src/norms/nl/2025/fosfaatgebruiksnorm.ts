import type { CultivationCatalogue, FdmType } from "@svenvw/fdm-core"
import fosfaatNormsData from "./fosfaatgebruiksnorm-data.json"
import type {
    FosfaatGebruiksnormInput,
    FosfaatGebruiksnormResult,
    FosfaatKlasse,
    FosfaatNorm,
} from "./types.d"

/**
 * Determines if a cultivation is a type of grassland based on its catalogue entry.
 * @param fdm - An initialized FdmType instance for data access.
 * @param b_id_farm - The ID of the farm.
 * @param b_lu_catalogue - The cultivation catalogue code.
 * @returns A promise that resolves to a boolean.
 */
async function isCultivationGrasland(
    fdm: FdmType,
    b_id_farm: string,
    b_lu_catalogue: string,
): Promise<boolean> {
    const cultivationDetails = await fdm.getCultivationsFromCatalogue({
        b_id_farm,
        search_term: b_lu_catalogue,
    })

    return cultivationDetails.some(
        (c: Partial<CultivationCatalogue>) =>
            c.type === "grasland" ||
            c.type === "grasland_tijdelijk" ||
            c.type === "gras" ||
            c.type === "graszaad",
    )
}

/**
 * Helper function to determine the phosphate class ('Arm', 'Laag', 'Neutraal', 'Ruim', 'Hoog')
 * based on P-CaCl2 and P-Al soil analysis values and land type (grasland/bouwland).
 *
 * This logic is derived directly from "Tabel 1: Grasland (P-CaCl2/P-Al getal)" and
 * "Tabel 2: Bouwland (P-CaCl2/P-Al getal)" in the RVO documentation for 2025.
 *
 * @param a_p_cc - The P-CaCl2 (P-PAE) value from soil analysis.
 * @param a_p_al - The P-Al value from soil analysis.
 * @param is_grasland - True if the land is grassland, false if arable land.
 * @returns The determined `FosfaatKlasse`.
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiken-en-uitrijden/fosfaat-landbouwgrond/differentiatie | RVO Fosfaatdifferentiatie (official page)}
 */
function getFosfaatKlasse(
    a_p_cc: number,
    a_p_al: number,
    is_grasland: boolean,
): FosfaatKlasse {
    if (is_grasland) {
        // Logic for Grasland (Table 1)
        if (a_p_cc < 0.8) {
            if (a_p_al < 21) return "Arm"
            if (a_p_al <= 45) return "Laag"
            if (a_p_al <= 55) return "Neutraal"
            return "Ruim" // a_p_al > 55
        }
        if (a_p_cc <= 1.4) {
            if (a_p_al < 21) return "Arm"
            if (a_p_al <= 30) return "Laag"
            if (a_p_al <= 45) return "Neutraal"
            return "Ruim" // a_p_al > 45
        }
        if (a_p_cc <= 2.4) {
            if (a_p_al < 21) return "Laag"
            if (a_p_al <= 30) return "Neutraal"
            if (a_p_al <= 55) return "Ruim"
            return "Hoog" // a_p_al > 55
        }
        if (a_p_cc <= 3.4) {
            if (a_p_al < 21) return "Neutraal"
            if (a_p_al <= 45) return "Ruim"
            return "Hoog" // a_p_al > 45
        }
        // a_p_cc > 3.4
        if (a_p_al < 31) return "Ruim"
        return "Hoog" // a_p_al >= 31
    }

    // Logic for Bouwland (Table 2)
    if (a_p_cc < 0.8) {
        if (a_p_al < 46) return "Arm"
        return "Laag" // a_p_al >= 46
    }
    if (a_p_cc <= 1.4) {
        if (a_p_al < 46) return "Arm"
        if (a_p_al <= 55) return "Laag"
        return "Neutraal" // a_p_al > 55
    }
    if (a_p_cc <= 2.4) {
        if (a_p_al < 31) return "Arm"
        if (a_p_al <= 45) return "Laag"
        if (a_p_al <= 55) return "Neutraal"
        return "Ruim" // a_p_al > 55
    }
    if (a_p_cc <= 3.4) {
        if (a_p_al < 21) return "Arm"
        if (a_p_al <= 30) return "Laag"
        if (a_p_al <= 45) return "Neutraal"
        if (a_p_al <= 55) return "Ruim"
        return "Hoog" // a_p_al > 55
    }
    // a_p_cc > 3.4
    if (a_p_al < 31) return "Laag"
    if (a_p_al <= 45) return "Neutraal"
    if (a_p_al <= 55) return "Ruim"
    return "Hoog" // a_p_al > 55
}

/**
 * Determines the 'gebruiksnorm' (usage standard) for phosphate for a given field
 * based on its land type (grasland/bouwland) and soil phosphate condition,
 * derived from P-CaCl2 and P-Al soil analysis values.
 *
 * This function implements the "Tabel Fosfaatgebruiksnormen 2025" and the
 * "Differentiatie fosfaatgebruiksnorm 2025" rules from RVO.
 *
 * @param input - An object containing all necessary parameters for the calculation.
 *   See {@link FosfaatGebruiksnormInput} for details.
 * @returns An object of type `FosfaatGebruiksnormResult` containing the determined
 *   phosphate usage standard (`normValue`) and the `fosfaatKlasse` (the phosphate
 *   class determined from the soil analysis). Returns `null` if a norm cannot be determined.
 *
 * @remarks
 * The function operates as follows:
 * 1.  **Determine Phosphate Class**: The `getFosfaatKlasse` helper function is used
 *     to classify the soil's phosphate condition ('Arm', 'Laag', 'Neutraal', 'Ruim', 'Hoog')
 *     based on the provided `a_p_cc` and `a_p_al` values and whether it's grassland or arable land.
 *     This classification directly uses the lookup tables provided by RVO for 2025.
 * 2.  **Retrieve Base Norm**: The determined `fosfaatKlasse` is then used to look up the
 *     corresponding base phosphate norm from the `fosfaatNormsData.json` file.
 * 3.  **Apply Land Type**: The specific norm for either `grasland` or `bouwland` is selected
 *     from the base norm based on the `is_grasland` input parameter.
 * 4.  **Return Result**: The function returns the final `normValue` and the `fosfaatKlasse`.
 *
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiken-en-uitrijden/fosfaat-landbouwgrond | RVO Fosfaat landbouwgrond (official page)}
 * @see {@link https://www.rvo.nl/onderwerpen/mest/gebruiken-en-uitrijden/fosfaat-landbouwgrond/differentiatie | RVO Fosfaatdifferentiatie (official page, including tables for 2025)}
 */
export async function getNL2025FosfaatGebruiksNorm(
    input: FosfaatGebruiksnormInput,
): Promise<FosfaatGebruiksnormResult | null> {
    const { fdm, b_id_farm, b_lu_catalogue, a_p_cc, a_p_al } = input

    const is_grasland = await isCultivationGrasland(
        fdm,
        b_id_farm,
        b_lu_catalogue,
    )

    // Determine the phosphate class based on soil analysis values and land type.
    const fosfaatKlasse = getFosfaatKlasse(a_p_cc, a_p_al, is_grasland)

    // Retrieve the base norms for the determined phosphate class.
    const normsForKlasse = fosfaatNormsData[fosfaatKlasse]

    if (!normsForKlasse) {
        console.warn(`No phosphate norms found for class ${fosfaatKlasse}.`)
        return null
    }

    // Select the specific norm based on whether it's grassland or arable land.
    const normValue = is_grasland
        ? normsForKlasse.grasland
        : normsForKlasse.bouwland
    const normSource = is_grasland
        ? `Grasland: ${fosfaatKlasse}}`
        : `Bouwland: ${fosfaatKlasse}`

    return { normValue, normSource }
}
