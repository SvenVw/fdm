/**
 * @file This file provides custom error handling functionalities for the FDM.
 *
 * It includes a custom `BaseError` class that extends the built-in `Error` class,
 * and a centralized `handleError` function to ensure that all thrown errors are of a consistent type.
 */
import type { Jsonable } from "./error.d"

/**
 * A centralized error handler that wraps unknown errors in a `BaseError`.
 *
 * This function is used throughout the application to ensure that all thrown errors are of a consistent type.
 * It also provides a mechanism for adding context to errors, which is useful for debugging.
 *
 * @param err The unknown error to handle.
 * @param base A base error message to use if the error is not an instance of `Error`.
 * @param context Additional context to attach to the error.
 * @returns A new `BaseError` instance.
 */
export function handleError(err: unknown, base: string, context?: Jsonable) {
    const error = ensureError(err)

    // Customize error in case of permission denied
    let message = base
    if (
        error.message ===
        "Principal does not have permission to perform this action"
    ) {
        message = "Principal does not have permission to perform this action"
    }

    return new BaseError(message, {
        cause: error,
        context: context,
    })
}

/**
 * Ensures that a value is an instance of `Error`.
 *
 * If the value is already an `Error`, it is returned as is. Otherwise, a new `Error` is created
 * with a stringified representation of the value as its message.
 *
 * @param value The value to ensure is an `Error`.
 * @returns An `Error` instance.
 * @internal
 */
export function ensureError(value: unknown): Error {
    if (value instanceof Error) return value

    let stringified = "[Unable to stringify the thrown value]"
    try {
        stringified = JSON.stringify(value)
    } catch {}

    const error = new Error(
        `This value was thrown as is, not through an Error: ${stringified}`,
    )
    return error
}

/**
 * A custom error class that extends the built-in `Error` class.
 *
 * It adds support for a `context` property, which can be used to attach additional information
 * to an error, and a `cause` property, which can be used to chain errors.
 */
export class BaseError extends Error {
    public readonly context?: Jsonable

    constructor(
        message: string,
        options: { cause?: Error; context?: Jsonable } = {},
    ) {
        const { cause, context } = options

        super(message, { cause })
        this.name = this.constructor.name

        this.context = context
    }
}
