import Decimal from "decimal.js"
import type {
    NitrogenBalance,
    NitrogenBalanceField,
    NitrogenBalanceFieldNumeric,
    NitrogenBalanceFieldResult,
    NitrogenBalanceFieldResultNumeric,
    NitrogenBalanceNumeric,
} from "../nitrogen/types"
import type {
    OrganicMatterBalance,
    OrganicMatterBalanceFieldNumeric,
    OrganicMatterBalanceNumeric,
} from "../organic-matter/types"

// Helper function to convert Decimal to number recursively
export function convertDecimalToNumberRecursive(data: unknown): unknown {
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

// Main conversion function for OrganicMatterBalance
export function convertOrganicMatterBalanceToNumeric(
    balance: OrganicMatterBalance,
): OrganicMatterBalanceNumeric {
    const numericBalance = convertDecimalToNumberRecursive(
        balance,
    ) as OrganicMatterBalanceNumeric

    numericBalance.fields = balance.fields.map((fieldResult) => {
        if (fieldResult.balance) {
            return {
                b_id: fieldResult.b_id,
                b_area: fieldResult.b_area,
                balance: convertDecimalToNumberRecursive(
                    fieldResult.balance,
                ) as OrganicMatterBalanceFieldNumeric,
            }
        }
        return {
            b_id: fieldResult.b_id,
            b_area: fieldResult.b_area,
            errorMessage: fieldResult.errorMessage,
        }
    })

    return numericBalance
}
