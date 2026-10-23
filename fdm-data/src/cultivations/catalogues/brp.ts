import type { CatalogueCultivation, CatalogueCultivationItem } from "../d"
import { hashCultivation } from "../hash"
import brp from "./brp.json"
import { getNmiCultivationPhosphate, type NmiCultivationPhosphate } from "./nmi"

/**
 * Retrieves the BRP (Basisregistratie Perceel) cultivation catalogue.
 *
 * This function parses the `brp.json` file, transforms its data into a structured
 * `CatalogueCultivation` array, and performs validation on the `b_lu_harvestable`
 * property of each cultivation item.
 *
 * When an NMI API key is provided, the phosphate contents of the harvestable product and the
 * crop residue (`b_lu_p_harvestable`, `b_lu_p_residue`, g P2O5 / kg DM) are added from the NMI API
 * cultivations lookup. Without a key, or for cultivations the NMI API does not know, these
 * values are `null`.
 *
 * @param options - Optional settings.
 * @param options.nmiApiKey - Bearer token for the NMI API, used to add the phosphate contents.
 * @returns An array of cultivation catalogue entries conforming to the `CatalogueCultivation` type.
 * @throws {Error} Throws an error if an invalid value is found for `b_lu_harvestable` in the JSON data,
 * or if an NMI API key is provided and the NMI API request fails.
 */
export async function getCatalogueBrp(options?: {
  nmiApiKey?: string
}): Promise<CatalogueCultivation> {
  const phosphate: Map<number, NmiCultivationPhosphate> = options?.nmiApiKey
    ? await getNmiCultivationPhosphate(options.nmiApiKey)
    : new Map()

  const catalogueBrpPromises = brp.map(async (cultivation) => {
    const cultivationPhosphate = phosphateForBrp(phosphate, cultivation.b_lu_catalogue)

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
    const validCroprotations = [
      "other",
      "clover",
      "nature",
      "potato",
      "grass",
      "rapeseed",
      "starch",
      "maize",
      "cereal",
      "sugarbeet",
      "alfalfa",
      "catchcrop",
    ]
    if (!validCroprotations.includes(cultivation.b_lu_croprotation)) {
      throw new Error(`Invalid value for b_lu_croprotation: ${cultivation.b_lu_croprotation}.`)
    }

    // Validate harvestcat
    const harvestcat =
      cultivation.b_lu_harvestcat !== "HC010" &&
      cultivation.b_lu_harvestcat !== "HC020" &&
      cultivation.b_lu_harvestcat !== "HC031" &&
      cultivation.b_lu_harvestcat !== "HC040" &&
      cultivation.b_lu_harvestcat !== "HC041" &&
      cultivation.b_lu_harvestcat !== "HC042" &&
      cultivation.b_lu_harvestcat !== "HC050" &&
      cultivation.b_lu_harvestcat !== null
        ? (() => {
            throw new Error(`Invalid value for b_lu_harvestcat: ${cultivation.b_lu_harvestcat}.`)
          })()
        : cultivation.b_lu_harvestcat

    // Transform to CatalogueCultivationItem
    const item: CatalogueCultivationItem = {
      b_lu_source: "brp",
      b_lu_catalogue: cultivation.b_lu_catalogue,
      b_lu_name: cultivation.b_lu_name,
      b_lu_name_en: cultivation.b_lu_name_en,
      b_lu_harvestable: harvestable,
      b_lu_hcat3: cultivation.b_lu_hcat3,
      b_lu_hcat3_name: cultivation.b_lu_hcat3_name,
      b_lu_croprotation: cultivation.b_lu_croprotation as any,
      b_lu_harvestcat: harvestcat,
      b_lu_yield: cultivation.b_lu_yield,
      b_lu_dm: cultivation.b_lu_dm,
      b_lu_hi: cultivation.b_lu_hi,
      b_lu_eom: cultivation.b_lu_eom,
      b_lu_eom_residue: cultivation.b_lu_eom_residue,
      b_lu_n_harvestable: cultivation.b_lu_n_harvestable,
      b_lu_n_residue: cultivation.b_lu_n_residue,
      b_lu_p_harvestable: cultivationPhosphate?.b_lu_p_harvestable ?? null,
      b_lu_p_residue: cultivationPhosphate?.b_lu_p_residue ?? null,
      b_n_fixation: cultivation.b_n_fixation,
      b_lu_rest_oravib: cultivation.b_lu_rest_oravib,
      b_lu_variety_options:
        cultivation.b_lu_variety_options != null
          ? cultivation.b_lu_variety_options
              .split("||")
              .map((s) => s.trim())
              .filter((s) => s.length > 0)
          : null,
      b_lu_start_default:
        typeof cultivation.b_lu_start_default === "string" &&
        /^(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(cultivation.b_lu_start_default.trim())
          ? cultivation.b_lu_start_default.trim()
          : null,
      b_date_harvest_default:
        typeof cultivation.b_date_harvest_default === "string" &&
        /^(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/.test(
          cultivation.b_date_harvest_default.trim(),
        )
          ? cultivation.b_date_harvest_default.trim()
          : null,
      hash: null,
    }

    // Hash the item
    item.hash = await hashCultivation(item)

    return item
  })

  const catalogueBrp = await Promise.all(catalogueBrpPromises)
  return catalogueBrp
}

/**
 * Looks up the NMI phosphate contents for a BRP catalogue id such as `nl_265`.
 */
function phosphateForBrp(
  phosphate: Map<number, NmiCultivationPhosphate>,
  b_lu_catalogue: string,
): NmiCultivationPhosphate | undefined {
  const code = Number(b_lu_catalogue.replace(/^nl_/, ""))
  return Number.isInteger(code) ? phosphate.get(code) : undefined
}
