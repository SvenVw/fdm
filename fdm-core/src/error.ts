import type { Jsonable } from "./error.d"

export function handleError(err: unknown, base: string, context?: Jsonable) {
    const error = ensureError(err)

    throw new BaseError(base, {
        cause: error,
        context: context,
    })
}

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

export class BaseError extends Error {
    public readonly context?: Jsonable

    constructor(
        message: string,
        options: { error?: Error; context?: Jsonable } = {},
    ) {
        const { cause, context } = options

        super(message, { cause })
        this.name = this.constructor.name

        this.context = context
    }
}
