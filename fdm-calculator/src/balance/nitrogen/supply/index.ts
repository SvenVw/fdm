import { Decimal } from "decimal.js"
import type {
    cultivationDetails,
    FertilizerDetails,
    FieldInput,
    NitrogenSupply,
} from "../types"
import { calculateNitrogenSupplyByFertilizers } from "./fertilizers"
import { calculateNitrogenFixation } from "./fixation"

export function calculateNitrogenSupply(
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetails: cultivationDetails[],
    fertilizerDetails: FertilizerDetails[],
): NitrogenSupply {
    // Calculate the amount of Nitrogen supplied by fertilizers
    const fertilizersSupply = calculateNitrogenSupplyByFertilizers(
        fertilizerApplications,
        fertilizerDetails,
    )

    // Calculate the amount of Nitrogen fixated by the cultivations
    const fixationSupply = calculateNitrogenFixation(
        cultivations,
        cultivationDetails,
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
