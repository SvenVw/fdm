import { Decimal } from "decimal.js"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
    NitrogenBalance,
    NitrogenBalanceField,
    NitrogenBalanceInput,
    NitrogenBalanceNumeric,
} from "./types"
import { calculateNitrogenSupply } from "./supply"
import { calculateNitrogenRemoval } from "./removal"
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
): Promise<NitrogenBalanceNumeric> { // Changed return type
    try {
        // Destructure input directly
        const {
            fields,
            fertilizerDetails,
            cultivationDetails,
            fdmPublicDataUrl,
            timeFrame,
        } = nitrogenBalanceInput

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
                    field.soilAnalyses,
                    field.fertilizerApplications,
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
    fdmPublicDataUrl: NitrogenBalanceInput["fdmPublicDataUrl"],
): Promise<NitrogenBalanceField> {
    // Get the details of the field
    const fieldDetails = field

    // Calculate the amount of Nitrogen supplied
    const supply = await calculateNitrogenSupply(
        field,
        cultivations,
        fertilizerApplications,
        soilAnalyses,
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
        cultivationDetailsMap,
    )

    return {
        b_id: fieldDetails.b_id,
        balance: supply.total.add(removal.total).add(volatilization.total),
        supply: supply,
        removal: removal,
        volatilization: volatilization,
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
): NitrogenBalance { // Explicitly state it returns the Decimal version
    // Calculate the total farm area
    const totalFarmArea = fields.reduce(
        (sum, field) => sum.add(new Decimal(field.field.b_area)),
        Decimal(0),
    )

    // Calculate total weighted supply, removal, and volatilization across the farm
    let totalFarmSupply = Decimal(0)
    let totalFarmRemoval = Decimal(0)
    let totalFarmVolatilization = Decimal(0)

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
        const fieldArea = new Decimal(fieldInput.field.b_area)

        totalFarmSupply = totalFarmSupply.add(
            fieldBalance.supply.total.times(fieldArea),
        )
        totalFarmRemoval = totalFarmRemoval.add(
            fieldBalance.removal.total.times(fieldArea),
        )
        totalFarmVolatilization = totalFarmVolatilization.add(
            fieldBalance.volatilization.total.times(fieldArea),
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
        fields: fieldsWithBalance,
    }

    return farmWithBalance
}

// Helper function to convert Decimal to number recursively
function convertDecimalToNumberRecursive(data: unknown): unknown {
    if (data instanceof Decimal) {
        return data.toNumber()
    }
    if (Array.isArray(data)) {
        return data.map(convertDecimalToNumberRecursive)
    }
    if (typeof data === "object" && data !== null && !(data instanceof Date)) {
        const newData: { [key: string]: unknown } = {}
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                newData[key] = convertDecimalToNumberRecursive((data as Record<string, unknown>)[key])
            }
        }
        return newData
    }
    return data
}

// Main conversion function with type safety
export function convertNitrogenBalanceToNumeric(
    balance: NitrogenBalance, // Input is the original Decimal-based type
): NitrogenBalanceNumeric { // Output is the new number-based type
    return convertDecimalToNumberRecursive(balance) as NitrogenBalanceNumeric
}