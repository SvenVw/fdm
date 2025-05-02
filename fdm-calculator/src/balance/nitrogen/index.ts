import { Decimal } from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalance,
    NitrogenBalanceField,
    NitrogenBalanceInput,
} from "./types"
import { calculateNitrogenSupply } from "./supply"
import { calculateNitrogenRemoval } from "./removal"
import { calculateNitrogenVolatilization } from "./volatilization"

export async function calculateNitrogenBalance(
    nitrogenBalanceInput: NitrogenBalanceInput,
): Promise<NitrogenBalance> {
    try {
        // Destructure input directly
        const {
            fields,
            fertilizerDetails,
            cultivationDetails,
            fdmPublicDataUrl,
            timeFrame,
        } = nitrogenBalanceInput

        // Pre-process details into Maps for efficient lookups
        const fertilizerDetailsMap = new Map(
            fertilizerDetails.map((detail) => [detail.p_id_catalogue, detail]),
        )
        const cultivationDetailsMap = new Map(
            cultivationDetails.map((detail) => [detail.b_lu_catalogue, detail]),
        )

        // Calculate for each field the nitrogen balance
        const fieldsWithBalance = await Promise.all(fields.map(async (field: FieldInput) => {
            return await calculateNitrogenBalanceField(
                field.field,
                field.cultivations,
                field.harvests,
                field.soilAnalyses,
                field.fertilizerApplications,
                fertilizerDetailsMap,
                cultivationDetailsMap,
                timeFrame,
                fdmPublicDataUrl,
            )
        }))

        // Aggregate the field balances to farm level
        const farmWithBalance = calculateNitrogenBalancesFieldToFarm(
            fieldsWithBalance,
            fields,
        )

        return farmWithBalance
    } catch (error) {
        throw new Error(String(error))
    }
}

export async function calculateNitrogenBalanceField(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalyses: FieldInput["soilAnalyses"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: NitrogenBalanceInput["fdmPublicDataUrl"],
): Promise<NitrogenBalanceField> {
    // Get the details of the field
    const fieldDetails = field

    // Calculate the amount of Nitrogen supplied
    const supply = await calculateNitrogenSupply(
        field,
        cultivations,
        fertilizerApplications,
        soilAnalyses,
        cultivationDetailsMap,
        fertilizerDetailsMap,
        timeFrame,
        fdmPublicDataUrl,
    )

    // Calculate the amount of Nitrogen removed
    const removal = calculateNitrogenRemoval(
        cultivations,
        harvests,
        cultivationDetailsMap,
    )

    // Calculate the amount of Nitrogen that is volatilized
    const volatilization = calculateNitrogenVolatilization()

    return {
        b_id: fieldDetails.b_id,
        balance: supply.total.add(removal.total).add(volatilization.total),
        supply: supply,
        removal: removal,
        volatilization: volatilization,
    }
}

export function calculateNitrogenBalancesFieldToFarm(
    fieldsWithBalance: NitrogenBalanceField[],
    fields: FieldInput[],
) {
    // Calculate the total farm area
    const totalFarmArea = fields.reduce(
        (sum, field) => sum.add(new Decimal(field.field.b_area)),
        Decimal(0),
    )

    // Calculate total weighted supply, removal, and volatilization across the farm
    let totalFarmSupply = Decimal(0)
    let totalFarmRemoval = Decimal(0)
    let totalFarmVolatilization = Decimal(0)

    for (const fieldBalance of fieldsWithBalance) {
        const fieldInput = fields.find(
            (f) => f.field.b_id === fieldBalance.b_id,
        )

        if (!fieldInput) {
            // Should not happen if inputs are consistent, but good to handle
            console.warn(
                `Could not find field input for field balance ${fieldBalance.b_id}`,
            )
            continue // Skip this iteration if fieldInput is not found
        }
        const fieldArea = new Decimal(fieldInput.field.b_area)

        totalFarmSupply = totalFarmSupply.add(
            fieldBalance.supply.total.times(fieldArea),
        )
        totalFarmRemoval = totalFarmRemoval.add(
            fieldBalance.removal.total.times(fieldArea),
        )
        totalFarmVolatilization = totalFarmVolatilization.add(
            fieldBalance.volatilization.total.times(fieldArea),
        )
    }

    // Calculate average values per hectare for the farm
    const avgFarmSupply = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmSupply.dividedBy(totalFarmArea)
    const avgFarmRemoval = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmRemoval.dividedBy(totalFarmArea)
    const avgFarmVolatilization = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmVolatilization.dividedBy(totalFarmArea)

    // Calculate the average balance at farm level (Supply + Removal + Volatilization)
    const avgFarmBalance = avgFarmSupply
        .add(avgFarmRemoval)
        .add(avgFarmVolatilization)

    // Return the farm with average balances per hectare
    const farmWithBalance = {
        balance: avgFarmBalance,
        supply: avgFarmSupply,
        removal: avgFarmRemoval,
        volatilization: avgFarmVolatilization,
        fields: fieldsWithBalance,
    }

    return farmWithBalance
}
