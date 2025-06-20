import type { fdmSchema } from "@svenvw/fdm-core"
import { Decimal } from "decimal.js"
import {
    calculateBulkDensity,
    calculateCarbonNitrogenRatio,
    calculateOrganicCarbon,
    calculateOrganicMatter,
} from "../../conversions/soil"
import { calculateNitrogenRemoval } from "./removal"
import { calculateNitrogenSupply } from "./supply"
import { calculateTargetForNitrogenBalance } from "./target"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalance,
    NitrogenBalanceField,
    NitrogenBalanceInput,
    NitrogenBalanceNumeric,
    SoilAnalysisPicked,
} from "./types"
import { calculateNitrogenVolatilization } from "./volatization"

/**
 * Calculates the nitrogen balance for a set of fields, considering nitrogen supply, removal, and volatilization.
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
    // Changed return type
    try {
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

        // Calculate for each field the nitrogen balance
        const fieldsWithBalance = await Promise.all(
            fields.map(async (field: FieldInput) => {
                return await calculateNitrogenBalanceField(
                    field.field,
                    field.cultivations,
                    field.harvests,
                    field.fertilizerApplications,
                    field.soilAnalyses,
                    fertilizerDetailsMap,
                    cultivationDetailsMap,
                    timeFrame,
                    fdmPublicDataUrl,
                )
            }),
        )

        // Aggregate the field balances to farm level
        // calculateNitrogenBalancesFieldToFarm returns NitrogenBalance (with Decimals)
        const farmWithBalanceDecimal = calculateNitrogenBalancesFieldToFarm(
            fieldsWithBalance,
            fields,
        )

        // Convert the final result to use numbers instead of Decimals
        return convertNitrogenBalanceToNumeric(farmWithBalanceDecimal)
    } catch (error) {
        throw new Error(String(error))
    }
}

/**
 * Calculates the nitrogen balance for a single field, considering nitrogen supply, removal, and volatilization.
 *
 * This function performs a detailed calculation of the nitrogen balance for a single field,
 * taking into account various sources of nitrogen supply (e.g., fertilizers, mineralization),
 * nitrogen removal (e.g., harvest, crop residues), and nitrogen losses through volatilization.
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
 * @param fdmPublicDataUrl - The URL for accessing public FDM data.
 * @returns A promise that resolves with the calculated nitrogen balance for the field.
 * @throws Throws an error if any of the calculations fail.
 */
export async function calculateNitrogenBalanceField(
    field: FieldInput["field"],
    cultivations: FieldInput["cultivations"],
    harvests: FieldInput["harvests"],
    fertilizerApplications: FieldInput["fertilizerApplications"],
    soilAnalyses: FieldInput["soilAnalyses"],
    fertilizerDetailsMap: Map<string, FertilizerDetail>,
    cultivationDetailsMap: Map<string, CultivationDetail>,
    timeFrame: NitrogenBalanceInput["timeFrame"],
    fdmPublicDataUrl: string,
): Promise<NitrogenBalanceField> {
    // Get the details of the field
    const fieldDetails = field

    // Combine soil analyses
    const soilAnalysis = combineSoilAnalyses(soilAnalyses)

    // If timeframe is broader than field existence, shorten it
    if (field.b_start?.getTime() > timeFrame.start.getTime()) {
        timeFrame.start = field.b_start
    }
    if (field.b_end?.getTime() < timeFrame.end.getTime()) {
        timeFrame.end = field.b_end
    }

    // Calculate the amount of Nitrogen supplied
    const supply = await calculateNitrogenSupply(
        field,
        cultivations,
        fertilizerApplications,
        soilAnalysis,
        cultivationDetailsMap,
        fertilizerDetailsMap,
        timeFrame,
        fdmPublicDataUrl,
    )

    // Calculate the amount of Nitrogen removed
    const removal = calculateNitrogenRemoval(
        cultivations,
        harvests,
        cultivationDetailsMap,
    )

    // Calculate the amount of Nitrogen that is volatilized
    const volatilization = calculateNitrogenVolatilization(
        cultivations,
        harvests,
        fertilizerApplications,
        cultivationDetailsMap,
        fertilizerDetailsMap
    )

    // Calculate the target for the Nitrogen balance
    const target = calculateTargetForNitrogenBalance(
        cultivations,
        soilAnalysis,
        cultivationDetailsMap,
        timeFrame,
    )

    return {
        b_id: fieldDetails.b_id,
        balance: supply.total.add(removal.total).add(volatilization.total),
        supply: supply,
        removal: removal,
        volatilization: volatilization,
        target: target,
    }
}

