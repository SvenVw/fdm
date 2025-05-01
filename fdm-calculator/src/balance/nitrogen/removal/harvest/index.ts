import type { HarvestableAnalysis } from "@svenvw/fdm-core"
import type {
    CultivationDetail,
    FieldInput,
    NitrogenRemovalHarvests,
} from "../../types"
import Decimal from "decimal.js"

export function calculateNitrogenRemovalByHarvests(
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    cultivationDetails: CultivationDetail[],
): NitrogenRemovalHarvests {
    const removalHarvests = harvests.map((harvest) => {
        const b_lu = harvest.b_lu

        const b_lu_catalogue = cultivations.find((cultivation) => {
            return cultivation.b_lu === b_lu
        })?.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw new Error(
                `Harvest ${harvest.b_id} has no corresponding cultivation in cultivations`,
            )
        }

        const cultivationDetail = cultivationDetails.find((detail) => {
            return detail.b_lu_catalogue === b_lu_catalogue
        })
        if (!cultivationDetail) {
            throw new Error(
                `Cultivation ${b_lu_catalogue} has no corresponding cultivation in cultivationDetails`,
            )
        }

        // Go through the analyses for a harvest to determine the amount of Nitrogen removed with this harvest (currently fdm-core only supports 1 harvestable per harvest)
        const removalsHarvest = harvest.harvestable.harvestableAnalyses.map(
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

                return removalHarvest
            },
        ) as Decimal[]

        let removalHarvest = removalsHarvest[0]

        // If multiple harvestable analyses exist take the average
        if (removalsHarvest.length > 1) {
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
