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
 * Calculates the organic matter balance for a farm, aggregating results from all its fields.
 *
 * This function serves as the main entry point for the organic matter balance calculation.
 * It takes a comprehensive set of input data for a farm, processes each field in batches
 * to calculate its individual balance, and then aggregates these results into a single,
 * farm-level balance. The final output is a numeric representation of the balance,
 * suitable for display or further analysis.
 *
 * @param organicMatterBalanceInput - The complete dataset required for the calculation, including all fields,
 *   fertilizer catalogues, and cultivation catalogues for the farm.
 * @returns A promise that resolves to the aggregated `OrganicMatterBalanceNumeric` object for the farm.
 * @throws {Error} Throws an error if the calculation process fails for any reason.
 */
export async function calculateOrganicMatterBalance(
    organicMatterBalanceInput: OrganicMatterBalanceInput,
): Promise<OrganicMatterBalanceNumeric> {
    // Destructure input for easier access.
    const { fields, fertilizerDetails, cultivationDetails, timeFrame } =
        organicMatterBalanceInput

    // Pre-process catalogue details into Maps for efficient lookups within the calculation functions.
    const fertilizerDetailsMap = new Map<string, FertilizerDetail>(
        fertilizerDetails.map((detail: FertilizerDetail) => [detail.p_id_catalogue, detail]),
    )
    const cultivationDetailsMap = new Map<string, CultivationDetail>(
        cultivationDetails.map((detail: CultivationDetail) => [detail.b_lu_catalogue, detail]),
    )

    // Process fields in batches to avoid overwhelming the system with concurrent promises,
    // especially for farms with a large number of fields.
    const batchSize = 50 // This can be adjusted based on performance testing.
    const fieldsWithBalanceResults: OrganicMatterBalanceFieldResult[] = []
    let hasErrors = false
    const fieldErrorMessages: string[] = []

    for (let i = 0; i < fields.length; i += batchSize) {
        const batch = fields.slice(i, i + batchSize)
        const batchPromises = batch.map(async (field: FieldInput) => {
            // Calculate the balance for each field individually.
            return calculateOrganicMatterBalanceField(
                field.field,
                field.cultivations,
                field.fertilizerApplications,
                field.soilAnalyses,
                fertilizerDetailsMap,
                cultivationDetailsMap,
                timeFrame,
            )
        })

        // Wait for the current batch to complete.
        const batchResults = await Promise.all(batchPromises)
        for (const r of batchResults) {
            // Collect any errors that occurred during field calculations.
            if (r.errorMessage) {
                hasErrors = true
                fieldErrorMessages.push(`[${r.b_id}] ${r.errorMessage}`)
            }
        }
        fieldsWithBalanceResults.push(...batchResults)
    }

    // Aggregate the results from all individual fields into a single farm-level balance.
    const farmWithBalanceDecimal = calculateOrganicMatterBalancesFieldToFarm(
        fieldsWithBalanceResults,
        fields,
        hasErrors,
        fieldErrorMessages,
    )

    // Convert the final `Decimal`-based result to a plain `number`-based object.
    return convertOrganicMatterBalanceToNumeric(farmWithBalanceDecimal)
}

/**
 * A cached version of the `calculateOrganicMatterBalance` function.
 *
 * This wrapper provides caching capabilities to the main calculation function,
 * returning a stored result if the same input has been processed before. This can
 * significantly improve performance for repeated requests with identical data.
 * The cache is versioned using the calculator's package version to ensure data integrity
 * after updates.
 *
 * @param organicMatterBalanceInput - The input data for the organic matter balance calculation.
 * @returns A promise that resolves with the calculated `OrganicMatterBalanceNumeric`.
 */
export const getOrganicMatterBalance = withCalculationCache(
    calculateOrganicMatterBalance,
    "calculateOrganicMatterBalance",
    pkg.calculatorVersion,
)

/**
 * Calculates the organic matter balance for a single field.
 *
 * This function computes the balance by subtracting the total organic matter degradation
 * from the total supply of effective organic matter (EOM). It orchestrates calls to
 * `calculateOrganicMatterSupply` and `calculateOrganicMatterDegradation` to get the two
 * main components of the balance.
 *
 * @param field - The core details of the field.
 * @param cultivations - An array of cultivation records for the field.
 * @param fertilizerApplications - An array of fertilizer application records.
 * @param soilAnalyses - An array of soil analysis records.
 * @param fertilizerDetailsMap - A map of available fertilizer details.
 * @param cultivationDetailsMap - A map of available cultivation details.
 * @param timeFrame - The calculation period.
 * @returns A `OrganicMatterBalanceFieldResult` object containing the detailed balance or an error message.
 */
