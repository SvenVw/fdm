import { Timeframe, withCalculationCache } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import pkg from "../../package"
import { convertOrganicMatterBalanceToNumeric } from "../shared/conversion"
import { combineSoilAnalyses } from "../shared/soil"
import { calculateOrganicMatterDegradation } from "./degradation"
import { calculateOrganicMatterSupply } from "./supply"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    OrganicMatterBalance,
    OrganicMatterBalanceField,
    OrganicMatterBalanceFieldResult,
    OrganicMatterBalanceInput,
    OrganicMatterBalanceNumeric,
    SoilAnalysisPicked,
} from "./types"

/**
 * Calculates the organic matter balance for a set of fields, considering organic matter supply and degradation.
 *
 * This function takes comprehensive input data, including field details, fertilizer information,
 * and cultivation practices, to provide a detailed organic matter balance analysis. It processes each field
 * individually and then aggregates the results to provide an overall farm-level balance.
 *
 * @param organicMatterBalanceInput - The input data for the organic matter balance calculation, including fields, fertilizer details, and cultivation details.
 * @returns A promise that resolves with the calculated organic matter balance, with numeric values as numbers.
 * @throws Throws an error if any of the calculations fail.
 */
export async function calculateOrganicMatterBalance(
    organicMatterBalanceInput: OrganicMatterBalanceInput,
): Promise<OrganicMatterBalanceNumeric> {
    // Destructure input directly
    const { fields, fertilizerDetails, cultivationDetails, timeFrame } =
        organicMatterBalanceInput

    // Pre-process details into Maps for efficient lookups
    const fertilizerDetailsMap = new Map(
        fertilizerDetails.map((detail) => [detail.p_id_catalogue, detail]),
    )
    const cultivationDetailsMap = new Map(
        cultivationDetails.map((detail) => [detail.b_lu_catalogue, detail]),
    )

    // Process fields in batches to control concurrency.
    const batchSize = 50 // A sensible default, can be tuned based on profiling.
    const fieldsWithBalanceResults: OrganicMatterBalanceFieldResult[] = []
    let hasErrors = false
    const fieldErrorMessages: string[] = []

    for (let i = 0; i < fields.length; i += batchSize) {
        const batch = fields.slice(i, i + batchSize)
        const batchPromises = batch.map(async (field: FieldInput) => {
            return calculateOrganicMatterBalanceField(
                field.field,
                field.cultivations,
                field.harvests,
                field.fertilizerApplications,
                field.soilAnalyses,
                fertilizerDetailsMap,
                cultivationDetailsMap,
                timeFrame,
            )
        })

        const batchResults = await Promise.all(batchPromises)
        for (const r of batchResults) {
            if (r.errorMessage) {
                hasErrors = true
                fieldErrorMessages.push(`[${r.b_id}] ${r.errorMessage}`)
            }
        }
        fieldsWithBalanceResults.push(...batchResults)
    }

    // Aggregate the field balances to farm level
    const farmWithBalanceDecimal = calculateOrganicMatterBalancesFieldToFarm(
        fieldsWithBalanceResults,
        fields,
        hasErrors,
        fieldErrorMessages,
    )

    // Convert the final result to use numbers instead of Decimals
    return convertOrganicMatterBalanceToNumeric(farmWithBalanceDecimal)
}

/**
 * A cached version of the `calculateOrganicMatterBalance` function.
 *
 * This function provides the same functionality as `calculateOrganicMatterBalance` but
 * includes a caching mechanism to improve performance for repeated calls with the
 * same input. The cache is managed by `withCalculationCache` and uses the
 * `pkg.calculatorVersion` as part of its cache key.
 *
 * @param organicMatterBalanceInput - The input data for the organic matter balance calculation.
 * @returns A promise that resolves with the calculated organic matter balance, with numeric values as numbers.
 */
export const getOrganicMatterBalance = withCalculationCache(
    calculateOrganicMatterBalance,
    "calculateOrganicMatterBalance",
    pkg.calculatorVersion,
)

/**
 * Calculates the organic matter balance for a single field, considering organic matter supply and degradation.
 *
 * This function performs a detailed calculation of the organic matter balance for a single field,
 * taking into account various sources of organic matter supply (e.g., fertilizers, crops, residues)
 * and organic matter losses through degradation.
 *
 * The calculation relies on detailed input parameters, including:
 *   - field characteristics
 *   - cultivation details
 *   - harvest yields (though not directly used for OM balance, kept for consistency)
 *   - fertilizer applications and their organic matter contributions
 *   - soil analysis data
 *
 * @param field - The field to calculate the organic matter balance for.
 * @param cultivations - The cultivations on the field.
 * @param harvests - The harvests from the field (not directly used for OM balance but kept for consistency).
 * @param fertilizerApplications - The fertilizer applications on the field.
 * @param soilAnalyses - The soil analyses for the field.
 * @param fertilizerDetailsMap - A map containing details for each fertilizer.
 * @param cultivationDetailsMap - A map containing details for each cultivation.
 * @param timeFrame - The time frame for the calculation.
 * @returns The calculated organic matter balance for the field, or an error message if the calculation fails.
 */
