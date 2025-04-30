import { Decimal } from "decimal.js"
import type {
    FertilizerDetails,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../../types"
import { calculateNitrogenSupplyByMineralFertilizers } from "./mineral"
import { calculateNitrogenSupplyByManure } from "./manure"

export function calculateNitrogenSupplyByFertilizers(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetails: FertilizerDetails[],
): NitrogenSupplyFertilizers {
    // Calculate the amount of Nitrogen supplied by mineral fertilizers
    const fertilizersSupplyMineral =
        calculateNitrogenSupplyByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetails,
        )

    // Calculate the amount of Nitrogen supplied by manure
    const fertilizersSupplyManure = calculateNitrogenSupplyByManure(
        fertilizerApplications,
        fertilizerDetails,
    )

    // Calculate the total amount of Nitrogen supplied by fertilizers
    const fertilizersTotal = fertilizersSupplyMineral.total.add(
        fertilizersSupplyManure.total,
    )

    const fertilizers = {
        total: fertilizersTotal,
        mineral: fertilizersSupplyMineral,
        manure: fertilizersSupplyManure,
        compost: {
            total: Decimal(0),
            applications: [],
        },
    }
    return fertilizers
}
