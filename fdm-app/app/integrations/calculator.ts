import {
    collectInputForNitrogenBalance,
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
    getNitrogenBalance,
    getNutrientAdvice,
    type NitrogenBalanceNumeric,
} from "@svenvw/fdm-calculator"
import {
    type Cultivation,
    type FdmType,
    type Field,
    type fdmSchema,
    getCultivations,
    getCurrentSoilData,
    type PrincipalId,
    type Timeframe,
} from "@svenvw/fdm-core"
import { getNmiApiKey } from "./nmi.server"

// Get nitrogen balance for the field
export async function getNitrogenBalanceforField({
    fdm,
    principal_id,
    b_id_farm,
    b_id,
    timeframe,
}: {
    fdm: FdmType
    principal_id: PrincipalId
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
    if (!nitrogenBalance) {
        throw new Error(`Nitrogen balance not found for field ${b_id}`)
    }

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
    principal_id: PrincipalId
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

export async function getNorms({
    fdm,
    principal_id,
    b_id,
}: {
    fdm: FdmType
    principal_id: PrincipalId
    b_id: Field.b_id
}) {
    const functionsForNorms = createFunctionsForNorms("NL", "2025")
    const functionsForFilling = createFunctionsForFertilizerApplicationFilling(
        "NL",
        "2025",
    )

    const normsInput = await functionsForNorms.collectInputForNorms(
        fdm,
        principal_id,
        b_id,
    )

    const [normManure, normPhosphate, normNitrogen] = await Promise.all([
        functionsForNorms.calculateNormForManure(fdm, normsInput),
        functionsForNorms.calculateNormForPhosphate(fdm, normsInput),
        functionsForNorms.calculateNormForNitrogen(fdm, normsInput),
    ])

    const fillingInput =
        await functionsForFilling.collectInputForFertilizerApplicationFilling(
            fdm,
            principal_id,
            b_id,
            normPhosphate.normValue,
        )

    const [fillingManure, fillingPhosphate, fillingNitrogen] =
        await Promise.all([
            functionsForFilling.calculateFertilizerApplicationFillingForManure(
                fdm,
                fillingInput,
            ),
            functionsForFilling.calculateFertilizerApplicationFillingForPhosphate(
                fdm,
                fillingInput,
            ),
            functionsForFilling.calculateFertilizerApplicationFillingForNitrogen(
                fdm,
                fillingInput,
            ),
        ])

    const norms = {
        value: {
            manure: normManure.normValue,
            phosphate: normPhosphate.normValue,
            nitrogen: normNitrogen.normValue,
        },
        filling: {
            manure: fillingManure.normFilling,
            phosphate: fillingPhosphate.normFilling,
            nitrogen: fillingNitrogen.normFilling,
        },
    }

    return norms
}
