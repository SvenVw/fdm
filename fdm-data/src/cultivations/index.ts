import type { CatalogueCultivation, CatalogueCultivationName } from "./d"
/* eslint-disable typescript/restrict-template-expressions -- Crop names and catalogue IDs are mapped and stringified safely in the domain lists. */
import { getCatalogueBrp } from "./catalogues/brp"

/**
 * Retrieves a cultivation catalogue based on the specified name.
 *
 * This function acts as a dispatcher, selecting and returning the appropriate
 * cultivation catalogue based on the provided `catalogueName`.
 *
 * @param catalogueName - The name of the desired cultivation catalogue.
 *                        Currently supported names are: "brp".
 * @param options - Optional settings.
 * @param options.nmiApiKey - Bearer token for the NMI API. When provided, the phosphate contents
 *                            (`b_lu_p_harvestable`, `b_lu_p_residue`) are retrieved from the NMI API;
 *                            otherwise they are `null`.
 * @returns An array of `CatalogueCultivationItem` objects representing the
 *          requested cultivation catalogue.
 * @returns A Promise that resolves to an array of `CatalogueCultivationItem` objects.
 * @throws {Error} Throws an error if the provided `catalogueName` is not
 *                 recognized or supported.
 *
 * @example
 * ```typescript
 * const brpCatalogue = await getCultivationCatalogue("brp");
 * const brpWithPhosphate = await getCultivationCatalogue("brp", { nmiApiKey });
 * ```
 */
export async function getCultivationCatalogue(
  catalogueName: CatalogueCultivationName,
  options?: { nmiApiKey?: string },
): Promise<CatalogueCultivation> {
  // Get the specified catalogue
  if (catalogueName === "brp") {
    return await getCatalogueBrp(options)
  }

  throw new Error(`catalogue ${catalogueName} is not recognized`)
}
