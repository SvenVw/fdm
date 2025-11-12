/**
 * @file This file provides caching functionalities for calculations.
 *
 * It includes a higher-order function `withCalculationCache` that can be used to wrap any calculation
 * function to add caching capabilities. The caching is based on a hash of the function name, version,
 * and input, and the results are stored in a database.
 */
import { createHash } from "node:crypto"
import { eq } from "drizzle-orm"
import stableStringify from "safe-stable-stringify"
import {
    calculationCache as calculationCacheTable,
    calculationErrors as calculationErrorsTable,
} from "./db/schema-calculator"
import type { FdmType } from "./fdm"
import { createId } from "./id"

/**
 * Generates a SHA-256 hash for a calculation, to be used as a cache key.
 *
 * The hash is created based on the function name, a version string, and the function's input.
 * This ensures that the cache is properly invalidated when the function, its version, or its input changes.
 *
 * @template T_Input The type of the input object for the calculation.
 * @param functionName The name of the calculation function.
 * @param packageVersion The version of the package or calculator.
 * @param functionInput The input object for the function.
 * @returns A SHA-256 hash string.
 */
export function generateCalculationHash<T_Input extends object>(
    functionName: string,
    packageVersion: string,
    functionInput: T_Input,
): string {
    // 1. Deterministically serialize the input object to ensure consistent hashing.
    //    `safe-stable-stringify` is used to handle various JavaScript object types reliably.
    const serializedInput = stableStringify(functionInput)

    // 2. Combine all components (function name, package version, and serialized input)
    //    into a single string. This ensures that changes to any of these components
    //    will result in a different hash, effectively invalidating the cache for that specific calculation.
    const dataToHash = `${functionName}:${packageVersion}:${serializedInput}`

    // 3. Compute the SHA-256 hash of the combined string.
    return createHash("sha256").update(dataToHash).digest("hex")
}

/**
 * Retrieves a cached calculation result from the database using its hash.
 *
 * @template T_Output The expected type of the cached result.
 * @param fdm The FDM instance for database access.
 * @param calculation_hash The hash of the calculation to retrieve.
 * @returns A promise that resolves to the cached result, or `null` if it's not found.
 */
export function getCachedCalculation<T_Output>(
    fdm: FdmType,
    calculation_hash: string,
): Promise<T_Output | null> {
    // Query the calculation cache table for a record matching the provided hash.
    // Limits to 1 result as the hash is a primary key.
    const result = fdm
        .select({
            result: calculationCacheTable.result,
        })
        .from(calculationCacheTable)
        .where(eq(calculationCacheTable.calculation_hash, calculation_hash))
        .limit(1)

    // Process the query result: if a row is found, return its 'result' field, otherwise return null.
    return result.then((rows: { result: T_Output }[]) =>
        rows?.length ? (rows[0].result as T_Output) : null,
    )
}

/**
 * Caches the result of a calculation in the database.
 *
 * This function stores the result of a calculation, so it can be quickly retrieved later using `getCachedCalculation`.
 *
 * @template T_Input The type of the input object for the calculation.
 * @template T_Output The type of the output of the calculation.
 * @param fdm The FDM instance for database access.
 * @param calculationHash The hash that uniquely identifies the calculation.
 * @param calculationFunctionName The name of the function that was executed.
 * @param calculatorVersion The version of the calculator.
 * @param input The input object that was used for the calculation.
 * @param result The result of the calculation.
 * @returns A promise that resolves when the result has been cached.
 */
export async function setCachedCalculation<T_Input extends object, T_Output>(
    fdm: FdmType,
    calculationHash: string,
    calculationFunctionName: string,
    calculatorVersion: string,
    input: T_Input,
    result: T_Output,
) {
    // Inserts a new cache record. If a record with the same calculation_hash already exists,
    // this operation will likely cause a unique constraint violation error, as upsert was removed.
    await fdm.insert(calculationCacheTable).values({
        calculation_hash: calculationHash,
        calculation_function: calculationFunctionName,
        calculator_version: calculatorVersion,
        input: input,
        result: result,
    })
}

/**
 * Logs an error that occurred during a calculation to the database.
 *
 * This function is used to persist calculation errors, which can be useful for debugging and monitoring.
 *
 * @template T_Input The type of the input object that caused the error.
 * @param fdm The FDM instance for database access.
 * @param calculationFunctionName The name of the function where the error occurred.
 * @param calculatorVersion The version of the calculator.
 * @param input The input that caused the error.
 * @param error_message The error message.
 * @param stack_trace The stack trace, if available.
 * @returns A promise that resolves when the error has been logged.
 */
export async function setCalculationError<T_Input extends object>(
    fdm: FdmType,
    calculationFunctionName: string,
    calculatorVersion: string,
    input: T_Input,
    error_message: string,
    stack_trace: string | undefined,
) {
    return fdm.insert(calculationErrorsTable).values({
        calculation_error_id: createId(), // Generate a unique ID for each error record
        calculation_function: calculationFunctionName,
        calculator_version: calculatorVersion,
        input: input,
        error_message: error_message,
        stack_trace: stack_trace ?? null, // Store stack trace, or null if not provided
    })
}

