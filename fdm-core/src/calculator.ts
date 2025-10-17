import { and, eq } from "drizzle-orm"
import hash from "object-hash"
import {
    calculationCache as calculationCacheTable,
    calculationErrors as calculationErrorsTable,
} from "./db/schema-calculator"
import type { FdmType } from "./fdm"

export function getCalculationInputHash<T_Input>(
    calculator_version: string,
    inputs: T_Input,
) {
    return hash([calculator_version, inputs])
}

/**
 * Get the cached calculation
 *
 * @param fdm fdm instance
 * @param calculation_type key to use to indentify the type of calculation
 * @param input_hash
 * @returns
 */
export async function getCachedCalculation<T_Input, T_Output>(
    fdm: FdmType,
    calculation_type: string,
    calculator_version: string,
    inputs: T_Input,
): Promise<T_Output | null> {
    const result = await fdm
        .select({
            calculation_type: calculationCacheTable.calculation_type,
            calculator_version: calculationCacheTable.calculator_version,
            result: calculationCacheTable.result,
            created_at: calculationCacheTable.created_at,
        })
        .from(calculationCacheTable)
        .where(
            and(
                eq(calculationCacheTable.calculation_type, calculation_type),
                eq(
                    calculationCacheTable.input_hash,
                    getCalculationInputHash(calculator_version, inputs),
                ),
            ),
        )
    return result?.length ? (result[0].result as T_Output) : null
}

export async function setCachedCalculation<T_Input, T_Output>(
    fdm: FdmType,
    calculation_type: string,
    calculator_version: string,
    inputs: T_Input,
    result: T_Output,
) {
    await fdm.insert(calculationCacheTable).values({
        calculation_type: calculation_type,
        calculator_version: calculator_version,
        inputs: inputs,
        input_hash: getCalculationInputHash(calculator_version, inputs),
        result: result,
    })
}

export async function setCalculationError<T_Input>(
    fdm: FdmType,
    calculation_type: string,
    calculator_version: string,
    inputs: T_Input,
    error_message: string,
    stack_trace: string | undefined,
) {
    return fdm.insert(calculationErrorsTable).values({
        calculation_type: calculation_type,
        calculator_version: calculator_version,
        inputs: inputs,
        error_message: error_message,
        stack_trace: stack_trace ?? null,
    })
}

/**
 * Decorator that can add cache functionality to a calculation function
 *
 * Make sure to provide calculation_type same as the name of `calculationFunction` if possible
 *
 * @param calculation_type key to use to indentify the type of calculation
 * @param calculator_version key tied to the version of the current calculation function
 * @param calculationFunction function to compute in case there is no cached result
 * @returns a new function that takes an fdm instance and inputs and tries to retrieve results from cache when available
 */
export function withCalculationCache<T_Input, T_Output>(
    calculation_type: string,
    calculator_version: string,
    calculationFunction: (inputs: T_Input) => T_Output | Promise<T_Output>,
) {
    return async (fdm: FdmType, inputs: T_Input) => {
        // Database entries are tagged with the calculationFunction version
        // therefore one can be sure that the stored type matches T_Output
        const cachedResult: T_Output | null = await getCachedCalculation(
            fdm,
            calculation_type,
            calculator_version,
            inputs,
        )

        if (cachedResult) {
            return cachedResult
        }

        try {
            const result = await calculationFunction(inputs)
            await setCachedCalculation(
                fdm,
                calculation_type,
                calculator_version,
                inputs,
                result,
            )

            return result
        } catch (e: any) {
            await setCalculationError(
                fdm,
                calculation_type,
                calculator_version,
                inputs,
                e.message,
                e.stack,
            )

            throw e
        }
    }
}
