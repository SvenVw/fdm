import type { CatalogueCultivation, CatalogueCultivationItem } from "../d"
import { hashCultivation } from "../hash"
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
export async function getCatalogueBrp(): Promise<CatalogueCultivation> {
    const catalogueBrpPromises = brp.map(async (cultivation) => {
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

        // Validate b_lu_croprotation
        cultivation.b_lu_croprotation !== "other" &&
        cultivation.b_lu_croprotation !== "clover" &&
        cultivation.b_lu_croprotation !== "nature" &&
        cultivation.b_lu_croprotation !== "potato" &&
        cultivation.b_lu_croprotation !== "grass" &&
        cultivation.b_lu_croprotation !== "rapeseed" &&
        cultivation.b_lu_croprotation !== "starch" &&
        cultivation.b_lu_croprotation !== "maize" &&
        cultivation.b_lu_croprotation !== "cereal" &&
        cultivation.b_lu_croprotation !== "sugarbeet" &&
        cultivation.b_lu_croprotation !== "alfalfa" &&
        cultivation.b_lu_croprotation !== "catchcrop"
            ? (() => {
                  throw new Error(
                      `Invalid value for b_lu_croprotation: ${cultivation.b_lu_croprotation}.`,
                  )
              })()
            : cultivation.b_lu_croprotation

        // Transform to CatalogueCultivationItem
        const item: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: cultivation.b_lu_catalogue,
            b_lu_name: cultivation.b_lu_name,
            b_lu_name_en: cultivation.b_lu_name_en,
            b_lu_harvestable: harvestable,
            b_lu_hcat3: cultivation.b_lu_hcat3,
            b_lu_hcat3_name: cultivation.b_lu_hcat3_name,
            b_lu_croprotation: cultivation.b_lu_croprotation,
            b_lu_yield: cultivation.b_lu_yield,
            b_lu_hi: cultivation.b_lu_hi,
            b_lu_n_harvestable: cultivation.b_lu_n_harvestable,
            b_lu_n_residue: cultivation.b_lu_n_residue,
            b_n_fixation: cultivation.b_n_fixation,
            b_lu_rest_oravib: cultivation.b_lu_rest_oravib,
            b_lu_variety_options:
                cultivation.b_lu_variety_options != null
                    ? cultivation.b_lu_variety_options
                          .split("||")
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0)
                    : null,
            b_lu_start_default: cultivation.b_lu_start_default,
            b_date_harvest_default: cultivation.b_date_harvest_default,
            hash: null,
        }

        // Hash the item
        item.hash = await hashCultivation(item)

        return item
    })

    const catalogueBrp = await Promise.all(catalogueBrpPromises)
    return catalogueBrp
}
