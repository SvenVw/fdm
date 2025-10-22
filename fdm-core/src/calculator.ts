import { eq } from "drizzle-orm"
import { createHash } from "node:crypto"
import stableStringify from "safe-stable-stringify"
import {
    calculationCache as calculationCacheTable,
    calculationErrors as calculationErrorsTable,
} from "./db/schema-calculator"
import type { FdmType } from "./fdm"
import { createId } from "./id"

/**
 * Generates a reliable and quick hash for caching calculation results.
 *
 * @param functionName - The name of the calculation function.
 * @param packageVersion - The version of the package/module containing the function.
 * @param functionInput - The input object for the function.
 * @returns A SHA-256 hash as a hex string.
 */
export function generateCalculationHash<T_Input extends object>(
    functionName: string,
    packageVersion: string,
    functionInput: T_Input,
): string {
    // 1. Deterministically serialize the input object
    const serializedInput = stableStringify(functionInput)

    // 2. Combine all components into a single string with separators
    const dataToHash = `${functionName}:${packageVersion}:${serializedInput}`

    // 3. Compute the hash using SHA-256
    return createHash("sha256").update(dataToHash).digest("hex")
}

/**
 * Get the cached calculation
 *
 * @param fdm fdm instance
 * @param calculation_type key to use to indentify the type of calculation
 * @param input_hash
 * @returns
 */
export function getCachedCalculation<T_Output>(
    fdm: FdmType,
    calculation_hash: string,
): Promise<T_Output | null> {
    const result = fdm
        .select({
            result: calculationCacheTable.result,
        })
        .from(calculationCacheTable)
        .where(eq(calculationCacheTable.calculation_hash, calculation_hash))
        .limit(1)
    return result.then((rows: { result: T_Output }[]) =>
        rows?.length ? (rows[0].result as T_Output) : null,
    )
}

export async function setCachedCalculation<T_Input extends object, T_Output>(
    fdm: FdmType,
    calculationHash: string,
    calculationFunctionName: string,
    calculatorVersion: string,
    input: T_Input,
    result: T_Output,
) {
    await fdm.insert(calculationCacheTable).values({
        calculation_hash: calculationHash,
        calculation_function: calculationFunctionName,
        calculator_version: calculatorVersion,
        input: input,
        result: result,
    })
}

export async function setCalculationError<T_Input extends object>(
    fdm: FdmType,
    calculationFunctionName: string,
    calculatorVersion: string,
    input: T_Input,
    error_message: string,
    stack_trace: string | undefined,
) {
    return fdm.insert(calculationErrorsTable).values({
        calculation_error_id: createId(),
        calculation_function: calculationFunctionName,
        calculator_version: calculatorVersion,
        input: input,
        error_message: error_message,
        stack_trace: stack_trace ?? null,
    })
}

/**
 * Decorator that can add cache functionality to a calculation function
 *
 * Make sure to provide calculation_type same as the name of `calculationFunction` if possible
 *
 * @param calculationFunction function to compute in case there is no cached result
 * @param calculatorVersion key tied to the version of the current calculation function
 * @returns a new function that takes an fdm instance and inputs and tries to retrieve results from cache when available
 */
export function withCalculationCache<T_Input extends object, T_Output>(
    calculationFunction: (inputs: T_Input) => T_Output | Promise<T_Output>,
    calculatorVersion: string,
) {
    return async (fdm: FdmType, input: T_Input) => {
        const calculationFunctionName = calculationFunction.name
        const calculationHash = generateCalculationHash(
            calculationFunctionName,
            calculatorVersion,
            input,
        )

        let cachedResult: T_Output | null = null
        let cacheResultOfCalculation = true
        try {
            cachedResult = await getCachedCalculation(fdm, calculationHash)
        } catch (e: unknown) {
            cacheResultOfCalculation = false
            const errorMessage = e instanceof Error ? e.message : String(e)
            console.error(
                `Failed to read from calculation cache for ${calculationFunctionName} (hash: ${calculationHash}): ${errorMessage}`,
            )
            // Treat as a cache miss and proceed with calculation, but do not set a new cache
        }

        if (cachedResult) {
            console.log(
                `Cache HIT for ${calculationFunctionName} (hash: ${calculationHash})`,
            )
            return cachedResult
        }

        try {
            console.log(
                `Cache MISS for ${calculationFunctionName} (hash: ${calculationHash}). Performing calculation...`,
            )
            const result = await calculationFunction(input)

            if (cacheResultOfCalculation) {
                await setCachedCalculation(
                    fdm,
                    calculationHash,
                    calculationFunctionName,
                    calculatorVersion,
                    input,
                    result,
                )
                console.log(
                    `Calculation for ${calculationFunctionName} (hash: ${calculationHash}) completed and cached.`,
                )
            } else {
                console.log(
                    `Calculation for ${calculationFunctionName} (hash: ${calculationHash}) completed and not cached.`,
                )
            }

            return result
        } catch (e: unknown) {
            const errorMessage = e instanceof Error ? e.message : String(e)
            const stackTrace = e instanceof Error ? e.stack : undefined

            await setCalculationError(
                fdm,
                calculationFunctionName,
                calculatorVersion,
                input,
                errorMessage,
                stackTrace,
            )

            throw e
        }
    }
}