export function calculateOrganicMatterBalanceField(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalyses: FieldInput["soilAnalyses"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: Timeframe,
): OrganicMatterBalanceFieldResult {
    try {
        const fieldDetails = field

        // 1. Combine multiple soil analyses into a single representative record for the field.
        // We need 'a_som_loi' and 'a_density_sa' for the degradation calculation.
        const soilAnalysis = combineSoilAnalyses<SoilAnalysisPicked>(
            soilAnalyses,
            ["a_som_loi", "a_density_sa", "b_soiltype_agr"],
            true, // Enable estimation of missing values if possible
        )

        // 2. Calculate the total supply of effective organic matter (EOM).
        const supply = calculateOrganicMatterSupply(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
            timeFrame,
        )

        // 3. Calculate the total degradation of soil organic matter (SOM).
        const degradation = calculateOrganicMatterDegradation(
            soilAnalysis,
            cultivations,
            cultivationDetailsMap,
            timeFrame,
        )

        // 4. Calculate the final balance: EOM Supply - SOM Degradation.
        return {
            b_id: fieldDetails.b_id,
            b_area: fieldDetails.b_area ?? 0,
            balance: {
                b_id: fieldDetails.b_id,
                balance: supply.total.plus(degradation.total),
                supply: supply,
                degradation: degradation,
            },
        }
    } catch (error) {
        // If any step fails, return a result object with an error message.
        return {
            b_id: field.b_id,
            b_area: field.b_area ?? 0,
            errorMessage: String(error).replace("Error: ", ""),
        }
    }
}

/**
 * Aggregates the organic matter balances from individual fields to a farm-level summary.
 *
 * This function takes the results for all fields, filters out any that failed,
 * and calculates a weighted average for the farm's overall supply, degradation, and balance,
 * using the area of each field as the weight.
 *
 * @param fieldsWithBalanceResults - An array of `OrganicMatterBalanceFieldResult` objects.
 * @param fields - The original array of `FieldInput` objects, used to retrieve field areas.
 * @param hasErrors - A boolean flag indicating if any field calculations failed.
 * @param fieldErrorMessages - An array of error messages from failed calculations.
 * @returns A single `OrganicMatterBalance` object representing the aggregated farm-level results.
 */
export function calculateOrganicMatterBalancesFieldToFarm(
    fieldsWithBalanceResults: OrganicMatterBalanceFieldResult[],
    fields: FieldInput[],
    hasErrors: boolean,
    fieldErrorMessages: string[],
): OrganicMatterBalance {
    // Filter out fields that have errors to ensure they are not included in the aggregation.
    const successfulFieldBalances = fieldsWithBalanceResults.filter(
        (result) => result.balance !== undefined,
    ) as (OrganicMatterBalanceFieldResult & { balance: OrganicMatterBalanceField })[]

    let totalFarmSupply = new Decimal(0)
    let totalFarmDegradation = new Decimal(0)
    let totalFarmArea = new Decimal(0)

    // Calculate the total supply and degradation across the farm, weighted by field area.
    for (const fieldResult of successfulFieldBalances) {
        const fieldInput = fields.find((f) => f.field.b_id === fieldResult.b_id)

        if (!fieldInput) {
            // This should not happen in a normal flow but is a safeguard.
            console.warn(
                `Could not find field input for field balance ${fieldResult.b_id}`,
            )
            continue
        }
        const fieldArea = new Decimal(fieldInput.field.b_area ?? 0)
        totalFarmArea = totalFarmArea.add(fieldArea)

        // Add the area-weighted supply and degradation to the farm totals.
        totalFarmSupply = totalFarmSupply.add(
            fieldResult.balance.supply.total.times(fieldArea),
        )
        totalFarmDegradation = totalFarmDegradation.add(
            fieldResult.balance.degradation.total.times(fieldArea),
        )
    }

    // Calculate the average values per hectare for the entire farm.
    const avgFarmSupply = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmSupply.dividedBy(totalFarmArea)
    const avgFarmDegradation = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmDegradation.dividedBy(totalFarmArea)

    // The final farm balance is the difference between the average supply and average degradation.
    const avgFarmBalance = avgFarmSupply.plus(avgFarmDegradation)

    // Construct the final farm-level balance object.
    const farmWithBalance: OrganicMatterBalance = {
        balance: avgFarmBalance,
        supply: avgFarmSupply,
        degradation: avgFarmDegradation,
        fields: fieldsWithBalanceResults, // Include results for all fields, even those with errors.
        hasErrors:
            hasErrors ||
            fieldsWithBalanceResults.length !== successfulFieldBalances.length,
        fieldErrorMessages: fieldErrorMessages,
    }

    return farmWithBalance
}
