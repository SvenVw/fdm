import { withCalculationCache } from "@svenvw/fdm-core"
import Decimal from "decimal.js"
import pkg from "../../package"
import { getFdmPublicDataUrl } from "../../shared/public-data-url"
import { convertNitrogenBalanceToNumeric } from "../shared/conversion"
import { combineSoilAnalyses } from "../shared/soil"
import { calculateNitrogenEmission } from "./emission"
import { calculateNitrogenEmissionViaNitrate } from "./emission/nitrate"
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
        for (const r of batchResults) {
            if (r.errorMessage) {
                hasErrors = true
                fieldErrorMessages.push(`[${r.b_id}] ${r.errorMessage}`)
            }
        }
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
 * A cached version of the `calculateNitrogenBalance` function.
 *
 * This function provides the same functionality as `calculateNitrogenBalance` but
 * includes a caching mechanism to improve performance for repeated calls with the
 * same input. The cache is managed by `withCalculationCache` and uses the
 * `pkg.calculatorVersion` as part of its cache key.
 *
 * @param nitrogenBalanceInput - The input data for the nitrogen balance calculation.
 * @returns A promise that resolves with the calculated nitrogen balance, with numeric values as numbers.
 */
export const getNitrogenBalance = withCalculationCache(
    calculateNitrogenBalance,
    "calculateNitrogenBalance",
    pkg.calculatorVersion,
)

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
        // Get the details of the field
        const fieldDetails = field

        // Combine soil analyses
        const soilAnalysis = combineSoilAnalyses<SoilAnalysisPicked>(
            soilAnalyses,
            [
                "b_soiltype_agr",
                "a_n_rt",
                "a_c_of",
                "a_cn_fr",
                "a_density_sa",
                "a_som_loi",
                "b_gwl_class",
            ],
            true,
        )

        // Use a field-local timeframe (intersection with input timeframe)
        const timeFrameField = {
            start:
                field.b_start &&
                field.b_start.getTime() > timeFrame.start.getTime()
                    ? field.b_start
                    : timeFrame.start,
            end:
                field.b_end && field.b_end.getTime() < timeFrame.end.getTime()
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

        // Calculate the balance
        const balance = supply.total
            .add(removal.total)
            .add(emission.ammonia.total)

        // Calculate the Nitrogen Emssion via Nitrate as the surplus of nitrogen balance that is leached out
        const nitrateEmission = calculateNitrogenEmissionViaNitrate(
            balance,
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
        )
        emission.nitrate = nitrateEmission
        emission.total = emission.total.add(nitrateEmission.total)

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
                balance: balance,
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
    const fertilizerTypes = ["mineral", "manure", "compost", "other"] as const
    const ammoniaByFertilizerType = Object.fromEntries(
        fertilizerTypes.reduce(
            (arr, key) => {
                arr.push([key, new Decimal(0)])
                return arr
            },
            [] as [(typeof fertilizerTypes)[number], Decimal][],
        ),
    ) as Omit<NitrogenBalance["emission"]["ammonia"]["fertilizers"], "total">
    let totalFarmEmissionAmmonia = new Decimal(0)
    let totalFarmEmissionNitrate = new Decimal(0)
    let totalFarmTarget = new Decimal(0)
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
        totalFarmRemoval = totalFarmRemoval.add(
            fieldResult.balance.removal.total.times(fieldArea),
        )
        totalFarmEmission = totalFarmEmission.add(
            fieldResult.balance.emission.total.times(fieldArea),
        )
        totalFarmEmissionAmmonia = totalFarmEmissionAmmonia.add(
            fieldResult.balance.emission.ammonia.total.times(fieldArea),
        )
        totalFarmEmissionNitrate = totalFarmEmissionNitrate.add(
            fieldResult.balance.emission.nitrate.total.times(fieldArea),
        )

        for (const fertilizerType of fertilizerTypes) {
            const fieldTotal =
                fieldResult.balance.emission.ammonia.fertilizers[
                    fertilizerType
                ].total.mul(fieldArea)
            ammoniaByFertilizerType[fertilizerType] =
                ammoniaByFertilizerType[fertilizerType].add(fieldTotal)
        }

        totalFarmTarget = totalFarmTarget.add(
            fieldResult.balance.target.times(fieldArea),
        )
    }

    // Calculate average values per hectare for the farm, only considering the area of successfully calculated fields
    const avgFarmSupply = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmSupply.dividedBy(totalFarmArea)
    const avgFarmRemoval = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmRemoval.dividedBy(totalFarmArea)
    const avgFarmEmission = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmEmission.dividedBy(totalFarmArea)
    const avgFarmEmissionAmmonia = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmEmissionAmmonia.dividedBy(totalFarmArea)
    const avgFarmEmissionNitrate = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmEmissionNitrate.dividedBy(totalFarmArea)
    const avgFarmTarget = totalFarmArea.isZero()
        ? new Decimal(0)
        : totalFarmTarget.dividedBy(totalFarmArea)
    for (const fertilizerType of fertilizerTypes) {
        ammoniaByFertilizerType[fertilizerType] =
            ammoniaByFertilizerType[fertilizerType].dividedBy(totalFarmArea)
    }

    // Calculate the average balance at farm level (Supply + Removal + Emission)
    const avgFarmBalance = avgFarmSupply
        .add(avgFarmRemoval)
        .add(avgFarmEmission)

    // Return the farm with average balances per hectare
    const farmWithBalance: NitrogenBalance = {
        balance: avgFarmBalance,
        supply: avgFarmSupply,
        removal: avgFarmRemoval,
        emission: {
            total: avgFarmEmission,
            ammonia: {
                total: avgFarmEmissionAmmonia,
                fertilizers: {
                    total: avgFarmEmissionAmmonia,
                    ...ammoniaByFertilizerType,
                },
            },
            nitrate: avgFarmEmissionNitrate,
        },
        target: avgFarmTarget,
        fields: fieldsWithBalanceResults,
        hasErrors:
            hasErrors ||
            fieldsWithBalanceResults.length !== successfulFieldBalances.length,
        fieldErrorMessages: fieldErrorMessages,
    }

    return farmWithBalance
}
