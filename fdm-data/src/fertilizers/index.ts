/**
 * @file This file provides an entry point for accessing fertilizer catalogues.
 *
 * It exports a `getFertilizersCatalogue` function that retrieves a fertilizer catalogue by name.
 */
import { getCatalogueBaat } from "./catalogues/baat"
import { getCatalogueSrm } from "./catalogues/srm"
import type { CatalogueFertilizer, CatalogueFertilizerName } from "./d"

/**
 * Retrieves a fertilizer catalogue by name.
 *
 * @param catalogueName The name of the catalogue to retrieve.
 * @returns A promise that resolves to the fertilizer catalogue.
 * @throws An error if the catalogue name is not recognized.
 */
export async function getFertilizersCatalogue(
    catalogueName: CatalogueFertilizerName,
): Promise<CatalogueFertilizer> {
    // Get the specified catalogue
    if (catalogueName === "srm") {
        return await getCatalogueSrm()
    }
    if (catalogueName === "baat") {
        return await getCatalogueBaat()
    }
    throw new Error(`catalogue ${catalogueName} is not recognized`)
}
