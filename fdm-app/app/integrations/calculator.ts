import {
    calculateNitrogenBalance,
    calculateOrganicMatterBalance,
    collectInputForNitrogenBalance,
    collectInputForOrganicMatterBalance,
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
    getNitrogenBalanceField,
    getNutrientAdvice,
    getOrganicMatterBalanceField,
    type FieldInput,
    type NitrogenBalanceFieldResultNumeric,
    type NitrogenBalanceNumeric,
    type OrganicMatterBalanceFieldResultNumeric,
    type OrganicMatterBalanceNumeric,
} from "@svenvw/fdm-calculator"
import {
    type FdmType,
    type Field,
    type fdmSchema,
    getCultivations,
    getCurrentSoilData,
    type PrincipalId,
    type Timeframe,
} from "@svenvw/fdm-core"
import { getNmiApiKey } from "./nmi.server"

// Get nitrogen balance for a field
export async function getNitrogenBalanceForField({
    fdm,
    principal_id,
    b_id_farm,
    b_id,
    timeframe,
}: {
    fdm: FdmType
    principal_id: PrincipalId
    b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"]
    b_id: Field["b_id"]
    timeframe: Timeframe
}): Promise<NitrogenBalanceFieldResultNumeric> {
    const { fields, ...rest } = await collectInputForNitrogenBalance(
        fdm,
        principal_id,
        b_id_farm,
        timeframe,
        b_id,
    )

    if (fields.length === 0) {
        throw new Error(`Field ${b_id} not found for farm ${b_id_farm}`)
    }

    const nitrogenBalanceResult = await getNitrogenBalanceField(fdm, {
        fieldInput: fields[0],
        ...rest,
    })
    return {
        b_id: b_id,
        b_area: fields[0].field.b_area ?? 0,
        balance: nitrogenBalanceResult,
    }
}

export async function getNitrogenBalanceForFarm({
    fdm,
    principal_id,
    b_id_farm,
    timeframe,
}: {
    fdm: FdmType
    principal_id: PrincipalId
    b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"]
    timeframe: Timeframe
}): Promise<NitrogenBalanceNumeric> {
    const input = await collectInputForNitrogenBalance(
        fdm,
        principal_id,
        b_id_farm,
        timeframe,
    )

    return calculateNitrogenBalance(fdm, input)
}

// Get organic matter balance for a field
export async function getOrganicMatterBalanceForField({
    fdm,
    principal_id,
    b_id_farm,
    b_id,
    timeframe,
}: {
    fdm: FdmType
    principal_id: PrincipalId
    b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"]
    b_id: Field["b_id"]
    timeframe: Timeframe
}): Promise<{
    fieldResult: OrganicMatterBalanceFieldResultNumeric
    fieldInput: FieldInput
}> {
    const { fields, ...rest } = await collectInputForOrganicMatterBalance(
        fdm,
        principal_id,
        b_id_farm,
        timeframe,
        b_id,
    )

    if (fields.length === 0) {
        throw new Error(`Field ${b_id} not found for farm ${b_id_farm}`)
    }

    const organicMatterBalanceResult = await getOrganicMatterBalanceField(fdm, {
        fieldInput: fields[0],
        ...rest,
    })
    return {
        fieldResult: {
            b_id: b_id,
            b_area: fields[0].field.b_area ?? 0,
            balance: organicMatterBalanceResult,
        },
        fieldInput: fields[0],
    }
}

export async function getOrganicMatterBalanceForFarm({
    fdm,
    principal_id,
    b_id_farm,
    timeframe,
}: {
    fdm: FdmType
    principal_id: PrincipalId
    b_id_farm: fdmSchema.farmsTypeSelect["b_id_farm"]
    timeframe: Timeframe
}): Promise<OrganicMatterBalanceNumeric> {
    const input = await collectInputForOrganicMatterBalance(
        fdm,
        principal_id,
        b_id_farm,
        timeframe,
    )

    return calculateOrganicMatterBalance(fdm, input)
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
    b_id: Field["b_id"]
    b_centroid: Field["b_centroid"]
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
    let b_lu_catalogue: string | null

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
    b_id: Field["b_id"]
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