/**
 * Aggregates nitrogen balances from individual fields to the farm level.
 *
 * This function takes an array of nitrogen balance results for individual fields and aggregates
 * them to provide an overall nitrogen balance for the entire farm. It calculates weighted
 * averages of nitrogen supply, removal, and volatilization based on the area of each field.
 *
 * The function returns a comprehensive nitrogen balance for the farm, including total supply,
 * removal, volatilization, and the overall balance.
 * @param fieldsWithBalance - An array of nitrogen balance results for individual fields.
 * @returns The aggregated nitrogen balance for the farm.
 */
export function calculateNitrogenBalancesFieldToFarm(
    fieldsWithBalance: NitrogenBalanceField[],
    fields: FieldInput[],
): NitrogenBalance {
    // Explicitly state it returns the Decimal version
    // Calculate the total farm area
    const totalFarmArea = fields.reduce(
        (sum, field) => sum.add(new Decimal(field.field.b_area ?? 0)),
        Decimal(0),
    )

    // Calculate total weighted supply, removal, and volatilization across the farm
    let totalFarmSupply = Decimal(0)
    let totalFarmRemoval = Decimal(0)
    let totalFarmVolatilization = Decimal(0)
    let totalFarmTarget = Decimal(0)

    for (const fieldBalance of fieldsWithBalance) {
        const fieldInput = fields.find(
            (f) => f.field.b_id === fieldBalance.b_id,
        )

        if (!fieldInput) {
            // Should not happen if inputs are consistent, but good to handle
            console.warn(
                `Could not find field input for field balance ${fieldBalance.b_id}`,
            )
            continue // Skip this iteration if fieldInput is not found
        }
        const fieldArea = new Decimal(fieldInput.field.b_area ?? 0)

        totalFarmSupply = totalFarmSupply.add(
            fieldBalance.supply.total.times(fieldArea),
        )
        totalFarmRemoval = totalFarmRemoval.add(
            fieldBalance.removal.total.times(fieldArea),
        )
        totalFarmVolatilization = totalFarmVolatilization.add(
            fieldBalance.volatilization.total.times(fieldArea),
        )
        totalFarmTarget = totalFarmTarget.add(
            fieldBalance.target.times(fieldArea),
        )
    }

    // Calculate average values per hectare for the farm
    const avgFarmSupply = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmSupply.dividedBy(totalFarmArea)
    const avgFarmRemoval = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmRemoval.dividedBy(totalFarmArea)
    const avgFarmVolatilization = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmVolatilization.dividedBy(totalFarmArea)
    const avgFarmTarget = totalFarmArea.isZero()
        ? Decimal(0)
        : totalFarmTarget.dividedBy(totalFarmArea)

    // Calculate the average balance at farm level (Supply + Removal + Volatilization)
    const avgFarmBalance = avgFarmSupply
        .add(avgFarmRemoval)
        .add(avgFarmVolatilization)

    // Return the farm with average balances per hectare
    const farmWithBalance: NitrogenBalance = {
        balance: avgFarmBalance,
        supply: avgFarmSupply,
        removal: avgFarmRemoval,
        volatilization: avgFarmVolatilization,
        target: avgFarmTarget,
        fields: fieldsWithBalance,
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
            if (Object.prototype.hasOwnProperty.call(data, key)) {
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
    return convertDecimalToNumberRecursive(balance) as NitrogenBalanceNumeric
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

    // When values for soil parameters are not available try to estimate them with convertsion functions
    if (!soilAnalysis.a_c_of) {
        soilAnalysis.a_c_of = calculateOrganicCarbon(soilAnalysis.a_som_loi)
    }

    if (!soilAnalysis.a_som_loi) {
        soilAnalysis.a_som_loi = calculateOrganicMatter(soilAnalysis.a_c_of)
    }

    if (!soilAnalysis.a_cn_fr) {
        soilAnalysis.a_cn_fr = calculateCarbonNitrogenRatio(
            soilAnalysis.a_c_of,
            soilAnalysis.a_n_rt,
        )
    }

    if (!soilAnalysis.a_density_sa) {
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

export function getFdmPublicDataUrl(): string {
    return "https://storage.googleapis.com/fdm-public-data/"
}
