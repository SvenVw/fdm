/**
 * @file This module calculates the amount of nitrogen removed from a field through the
 * harvesting of crops.
 *
 * The primary function, `calculateNitrogenRemovalByHarvests`, processes all harvest
 * events to determine the total nitrogen exported in the harvested biomass.
 *
 * @packageDocumentation
 */
import type { HarvestableAnalysis } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenRemovalHarvests,
} from "../types"

/**
 * Calculates the total nitrogen removed from a field via crop harvests.
 *
 * This function iterates through each harvest event and calculates the amount of nitrogen
 * contained within the harvested product. The calculation for each harvest is based on:
 * - The yield of the harvested crop (`b_lu_yield`).
 * - The nitrogen concentration of the harvested material (`b_lu_n_harvestable`).
 *
 * It uses harvest-specific analysis data when available, falling back to default values
 * from the cultivation catalogue if necessary. The function then aggregates the nitrogen
 * removal from all harvests to provide a total.
 *
 * @param cultivations - An array of all cultivations on the field, used to link harvests to cultivation data.
 * @param harvests - An array of all harvest events to be analyzed.
 * @param cultivationDetailsMap - A map providing detailed data for each cultivation type, including
 *   default yield and nitrogen content.
 * @returns An object detailing total and per-harvest nitrogen removal.
 * @throws {Error} If a harvest event cannot be linked to a valid cultivation or if cultivation details are missing.
 */
export function calculateNitrogenRemovalByHarvests(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
): NitrogenRemovalHarvests {
    if (harvests.length === 0) {
        return {
            total: new Decimal(0),
            harvests: [],
        }
    }
    const removalHarvests = harvests.map((harvest) => {
        const b_lu = harvest.b_lu

        const b_lu_catalogue = cultivations.find((cultivation) => {
            return cultivation.b_lu === b_lu
        })?.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw new Error(
                `Harvest ${harvest.b_id_harvesting}: cultivation with b_lu '${b_lu}' is missing b_lu_catalogue`,
            )
        }

        // Get details of cultivation using the Map
        const cultivationDetail = cultivationDetailsMap.get(b_lu_catalogue)

        if (!cultivationDetail) {
            throw new Error(
                `Cultivation ${b_lu_catalogue} has no corresponding cultivation in cultivationDetails`,
            )
        }

        // Go through the analyses for a harvest to determine the amount of Nitrogen removed with this harvest (currently fdm-core only supports 1 harvestable per harvest)
        const removalsHarvest = harvest.harvestable.harvestable_analyses.map(
            (harvestAnalysis: HarvestableAnalysis): Decimal => {
                // Collect yield from input or use default value or use default value of the cultivation
                let b_lu_yield = harvestAnalysis.b_lu_yield
                if (!b_lu_yield) {
                    b_lu_yield = cultivationDetail.b_lu_yield
                }

                // Collect Nitrogen content of harvestable from input or use default value of the cultivation
                let b_lu_n_harvestable = harvestAnalysis.b_lu_n_harvestable
                if (!b_lu_n_harvestable) {
                    b_lu_n_harvestable = cultivationDetail.b_lu_n_harvestable
                }

                const removalHarvest = new Decimal(b_lu_yield)
                    .times(new Decimal(b_lu_n_harvestable))
                    .dividedBy(new Decimal(1000)) // Convert from g N / ha to kg N / ha
                    .times(-1) // Return negative value

                return removalHarvest
            },
        ) as Decimal[]

        let removalHarvest = new Decimal(0)
        if (removalsHarvest.length === 1) {
            removalHarvest = removalsHarvest[0]
        } else if (removalsHarvest.length > 1) {
            // If multiple harvestable analyses exist take the average
            removalHarvest = removalsHarvest
                .reduce((a, b) => a.add(b), new Decimal(0))
                .dividedBy(new Decimal(removalsHarvest.length))
        }
        return {
            id: harvest.b_id_harvesting,
            value: removalHarvest,
        }
    })

    // Calculate the total amount of Nitrogen removed by harvests
    const totalValue = removalHarvests.reduce((acc, harvest) => {
        return acc.add(harvest.value)
    }, new Decimal(0))

    return {
        total: totalValue,
        harvests: removalHarvests,
    }
}
