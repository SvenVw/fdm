import {
    collectInputForNitrogenBalance,
    getNitrogenBalance,
    getNutrientAdvice,
    type NitrogenBalanceNumeric,
} from "@svenvw/fdm-calculator"
import {
    Cultivation,
    Field,
    getCultivations,
    getCurrentSoilData,
    type fdmSchema,
    type FdmType,
    type Timeframe,
} from "@svenvw/fdm-core"
import { getNmiApiKey } from "./nmi"

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
    b_id: Field.b_id
    timeframe: Timeframe
}): Promise<NitrogenBalanceNumeric> {
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
}

export async function getNutrientAdviceForField({
    fdm,
    principal_id,
    b_id,
    b_centroid,
    timeframe,
}: {
    fdm: FdmType
    principal_id: string | string[]
    b_id: Field.b_id
    b_centroid: Field.b_centroid
    timeframe: Timeframe
}) {
    const nmiApiKey = getNmiApiKey()

    const currentSoilData = await getCurrentSoilData(fdm, principal_id, b_id)

    const cultivations = await getCultivations(
        fdm,
        principal_id,
        b_id,
        timeframe,
    )
    let b_lu_catalogue: Cultivation.b_lu_catalogue

    if (!cultivations.length) {
        b_lu_catalogue = null
    } else {
        // For now take the first cultivation
        // TODO: Replace this with hoofdteelt
        b_lu_catalogue = cultivations[0].b_lu_catalogue
    }

    const nutrientAdvice = await getNutrientAdvice(fdm, {
        b_lu_catalogue: b_lu_catalogue,
        b_centroid: b_centroid,
        currentSoilData: currentSoilData,
        nmiApiKey: nmiApiKey,
    })

    return nutrientAdvice
}
