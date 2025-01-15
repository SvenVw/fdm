import {
    type FdmType,
    addCultivationToCatalogue,
    type fdmSchema,
    getCultivationsFromCatalogue,
} from "@svenvw/fdm-core"
import { getCatalogueBrp } from "./catalogues/brp"

/**
 * Extends the cultivations catalogue in the Farm Data Model (FDM) with data from a specified source.
 *
 * @param fdm - An instance of the FDM, providing database access.
 * @param catalogueName - The name of the catalogue to extend. Currently, only 'brp' is supported.
 *
 * @throws An error if the specified catalogue name is not recognized.
 */
export async function extendCultivationsCatalogue(
    fdm: FdmType,
    catalogueName: string,
): Promise<void> {
    // Get the specified catalogue
    let catalogue: fdmSchema.cultivationsCatalogueTypeInsert[] = []
    if (catalogueName == "brp") {
        catalogue = getCatalogueBrp()
    }

    // Check if specified catalogue exist
    if (catalogue.length === 0) {
        throw new Error(`catalogue ${catalogueName} is not recognized`)
    }

    // Get list of cultivations from catalogue
    const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)

    // Add cultivations to catalogue
    try {
        await Promise.all(
            catalogue.map(async (cultivation) => {
                // Check if cultivation is already present in catalogue
                const cultivationInCatalogue = cultivationsCatalogue.find(
                    (x: fdmSchema.cultivationsCatalogueTypeSelect) =>
                        x.b_lu_catalogue === cultivation.b_lu_catalogue,
                )

                // If cultivation is not present in catalogue, add it to fdm instance
                // TODO: Update values if they differ
                if (!cultivationInCatalogue) {
                    await addCultivationToCatalogue(fdm, {
                        b_lu_catalogue: cultivation.b_lu_catalogue,
                        b_lu_source: cultivation.b_lu_source,
                        b_lu_name: cultivation.b_lu_name,
                        b_lu_name_en: cultivation.b_lu_name_en,
                        b_lu_hcat3: cultivation.b_lu_hcat3,
                        b_lu_hcat3_name: cultivation.b_lu_hcat3_name,
                    })
                }
            }),
        )
    } catch (error) {
        throw new Error(
            `Failed to extend cultivations catalogue: ${(error as Error).message}`,
        )
    }
}
