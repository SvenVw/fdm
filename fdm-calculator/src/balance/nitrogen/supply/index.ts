import { Decimal } from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenSupply,
} from "../types"
import { calculateNitrogenSupplyByFertilizers } from "./fertilizers"
import { calculateNitrogenFixation } from "./fixation"

export function calculateNitrogenSupply(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
): NitrogenSupply {
    // Calculate the amount of Nitrogen supplied by fertilizers
    const fertilizersSupply = calculateNitrogenSupplyByFertilizers(
        fertilizerApplications,
        fertilizerDetailsMap,
    )

    // Calculate the amount of Nitrogen fixated by the cultivations
    const fixationSupply = calculateNitrogenFixation(
        cultivations,
        cultivationDetailsMap,
    )

    // Calculate the total amount of Nitrogen supplied
    const totalSupply = fertilizersSupply.total.add(fixationSupply.total)

    const supply = {
        total: totalSupply,
        fertilizers: fertilizersSupply,
        fixation: fixationSupply,
        deposition: Decimal(0),
        mineralisation: Decimal(0),
    }

    return supply
}
