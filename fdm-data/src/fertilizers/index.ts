import { getCatalogueSrm } from "./catalogues/srm"
import type { CatalogueFertilizer, CatalogueFertilizerName } from "./d"

/**
 * Retrieves a fertilizer catalogue based on the specified name.
 *
 * This function acts as a dispatcher, selecting and returning the appropriate
 * fertilizer catalogue based on the provided `catalogueName`.
 *
 * @param catalogueName - The name of the desired fertilizer catalogue.
 *                        Currently supported names are: "srm".
 * @returns An array of `CatalogueFertilizerItem` objects representing the
 *          requested fertilizer catalogue.
 * @throws {Error} Throws an error if the provided `catalogueName` is not
 *                 recognized or supported.
 *
 * @example
 * ```typescript
 * const srmCatalogue = getFertilizersCatalogue("srm");
 * console.log(srmCatalogue);
 * ```
 */
export async function getFertilizersCatalogue(
    catalogueName: CatalogueFertilizerName,
): Promise<CatalogueFertilizer> {
    // Get the specified catalogue
    if (catalogueName === "srm") {
        return await getCatalogueSrm()
    }
    throw new Error(`catalogue ${catalogueName} is not recognized`)
}