/**
 * A higher-order function that wraps a calculation function with caching logic.
 *
 * This function handles the caching of calculation results to avoid re-computing them. It checks for a cached
 * result, and if not found, it executes the original function, caches its result, and returns it. It also
 * provides error handling by logging any calculation errors.
 *
 * @template T_Input The type of the input object for the calculation.
 * @template T_Output The type of the output of the calculation.
 * @param calculationFunction The original calculation function to be wrapped.
 * @param calculationFunctionName The name of the calculation function, used as a part of the cache key.
 * @param calculatorVersion The version of the calculator, used to invalidate the cache when the logic changes.
 * @returns A new function that takes an `FdmType` instance and the input, and returns a promise resolving to the output.
 */
export function withCalculationCache<T_Input extends object, T_Output>(
    calculationFunction: (inputs: T_Input) => T_Output | Promise<T_Output>,
    calculationFunctionName: string,
    calculatorVersion: string,
) {
    return async (fdm: FdmType, input: T_Input) => {
        if (!calculationFunctionName) {
            throw new Error(
                "Calculation function name not provided for caching. Please provide a valid function name.",
            )
        }

        if (!calculatorVersion) {
            throw new Error(
                "Calculator version not provided for caching. Please provide a valid version string.",
            )
        }

        // Generate a unique hash for the current calculation based on function name, version, and input.
        const calculationHash = generateCalculationHash(
            calculationFunctionName,
            calculatorVersion,
            input,
        )

        let cachedResult: T_Output | null = null
        // Flag to determine if the result of the current calculation should be cached.
        // This is set to false if reading from cache fails.
        let cacheResultOfCalculation = true

        // Attempt to retrieve the result from cache.
        try {
            cachedResult = await getCachedCalculation(fdm, calculationHash)
        } catch (e: unknown) {
            // If reading from cache fails, log the error and mark that the result should not be cached.
            // This makes the caching mechanism resilient to temporary database issues.
            cacheResultOfCalculation = false
            const errorMessage = e instanceof Error ? e.message : String(e)
            console.error(
                `Failed to read from calculation cache for ${calculationFunctionName} (hash: ${calculationHash}): ${errorMessage}`,
            )
            // Treat as a cache miss and proceed with calculation, but do not attempt to set a new cache entry
            // as the cache might be in an unhealthy state.
        }

        // If a cached result was successfully retrieved, return it immediately.
        if (cachedResult) {
            // console.log(
            //     `Cache HIT for ${calculationFunctionName} (hash: ${calculationHash})`,
            // )
            return cachedResult
        }

        // If no cached result was found (either genuinely a miss or cache read failed),
        // perform the actual calculation.
        try {
            // console.log(
            //     `Cache MISS for ${calculationFunctionName} (hash: ${calculationHash}). Performing calculation...`,
            // )
            const result = await calculationFunction(input)

            // If the initial cache read was successful (meaning the cache is healthy),
            // then attempt to store the new calculation result in the cache.
            if (cacheResultOfCalculation) {
                try {
                    await setCachedCalculation(
                        fdm,
                        calculationHash,
                        calculationFunctionName,
                        calculatorVersion,
                        input,
                        result,
                    )
                } catch (e: unknown) {
                    const errorMessage =
                        e instanceof Error ? e.message : String(e)
                    console.error(
                        `Failed to write to calculation cache for ${calculationFunctionName} (hash: ${calculationHash}): ${errorMessage}`,
                    )
                    // Continue execution - the calculation succeeded, only caching failed
                }
                // console.log(
                //     `Calculation for ${calculationFunctionName} (hash: ${calculationHash}) completed and cached.`,
                // )
            } else {
                // If cache read failed, log that the result is not being cached.
                // console.log(
                //     `Calculation for ${calculationFunctionName} (hash: ${calculationHash}) completed and not cached due to prior cache read failure.`,
                // )
            }

            return result
        } catch (e: unknown) {
            // If the calculation itself fails, record the error in the database
            // and re-throw it to propagate the failure to the caller.
            const errorMessage = e instanceof Error ? e.message : String(e)
            const stackTrace = e instanceof Error ? e.stack : undefined

            try {
                await setCalculationError(
                    fdm,
                    calculationFunctionName,
                    calculatorVersion,
                    input,
                    errorMessage,
                    stackTrace,
                )
            } catch (loggingError: unknown) {
                const loggingErrorMessage =
                    loggingError instanceof Error
                        ? loggingError.message
                        : String(loggingError)
                console.error(
                    `Failed to log calculation error for ${calculationFunctionName}: ${loggingErrorMessage}`,
                )
                // Continue to re-throw the original calculation error
            }

            throw e
        }
    }
}
