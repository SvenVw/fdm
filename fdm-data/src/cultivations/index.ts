/**
 * @file This file provides an entry point for accessing cultivation catalogues.
 *
 * It exports a `getCultivationCatalogue` function that retrieves a cultivation catalogue by name.
 */
import { getCatalogueBrp } from "./catalogues/brp"
import type { CatalogueCultivation, CatalogueCultivationName } from "./d"

/**
 * Retrieves a cultivation catalogue by name.
 *
 * @param catalogueName The name of the catalogue to retrieve.
 * @returns A promise that resolves to the cultivation catalogue.
 * @throws An error if the catalogue name is not recognized.
 */
export async function getCultivationCatalogue(
    catalogueName: CatalogueCultivationName,
): Promise<CatalogueCultivation> {
    // Get the specified catalogue
    if (catalogueName === "brp") {
        return await getCatalogueBrp()
    }

    throw new Error(`catalogue ${catalogueName} is not recognized`)
}
