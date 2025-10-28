import {
    collectInputForNitrogenBalance,
    getNitrogenBalance,
    type NitrogenBalanceNumeric,
} from "@svenvw/fdm-calculator"
import type { fdmSchema, FdmType, Timeframe } from "@svenvw/fdm-core"

// Get nitrogen balance for the field
export async function getNitrogenBalanceforField({
    fdm,
    principal_id,
    b_id_farm,
    b_id,
    timeframe,
}: {
    fdm: FdmType
    principal_id: string | string[]
    b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"]
    b_id: fdmSchema.fieldsTypeSelect["b_id"]
    timeframe: Timeframe
}): Promise<NitrogenBalanceNumeric> {
    try {
        const nitrogenBalanceInput = await collectInputForNitrogenBalance(
            fdm,
            principal_id,
            b_id_farm,
            timeframe,
            b_id,
        )

        const nitrogenBalanceResult = await getNitrogenBalance(
            fdm,
            nitrogenBalanceInput,
        )
        const nitrogenBalance = nitrogenBalanceResult.fields.find(
            (field: { b_id: string }) => field.b_id === b_id,
        )

        return nitrogenBalance
    } catch (err) {
        throw err
    }
}
