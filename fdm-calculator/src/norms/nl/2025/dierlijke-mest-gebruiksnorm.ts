/**
 * Defines the input parameters required for the `getNL2025DierlijkeMestGebruiksNorm` function.
 */
export interface DierlijkeMestGebruiksnormInput {
  /**
   * A boolean indicating whether the farm has a derogation permit for 2025.
   * Farms with derogation may have higher animal manure nitrogen norms.
   */
  is_derogatie_bedrijf: boolean;
  /**
   * A boolean indicating whether the specific parcel of land is located within a
   * Nutriënt-Verontreinigd Gebied (NV-gebied). NV-areas have specific, often lower,
   * derogation norms.
   */
  is_nv_gebied: boolean;
}

/**
 * The result object returned by the `getNL2025DierlijkeMestGebruiksNorm` function,
 * containing the determined animal manure nitrogen usage norm and its source.
 */
export interface DierlijkeMestGebruiksnormResult {
  /**
   * The determined usage standard for nitrogen from animal manure in kg N per hectare.
   */
  normValue: number;
  /**
   * A descriptive string indicating which rule or category was applied to determine the norm.
   * Examples: "Standaard", "Derogatie - NV Gebied", "Derogatie - Buiten NV Gebied".
   */
  normSource: string;
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
export function getNL2025DierlijkeMestGebruiksNorm(
  input: DierlijkeMestGebruiksnormInput
): DierlijkeMestGebruiksnormResult {
  const { is_derogatie_bedrijf, is_nv_gebied } = input;

  let normValue: number;
  let normSource: string;

  if (is_derogatie_bedrijf) {
    if (is_nv_gebied) {
      normValue = 190;
      normSource = "Derogatie - NV Gebied";
    } else {
      normValue = 200;
      normSource = "Derogatie - Buiten NV Gebied";
    }
  } else {
    normValue = 170;
    normSource = "Standaard";
  }

  return { normValue, normSource };
}