export function calculateOrganicMatterBalanceField(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"], // Not used in OM balance, but kept for consistency with nitrogen
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalyses: FieldInput["soilAnalyses"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: Timeframe,
): OrganicMatterBalanceFieldResult {
    try {
        // Get the details of the field
        const fieldDetails = field

        // Combine soil analyses
        const soilAnalysis = combineSoilAnalyses<SoilAnalysisPicked>(
            soilAnalyses,
            ["a_som_loi", "a_density_sa"],
            true,
        )

        // Calculate the amount of Organic Matter supplied
        const supply = calculateOrganicMatterSupply(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
            timeFrame,
        )

        // Calculate the amount of Organic Matter degraded
        const degradation = calculateOrganicMatterDegradation(
            soilAnalysis,
            cultivations,
            cultivationDetailsMap,
            timeFrame,
        )

        return {
            b_id: fieldDetails.b_id,
            b_area: fieldDetails.b_area ?? 0,
            balance: {
                b_id: fieldDetails.b_id,
                balance: supply.total.minus(degradation.total),
                supply: supply,
                degradation: degradation,
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
 * Aggregates organic matter balances from individual fields to the farm level.
 *
 * This function takes an array of organic matter balance results for individual fields and aggregates
 * them to provide an overall organic matter balance for the entire farm. It calculates weighted
 * averages of organic matter supply and degradation based on the area of each field.
 *
 * The function returns a comprehensive organic matter balance for the farm, including total supply,
 * degradation, and the overall balance.
 * @param fieldsWithBalanceResults - An array of organic matter balance results for individual fields, potentially including errors.
 * @param fields - All field inputs, used to get original field data like area.
 * @param hasErrors - Indicates if any field calculations failed.
 * @param fieldErrorMessages - A list of error messages for fields that failed to calculate.
 * @returns The aggregated organic matter balance for the farm.
 */
export function calculateOrganicMatterBalancesFieldToFarm(
    fieldsWithBalanceResults: OrganicMatterBalanceFieldResult[],
    fields: FieldInput[],
    hasErrors: boolean,
    fieldErrorMessages: string[],
): OrganicMatterBalance {
    // Filter out fields that have errors for aggregation
    const successfulFieldBalances = fieldsWithBalanceResults.filter(
        (result) => result.balance !== undefined,
    ) as (OrganicMatterBalanceFieldResult & { balance: OrganicMatterBalanceField })[]

    // Calculate total weighted supply and degradation across the farm
    let totalFarmSupply = new Decimal(0)
    let totalFarmDegradation = new Decimal(0)
    let totalFarmArea = new Decimal(0)

    for (const fieldResult of successfulFieldBalances) {
        const fieldInput = fields.find((f) => f.field.b_id === fieldResult.b_id)

        if (!fieldInput) {
            console.warn(
                `Could not find field input for field balance ${fieldResult.b_id}`,
            )
            continue
        }
        const fieldArea = new Decimal(fieldInput.field.b_area ?? 0)
        totalFarmArea = totalFarmArea.add(fieldArea)

        totalFarmSupply = totalFarmSupply.add(
            fieldResult.balance.supply.total.times(fieldArea),
        )
        totalFarmDegradation = totalFarmDegradation.add(
            fieldResult.balance.degradation.total.times(fieldArea),
        )
    }

    // Calculate average values per hectare for the farm, only considering the area of successfully calculated fields
    const avgFarmSupply = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmSupply.dividedBy(totalFarmArea)
    const avgFarmDegradation = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmDegradation.dividedBy(totalFarmArea)

    // Calculate the average balance at farm level
    const avgFarmBalance = avgFarmSupply.minus(avgFarmDegradation)

    // Return the farm with average balances per hectare
    const farmWithBalance: OrganicMatterBalance = {
        balance: avgFarmBalance,
        supply: avgFarmSupply,
        degradation: avgFarmDegradation,
        fields: fieldsWithBalanceResults,
        hasErrors:
            hasErrors ||
            fieldsWithBalanceResults.length !== successfulFieldBalances.length,
        fieldErrorMessages: fieldErrorMessages,
    }

    return farmWithBalance
}
