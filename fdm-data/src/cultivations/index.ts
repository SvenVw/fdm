import type {
  AggregatedCultivationCatalogueInfo,
  CatalogueCultivation,
  CatalogueCultivationName,
} from "./d"
/* eslint-disable typescript/restrict-template-expressions -- Crop names and catalogue IDs are mapped and stringified safely in the domain lists. */
import { aggregateCultivationCatalogueInfoBrp, getCatalogueBrp } from "./catalogues/brp"

/**
 * Aggregates info from all the cultivation catalogues, which is needed to build the
 * final catalogue for syncing.
 *
 * For example, b_lu_ya_min and b_lu_ya_max are derived from the catalogues and are
 * used to determine when to set b_lu_ya to null.
 *
 * This function should not take the catalogue names as an argument since we don't
 * want values in the final catalogue that are derived from the aggregated values to
 * vary according to which catalogues were requested.
 *
 * @returns aggregated info.
 */
export async function aggregateCultivationCatalogueInfo(): Promise<AggregatedCultivationCatalogueInfo> {
  const aggregates = await Promise.allSettled([aggregateCultivationCatalogueInfoBrp()])
  const rejected = aggregates.find((item) => item.status === "rejected")
  if (rejected) {
    throw rejected.reason
  }
  const fulfilled = aggregates as PromiseFulfilledResult<AggregatedCultivationCatalogueInfo>[]
  const filtered_b_lu_ya_min = fulfilled
    .map((r) => r.value.b_lu_ya_min)
    .filter((x) => typeof x === "number")
  const filtered_b_lu_ya_max = fulfilled
    .map((r) => r.value.b_lu_ya_max)
    .filter((x) => typeof x === "number")
  return {
    b_lu_ya_min: filtered_b_lu_ya_min.length > 0 ? Math.min(...filtered_b_lu_ya_min) : undefined,
    b_lu_ya_max: filtered_b_lu_ya_max.length > 0 ? Math.max(...filtered_b_lu_ya_max) : undefined,
  }
}

/**
 * Retrieves a cultivation catalogue based on the specified name.
 *
 * This function acts as a dispatcher, selecting and returning the appropriate
 * cultivation catalogue based on the provided `catalogueName`.
 *
 * @param catalogueName - The name of the desired cultivation catalogue.
 *                        Currently supported names are: "brp".
 * @returns An array of `CatalogueCultivationItem` objects representing the
 *          requested cultivation catalogue.
 * @returns A Promise that resolves to an array of `CatalogueCultivationItem` objects.
 * @throws {Error} Throws an error if the provided `catalogueName` is not
 *                 recognized or supported.
 *
 * @example
 * ```typescript
 * const brpCatalogue = await getCultivationCatalogue("brp");
 * console.log(brpCatalogue);
 * ```
 */
export async function getCultivationCatalogue(
  catalogueName: CatalogueCultivationName,
): Promise<CatalogueCultivation> {
  // Get the specified catalogue
  if (catalogueName === "brp") {
    const aggregatedInfo = await aggregateCultivationCatalogueInfo()
    return await getCatalogueBrp(aggregatedInfo)
  }

  throw new Error(`catalogue ${catalogueName} is not recognized`)
}
