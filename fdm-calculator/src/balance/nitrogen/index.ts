import type { fdmSchema } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import {
    calculateBulkDensity,
    calculateCarbonNitrogenRatio,
    calculateOrganicCarbon,
    calculateOrganicMatter,
} from "../../conversions/soil"
import { getFdmPublicDataUrl } from "../../shared/public-data-url"
import { calculateNitrogenEmission } from "./emission"
import { calculateNitrogenRemoval } from "./removal"
import { calculateNitrogenSupply } from "./supply"
import { calculateAllFieldsNitrogenSupplyByDeposition } from "./supply/deposition"
import { calculateTargetForNitrogenBalance } from "./target"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalance,
    NitrogenBalanceField,
    NitrogenBalanceFieldResult,
    NitrogenBalanceFieldNumeric,
    NitrogenBalanceInput,
    NitrogenBalanceNumeric,
    SoilAnalysisPicked,
} from "./types"

/**
 * Calculates the nitrogen balance for a set of fields, considering nitrogen supply, removal, and emission.
 *
 * This function takes comprehensive input data, including field details, fertilizer information,
 * and cultivation practices, to provide a detailed nitrogen balance analysis. It processes each field
 * individually and then aggregates the results to provide an overall farm-level balance.
 *
 * @param nitrogenBalanceInput - The input data for the nitrogen balance calculation, including fields, fertilizer details, and cultivation details.
 * @returns A promise that resolves with the calculated nitrogen balance, with numeric values as numbers.
 * @throws Throws an error if any of the calculations fail.
 */
export async function calculateNitrogenBalance(
    nitrogenBalanceInput: NitrogenBalanceInput,
): Promise<NitrogenBalanceNumeric> {
    // Destructure input directly
    const { fields, fertilizerDetails, cultivationDetails, timeFrame } =
        nitrogenBalanceInput

    // Set the link to location of FDM public data
    const fdmPublicDataUrl = getFdmPublicDataUrl()

    // Pre-process details into Maps for efficient lookups
    const fertilizerDetailsMap = new Map(
        fertilizerDetails.map((detail) => [detail.p_id_catalogue, detail]),
    )
    const cultivationDetailsMap = new Map(
        cultivationDetails.map((detail) => [detail.b_lu_catalogue, detail]),
    )

    // Fetch all deposition data in a single, batched request to avoid requesting the GeoTIIF for every field
    const depositionByField =
        await calculateAllFieldsNitrogenSupplyByDeposition(
            fields,
            timeFrame,
            fdmPublicDataUrl,
        )

    // Process fields in batches to control concurrency.
    // Instead of running all fields in parallel with Promise.all, which can
    // overwhelm the server for farms with many fields, we process them in
    // smaller, manageable chunks. This provides more stable performance.
    const batchSize = 50 // A sensible default, can be tuned based on profiling.
    const fieldsWithBalanceResults: NitrogenBalanceFieldResult[] = []
    let hasErrors = false
    const fieldErrorMessages: string[] = []

    for (let i = 0; i < fields.length; i += batchSize) {
        const batch = fields.slice(i, i + batchSize)
        const batchPromises = batch.map(async (field: FieldInput) => {
            const depositionSupply = depositionByField.get(field.field.b_id)
            if (!depositionSupply) {
                // This should not happen if the deposition calculation is correct
                hasErrors = true
                fieldErrorMessages.push(
                    `Deposition data not found for field ${field.field.b_id}`,
                )
                return {
                    b_id: field.field.b_id,
                    b_area: field.field.b_area ?? 0,
                    errorMessage: `Deposition data not found for field ${field.field.b_id}`,
                }
            }

            return calculateNitrogenBalanceField(
                field.field,
                field.cultivations,
                field.harvests,
                field.fertilizerApplications,
                field.soilAnalyses,
                fertilizerDetailsMap,
                cultivationDetailsMap,
                timeFrame,
                depositionSupply,
            )
        })

        const batchResults = await Promise.all(batchPromises)
        fieldsWithBalanceResults.push(...batchResults)
    }

    // Aggregate the field balances to farm level
    const farmWithBalanceDecimal = calculateNitrogenBalancesFieldToFarm(
        fieldsWithBalanceResults,
        fields,
        hasErrors,
        fieldErrorMessages,
    )

    // Convert the final result to use numbers instead of Decimals
    return convertNitrogenBalanceToNumeric(farmWithBalanceDecimal)
}

