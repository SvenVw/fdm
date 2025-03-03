import * as Sentry from "@sentry/react"
import { dataWithError, dataWithWarning } from "remix-toast"

export function handleActionError(error: unknown) {
    // Permission denied error
    if (
        error instanceof Error &&
        error.message ===
            "Principal does not have permission to perform this action"
    ) {
        console.warn("Permission denied: ", error)
        return dataWithWarning(
            {
                warning: error,
            },
            "U heeft helaas geen rechten om dit te doen.",
        )
    }

    // Missing or invalid parameters errors
    if (
        error instanceof Error &&
        (error.message.startsWith("missing: ") ||
            error.message.startsWith("invalid: "))
    ) {
        console.warn(error.message)
        return dataWithWarning(
            {
                warning: error,
            },
            error.message,
        )
    }

    // All other errors
    Sentry.captureException(error)
    console.error("Error: ", error)
    return dataWithError(
        error instanceof Error ? error.message : "Unknown error",
        "Er is helaas iets fout gegaan. Probeer het later opnieuw of neem contact op met Ondersteuning.",
    )
}
