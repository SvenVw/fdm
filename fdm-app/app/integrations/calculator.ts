/**
 * @file This module serves as an integration layer between the FDM application and the
 * `@svenvw/fdm-calculator` package. It provides high-level functions that orchestrate
 * data fetching from `@svenvw/fdm-core` and then call the appropriate calculation
 * functions.
 *
 * These functions are typically used within Remix loaders to compute data for specific routes.
 *
 * @packageDocumentation
 */
import {
    collectInputForNitrogenBalance,
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
    getNitrogenBalance,
    getNutrientAdvice,
    type NitrogenBalanceNumeric,
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
import { getNmiApiKey } from "./nmi"

/**
 * Calculates the nitrogen balance for a single field.
 *
 * @param params - The input parameters for the calculation.
 * @returns A promise that resolves to the `NitrogenBalanceNumeric` object for the specified field.
 * @throws {Error} If the nitrogen balance for the field cannot be found in the results.
 */
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
    b_id: Field["b_id"]
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

/**
 * Fetches nutrient advice for a single field from the NMI API.
 *
 * @param params - The input parameters for the request.
 * @returns A promise that resolves to the nutrient advice object.
 */
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

    // TODO: Replace this with `determineNL2025Hoofdteelt` for more accurate cultivation selection.
    const b_lu_catalogue = cultivations.length
        ? cultivations[0].b_lu_catalogue
        : null

    const nutrientAdvice = await getNutrientAdvice(fdm, {
        b_lu_catalogue: b_lu_catalogue,
        b_centroid: b_centroid,
        currentSoilData: currentSoilData,
        nmiApiKey: nmiApiKey,
    })

    return nutrientAdvice
}

/**
 * Calculates both the regulatory norms and the actual usage (filling) for a single field.
 *
 * This function handles the Dutch 2025 regulations for nitrogen, phosphate, and animal manure.
 *
 * @param params - The input parameters for the calculation.
 * @returns A promise that resolves to an object containing the `value` (the norm) and the `filling` (the usage)
 *   for manure, phosphate, and nitrogen.
 */
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

    // Collect data and calculate norm values.
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

    // Collect data and calculate norm fillings.
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

    return {
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
}
