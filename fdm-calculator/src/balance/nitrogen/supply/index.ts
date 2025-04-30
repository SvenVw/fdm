import { Decimal } from "decimal.js"
import type { FertilizerDetails, FieldInput, NitrogenSupply } from "../types"
import { calculateNitrogenSupplyByFertilizers } from "./fertilizers"

export function calculateNitrogenSupply(
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetails: FertilizerDetails[],
): NitrogenSupply {
    // Calculate the amount of Nitrogen supplied by fertilizers
    const fertilizersSupply = calculateNitrogenSupplyByFertilizers(
        fertilizerApplications,
        fertilizerDetails,
    )

    // Calculate the total amount of Nitrogen supplied
    const totalSupply = fertilizersSupply.total

    const supply = {
        total: totalSupply,
        fertilizers: fertilizersSupply,
        fixation: {
            total: Decimal(0),
            cultivations: [],
        },
        deposition: Decimal(0),
        mineralisation: Decimal(0),
    }

    return supply
}
