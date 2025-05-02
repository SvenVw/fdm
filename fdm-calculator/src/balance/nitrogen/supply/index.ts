import { Decimal } from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalanceInput,
    NitrogenSupply,
} from "../types"
import { calculateNitrogenSupplyByFertilizers } from "./fertilizers"
import { calculateNitrogenFixation } from "./fixation"
import { calculateNitrogenSupplyByDeposition } from "./deposition"

export async function calculateNitrogenSupply(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    cultivationDetailsMap: Map<string, CultivationDetail>,
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: NitrogenBalanceInput["fdmPublicDataUrl"],
): Promise<NitrogenSupply> {
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

    const depositionSupply = await calculateNitrogenSupplyByDeposition(
        field,
        timeFrame,
        fdmPublicDataUrl,
    )

    // Calculate the total amount of Nitrogen supplied
    const totalSupply = fertilizersSupply.total
        .add(fixationSupply.total)
        .add(depositionSupply.total)

    const supply = {
        total: totalSupply,
        fertilizers: fertilizersSupply,
        fixation: fixationSupply,
        deposition: depositionSupply,
        mineralisation: Decimal(0),
    }

    return supply
}
