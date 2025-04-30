import { Decimal } from "decimal.js"
import type {
    FertilizerDetails,
    FieldInput,
    NitrogenSupplyFertilizers,
} from "../../types"
import { calculateNitrogenSupplyByMineralFertilizers } from "./mineral"

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

    // Calculate the total amount of Nitrogen supplied by fertilizers
    const fertilizersTotal = fertilizersSupplyMineral.total

    const fertilizers = {
        total: fertilizersTotal,
        mineral: fertilizersSupplyMineral,
        organic: {
            total: Decimal(0),
            applications: [],
        },
        compost: {
            total: Decimal(0),
            applications: [],
        },
    }
    return fertilizers
}
