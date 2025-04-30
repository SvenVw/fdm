import { Decimal } from "decimal.js"
import type { NitrogenBalance, NitrogenBalanceInput } from "./types"
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
        const fieldsWithBalance = fields.map((field) => {
            const fieldDetails = field.field
            const supply = calculateNitrogenSupply()
            const removal = calculateNitrogenRemoval()
            const volatilization = calculateNitrogenVolatilization()

            return {
                b_id: fieldDetails.b_id,
                balance: supply.total
                    .add(removal.total)
                    .add(volatilization.total),
                supply: supply,
                removal: removal,
                volatilization: volatilization,
            }
        })

        // Calculate the nitrogen balance for the farm
        const farmArea = fields
            .map((field) => field.field.b_area)
            .reduce((a, b) => new Decimal(a).add(new Decimal(b)), Decimal(0))

        const farmBalance = fieldsWithBalance
            .reduce((acc, field) => {
                return acc.add(field.balance.times(farmArea))
            }, Decimal(0))
            .dividedBy(farmArea)

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
                return acc.add(
                    field.volatilization.ammonia.total.times(farmArea),
                )
            }, Decimal(0))
            .dividedBy(farmArea)

        const farmWithBalance = {
            balance: farmBalance,
            supply: farmSupply,
            removal: farmRemoval,
            volatilization: farmVolatilization,
            fields: fieldsWithBalance,
        }

        return farmWithBalance
    } catch (error) {
        throw new Error(String(error))
    }
}
