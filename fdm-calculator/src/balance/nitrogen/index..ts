import { Decimal } from "decimal.js"
import type {
    cultivationDetails,
    FertilizerDetails,
    FieldInput,
    NitrogenBalance,
    NitrogenBalanceField,
    NitrogenBalanceInput,
} from "./types"
import { calculateNitrogenSupply } from "./supply"
import { calculateNitrogenRemoval } from "./removal"
import { calculateNitrogenVolatilization } from "./volatilization"

export function calculateNitrogenBalance(
    nitrogenBalanceInput: NitrogenBalanceInput,
): NitrogenBalance {
    try {
        const fields = nitrogenBalanceInput.fields
        const fertilizerDetails = nitrogenBalanceInput.fertilizerDetails
        const cultivationDetails = nitrogenBalanceInput.cultivationDetails

        // Calculate for each field the nitrogen balance
        const fieldsWithBalance = fields.map((field: FieldInput) => {
            return calculateNitrogenBalanceField(
                field.field,
                // cultivations: field.cultivations,
                // harvests: field.harvests,
                // soilAnalyses: field.soilAnalyses,
                field.fertilizerApplications,
                fertilizerDetails,
                cultivationDetails,
            )
        })

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

export function calculateNitrogenBalanceField(
    field: Pick<FieldInput, "b_id" | "b_area">,
    fertilizerApplications: FieldInput["fertilizerApplications"],
    fertilizerDetails: FertilizerDetails[],
    cultivationDetails: cultivationDetails[],
): NitrogenBalanceField {
    // Get the details of the field
    const fieldDetails = field.field

    // Calculate the amount of Nitrogen supplied
    const supply = calculateNitrogenSupply(
        fertilizerApplications,
        fertilizerDetails,
    )

    // Calculate the amount of Nitrogen removed
    const removal = calculateNitrogenRemoval()

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
    // Calculate the farm area, so it can be used to correct the values for field size
    const farmArea = fields
        .map((field) => field.field.b_area)
        .reduce((a, b) => new Decimal(a).add(new Decimal(b)), Decimal(0))

    // Aggregate the supply, removal and volatilization
    const farmSupply = fieldsWithBalance
        .reduce((acc, field) => {
            return acc.add(field.supply.total.times(farmArea))
        }, Decimal(0))
        .dividedBy(farmArea)

    const farmRemoval = fieldsWithBalance
        .reduce((acc, field) => {
            return acc.add(field.removal.total.times(farmArea))
        }, Decimal(0))
        .dividedBy(farmArea)

    const farmVolatilization = fieldsWithBalance
        .reduce((acc, field) => {
            return acc.add(field.volatilization.ammonia.total.times(farmArea))
        }, Decimal(0))
        .dividedBy(farmArea)

    // Calculat the balance at farm level
    const farmBalance = farmSupply.minus(farmRemoval).minus(farmVolatilization)

    // Return the farm with balances
    const farmWithBalance = {
        balance: farmBalance,
        supply: farmSupply,
        removal: farmRemoval,
        volatilization: farmVolatilization,
        fields: fieldsWithBalance,
    }

    return farmWithBalance
}
