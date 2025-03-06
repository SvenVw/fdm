import type { CatalogueCultivation, CatalogueCultivationItem } from "../d"
import brp from "./brp.json"

/**
 * Retrieves the BRP (Basisregistratie Perceel) cultivation catalogue.
 *
 * This function parses the `brp.json` file, transforms its data into a structured
 * `CatalogueCultivation` array, and performs validation on the `b_lu_harvestable`
 * property of each cultivation item.
 *
 * @returns An array of cultivation catalogue entries conforming to the `CatalogueCultivation` type.
 * @throws {Error} Throws an error if an invalid value is found for `b_lu_harvestable` in the JSON data.
 */
export function getCatalogueBrp(): CatalogueCultivation {
    const catalogueBrp = brp.map((cultivation) => {
        // Validate b_lu_harvestable
        const harvestable =
            cultivation.b_lu_harvestable !== "once" &&
            cultivation.b_lu_harvestable !== "multiple" &&
            cultivation.b_lu_harvestable !== "none"
                ? (() => {
                      throw new Error(
                          `Invalid value for b_lu_harvestable: ${cultivation.b_lu_harvestable}. Expected 'eenmalig', 'meermalig' or 'niet'`,
                      )
                  })()
                : cultivation.b_lu_harvestable

        const item: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: cultivation.b_lu_catalogue,
            b_lu_name: cultivation.b_lu_name,
            b_lu_name_en: cultivation.b_lu_name_en,
            b_lu_harvestable: harvestable,
            b_lu_hcat3: cultivation.b_lu_hcat3,
            b_lu_hcat3_name: cultivation.b_lu_hcat3_name,
        }
        return item
    })

    return catalogueBrp
}