/**
 * Calculates the nitrogen balance for a single field, considering nitrogen supply, removal, and emission.
 *
 * This function performs a detailed calculation of the nitrogen balance for a single field,
 * taking into account various sources of nitrogen supply (e.g., fertilizers, mineralization),
 * nitrogen removal (e.g., harvest, crop residues), and nitrogen losses through emission.
 *
 * The calculation relies on detailed input parameters, including:
 *   - field characteristics
 *   - cultivation details
 *   - harvest yields and nitrogen content
 *   - fertilizer applications and their nitrogen contributions
 *   - soil analysis data
 *
 * @param field - The field to calculate the nitrogen balance for.
 * @param cultivations - The cultivations on the field.
 * @param harvests - The harvests from the field.
 * @param fertilizerApplications - The fertilizer applications on the field.
 * @param soilAnalyses - The soil analyses for the field.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer.
 * @param cultivationDetailsMap - A map containing details for each cultivation.
 * @param timeFrame - The time frame for the calculation.
 * @param depositionSupply - The pre-calculated nitrogen supply from deposition.
 * @returns The calculated nitrogen balance for the field, or an error message if the calculation fails.
 */
export function calculateNitrogenBalanceField(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalyses: FieldInput["soilAnalyses"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
    depositionSupply: NitrogenBalanceField["supply"]["deposition"],
): NitrogenBalanceFieldResult {
    try {
    const fieldDetails = field

        // Get the details of the field
        const fieldDetails = field

        // Combine soil analyses
        const soilAnalysis = combineSoilAnalyses(soilAnalyses)

        // Use a field-local timeframe (intersection with input timeframe)
        const timeFrameField = {
            start:
                field.b_start &&
                field.b_start.getTime() > timeFrame.start.getTime()
                    ? field.b_start
                    : timeFrame.start,
            end:
                field.b_end &&
                field.b_end.getTime() < timeFrame.end.getTime()
                    ? field.b_end
                    : timeFrame.end,
        }
        // Normalize: ensure start <= end
        if (timeFrameField.end.getTime() < timeFrameField.start.getTime()) {
            // Clamp to an empty interval at the boundary to signal “no overlap”
            timeFrameField.end = timeFrameField.start
        }

        // Calculate the amount of Nitrogen supplied
        const supply = calculateNitrogenSupply(
            cultivations,
            fertilizerApplications,
            soilAnalysis,
            cultivationDetailsMap,
            fertilizerDetailsMap,
            depositionSupply,
            timeFrameField,
        )

        // Calculate the amount of Nitrogen removed
        const removal = calculateNitrogenRemoval(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        // Calculate the amount of Nitrogen that is volatilized
        const emission = calculateNitrogenEmission(
            cultivations,
            harvests,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

        // Calculate the target for the Nitrogen balance
        const target = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            timeFrameField,
        )

        return {
            b_id: fieldDetails.b_id,
            b_area: fieldDetails.b_area ?? 0,
            balance: {
                b_id: fieldDetails.b_id,
                balance: supply.total
                    .add(removal.total)
                    .add(emission.ammonia.total),
                supply: supply,
                removal: removal,
                emission: emission,
                target: target,
            },
        }
    } catch (error) {
        return {
            b_id: field.b_id,
            b_area: field.b_area ?? 0,
            errorMessage: String(error).replace("Error: ", ""),
        }
    }
}

/**
 * Aggregates nitrogen balances from individual fields to the farm level.
 *
 * This function takes an array of nitrogen balance results for individual fields and aggregates
 * them to provide an overall nitrogen balance for the entire farm. It calculates weighted
 * averages of nitrogen supply, removal, and emission based on the area of each field.
 *
 * The function returns a comprehensive nitrogen balance for the farm, including total supply,
 * removal, emission, and the overall balance.
 * @param fieldsWithBalanceResults - An array of nitrogen balance results for individual fields, potentially including errors.
 * @param fields - All field inputs, used to get original field data like area.
 * @param hasErrors - Indicates if any field calculations failed.
 * @param fieldErrorMessages - A list of error messages for fields that failed to calculate.
 * @returns The aggregated nitrogen balance for the farm.
 */
export function calculateNitrogenBalancesFieldToFarm(
    fieldsWithBalanceResults: NitrogenBalanceFieldResult[],
    fields: FieldInput[],
    hasErrors: boolean,
    fieldErrorMessages: string[],
): NitrogenBalance {
    // Filter out fields that have errors for aggregation
    const successfulFieldBalances = fieldsWithBalanceResults.filter(
        (result) => result.balance !== undefined,
    ) as (NitrogenBalanceFieldResult & { balance: NitrogenBalanceField })[]

    // Calculate total weighted supply, removal, and emission across the farm
    let totalFarmSupply = new Decimal(0)
    let totalFarmRemoval = new Decimal(0)
    let totalFarmEmission = new Decimal(0)
    let totalFarmTarget = new Decimal(0)
    let totalFarmArea = new Decimal(0)

    for (const fieldResult of successfulFieldBalances) {
        const fieldInput = fields.find(
            (f) => f.field.b_id === fieldResult.b_id,
        )

        if (!fieldInput) {
            console.warn(
                `Could not find field input for field balance ${fieldResult.b_id}`,
            )
            continue
        }
        const fieldArea = new Decimal(fieldInput.field.b_area ?? 0)
        totalFarmArea  = totalFarmArea .add(fieldArea);

        totalFarmSupply = totalFarmSupply.add(
            fieldResult.balance.supply.total.times(fieldArea),
        )
        totalFarmRemoval = totalFarmRemoval.add(
            fieldResult.balance.removal.total.times(fieldArea),
        )
        totalFarmEmission = totalFarmEmission.add(
            fieldResult.balance.emission.ammonia.total.times(fieldArea),
        )
        totalFarmTarget = totalFarmTarget.add(
            fieldResult.balance.target.times(fieldArea),
        )
    }

    // Calculate average values per hectare for the farm, only considering the area of successfully calculated fields
    const avgFarmSupply = totalFarmArea .isZero()
        ? new Decimal(0)
        : totalFarmSupply.dividedBy(totalFarmArea )
    const avgFarmRemoval = totalFarmArea .isZero()
        ? new Decimal(0)
        : totalFarmRemoval.dividedBy(totalFarmArea )
    const avgFarmEmission = totalFarmArea .isZero()
        ? new Decimal(0)
        : totalFarmEmission.dividedBy(totalFarmArea )
    const avgFarmTarget = totalFarmArea .isZero()
        ? new Decimal(0)
        : totalFarmTarget.dividedBy(totalFarmArea )

    // Calculate the average balance at farm level (Supply + Removal + Emission)
    const avgFarmBalance = avgFarmSupply
        .add(avgFarmRemoval)
        .add(avgFarmEmission)

    // Return the farm with average balances per hectare
    const farmWithBalance: NitrogenBalance = {
        balance: avgFarmBalance,
        supply: avgFarmSupply,
        removal: avgFarmRemoval,
        emission: avgFarmEmission,
        target: avgFarmTarget,
        fields: fieldsWithBalanceResults,
        hasErrors: hasErrors || (fieldsWithBalanceResults.length !== successfulFieldBalances.length),
        fieldErrorMessages: fieldErrorMessages,
    }

    return farmWithBalance
}

// Helper function to convert Decimal to number recursively
function convertDecimalToNumberRecursive(data: unknown): unknown {
    if (data instanceof Decimal) {
        return data.round().toNumber()
    }
    if (Array.isArray(data)) {
        return data.map(convertDecimalToNumberRecursive)
    }
    if (typeof data === "object" && data !== null && !(data instanceof Date)) {
        const newData: { [key: string]: unknown } = {}
        for (const key in data) {
            if (Object.hasOwn(data, key)) {
                newData[key] = convertDecimalToNumberRecursive(
                    (data as Record<string, unknown>)[key],
                )
            }
        }
        return newData
    }
    return data
}

// Main conversion function with type safety
export function convertNitrogenBalanceToNumeric(
    balance: NitrogenBalance, // Input is the original Decimal-based type
): NitrogenBalanceNumeric {
    // Output is the new number-based type
    const numericBalance = convertDecimalToNumberRecursive(balance) as NitrogenBalanceNumeric;

    // Ensure fields are correctly converted, especially handling errorMessage
    numericBalance.fields = balance.fields.map(fieldResult => {
        if (fieldResult.balance) {
            return {
                b_id: fieldResult.b_id,
                b_area: fieldResult.b_area,
                balance: convertDecimalToNumberRecursive(fieldResult.balance) as NitrogenBalanceFieldNumeric,
            };
        }
        return {
            b_id: fieldResult.b_id,
            b_area: fieldResult.b_area,
            errorMessage: fieldResult.errorMessage,
        };
    });

    return numericBalance;
}

/**
 * Combines multiple soil analysis records into a single record, prioritizing the most recent data.
 *
 * This function takes an array of soil analysis records, sorts them by sampling date (most recent first),
 * and then merges them into a single record. For each soil parameter, the most recent non-null value
 * is used. If a parameter is missing in all records, it remains null. After merging, the function
 * attempts to estimate missing parameters using conversion functions if possible.
 * @param soilAnalyses - An array of soil analysis records.
 * @returns A single soil analysis record containing the most recent data and estimated values for missing parameters.
 */
export function combineSoilAnalyses(
    soilAnalyses: FieldInput["soilAnalyses"],
): SoilAnalysisPicked {
    // Sort the soil analyses by date (most recent first)
    soilAnalyses.sort((a, b) => {
        return (
            new Date(b.b_sampling_date).getTime() -
            new Date(a.b_sampling_date).getTime()
        )
    })

    // Return the most recent value for each property, or undefined if not found
    const soilAnalysis = {
        b_soiltype_agr:
            null as fdmSchema.soilAnalysisTypeSelect["b_soiltype_agr"],
        a_n_rt: null as fdmSchema.soilAnalysisTypeSelect["a_n_rt"],
        a_c_of: null as fdmSchema.soilAnalysisTypeSelect["a_c_of"],
        a_cn_fr: null as fdmSchema.soilAnalysisTypeSelect["a_cn_fr"],
        a_density_sa: null as fdmSchema.soilAnalysisTypeSelect["a_density_sa"],
        a_som_loi: null as fdmSchema.soilAnalysisTypeSelect["a_som_loi"],
        b_gwl_class: null as fdmSchema.soilAnalysisTypeSelect["b_gwl_class"],
    }

    // Define properties to extract
    const propertiesToExtract = [
        "b_soiltype_agr",
        "a_n_rt",
        "a_c_of",
        "a_cn_fr",
        "a_density_sa",
        "a_som_loi",
        "b_gwl_class",
    ] as const

    // Extract each property
    for (const prop of propertiesToExtract) {
        soilAnalysis[prop] =
            soilAnalyses.find(
                (x) => x[prop] !== null && x[prop] !== undefined,
            )?.[prop] || null
    }

    // When values for soil parameters are not available try to estimate them with conversion functions
    if (soilAnalysis.a_c_of == null) {
        soilAnalysis.a_c_of = calculateOrganicCarbon(soilAnalysis.a_som_loi)
    }

    if (soilAnalysis.a_som_loi == null) {
        soilAnalysis.a_som_loi = calculateOrganicMatter(soilAnalysis.a_c_of)
    }

    if (soilAnalysis.a_cn_fr == null) {
        soilAnalysis.a_cn_fr = calculateCarbonNitrogenRatio(
            soilAnalysis.a_c_of,
            soilAnalysis.a_n_rt,
        )
    }

    if (soilAnalysis.a_density_sa == null) {
        soilAnalysis.a_density_sa = calculateBulkDensity(
            soilAnalysis.a_som_loi,
            soilAnalysis.b_soiltype_agr,
        )
    }

    // Validate if all required soil parameters for nitrogen balance are present
    const requiredSoilParameters = [
        "b_soiltype_agr",
        "a_n_rt",
        "a_c_of",
        "a_cn_fr",
        "a_density_sa",
        "b_gwl_class",
    ]
    const missingParameters = requiredSoilParameters.filter(
        (param) => soilAnalysis[param as keyof typeof soilAnalysis] === null,
    )

    if (missingParameters.length > 0) {
        throw new Error(
            `Missing required soil parameters: ${missingParameters.join(", ")}`,
        )
    }

    return soilAnalysis
}
