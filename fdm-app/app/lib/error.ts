import { data, redirect } from "react-router"
import { dataWithError, dataWithWarning } from "remix-toast"
import { customAlphabet } from "nanoid"
import * as Sentry from "@sentry/react-router"
import { clientConfig } from "~/lib/config"

const customErrorAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ" // No lookalikes (0, 1, I, O, S, Z)
const errorIdSize = 8 // Number of characters in ID

export const createErrorId = customAlphabet(customErrorAlphabet, errorIdSize)

export function reportError(
    error: unknown,
    tags: Record<string, string> = {},
    context?: Record<string, unknown>,
): string {
    const errorId =
        createErrorId()
            .match(/.{1,4}/g)
            ?.join("-") || createErrorId() // Format as XXXX-XXXX

    if (clientConfig.analytics.sentry?.dsn) {
        Sentry.captureException(error, {
            tags: {
                ...tags,
            },
            extra: {
                ...context,
                errorId: errorId,
            },
        })
    } else {
        console.error(`Error (code: ${errorId}):`, error, context)
    }

    return errorId
}

export function handleLoaderError(error: unknown) {
    // Handle 'data' thrown errors
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "statusText" in error
    ) {
        // Type guard to check if it's a 'data' object
        if (
            typeof error.status === "number" &&
            typeof error.statusText === "string"
        ) {
            console.warn(`Loader error: ${error.status} - ${error.statusText}`)

            // Customize the user-facing message based on the status code
            let userMessage = "Er is iets fout gegaan." // Default message
            switch (error.status) {
                case 400:
                    userMessage = error.statusText
                    break
                case 401:
                    return redirect("/signin")
                case 403:
                    userMessage =
                        "U heeft geen rechten om deze actie uit te voeren."
                    break
                case 404:
                    userMessage = "De gevraagde data kon niet worden gevonden."
                    break
                // case 500:
                default:
                    userMessage =
                        "Er is een onverwachte fout opgetreden. Probeer het later opnieuw of neem contact op met Ondersteuning."
                    break
            }
            return data(
                {
                    warning: error,
                },
                { status: error.status, statusText: userMessage },
            )
        }
    }

    // Permission denied error
    if (
        error instanceof Error &&
        error.message ===
            "Principal does not have permission to perform this action"
    ) {
        console.warn("Permission denied: ", error)
        return data(
            {
                warning: error.message,
            },
            {
                status: 403,
                statusText: "U heeft helaas geen rechten om dit te doen.",
            },
        )
    }

    // Missing or invalid parameters errors
    if (
        error instanceof Error &&
        (error.message.startsWith("missing: ") ||
            error.message.startsWith("invalid: "))
    ) {
        console.warn(error.message)
        return data(
            {
                warning: error,
            },
            {
                status: 400,
                statusText: "Ongeldige waarde",
            },
        )
    }
    // Not found errors
    if (error instanceof Error && error.message.startsWith("not found")) {
        console.warn(error.message)
        return data(
            {
                warning: error,
            },
            {
                status: 404,
                statusText: "Pagina is niet gevonden",
            },
        )
    }

    // All other errors
    console.error("Loader Error: ", error)
    // Forward error to Sentry
    const errorId = reportError(error, {
        scope: "loader",
    })

    return data(
        {
            warning: error instanceof Error ? error.message : "Unknown error",
        },
        {
            status: 500,
            statusText: `Er is helaas iets fout gegaan. Probeer het later opnieuw of neem contact op met Ondersteuning en meldt de volgende foutcode: ${errorId}.`,
        },
    )
}

export function handleActionError(error: unknown) {
    // Handle 'data' thrown errors
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "statusText" in error
    ) {
        // Type guard to check if it's a 'data' object
        if (
            typeof error.status === "number" &&
            typeof error.statusText === "string"
        ) {
            console.warn(`Action error: ${error.status} - ${error.statusText}`)

            // Customize the user-facing message based on the status code
            let userMessage = "Er is iets fout gegaan." // Default message
            let dataStatus = "error"
            switch (error.status) {
                case 400:
                    userMessage = error.statusText
                    dataStatus = "warning"
                    break
                case 401:
                    return redirect("/signin")
                case 403:
                    userMessage =
                        "U heeft geen rechten om deze actie uit te voeren."
                    dataStatus = "warning"
                    break
                case 404:
                    userMessage = "De gevraagde data kon niet worden gevonden."
                    dataStatus = "warning"
                    break
                // case 500:
                default:
                    userMessage =
                        "Er is een onverwachte fout opgetreden. Probeer het later opnieuw of neem contact op met Ondersteuning."
                    dataStatus = "error"
                    break
            }
            if (dataStatus === "warning") {
                return dataWithWarning(
                    {
                        warning: error,
                    },
                    userMessage,
                )
            }
            return dataWithError(
                {
                    warning: error,
                },
                userMessage,
            )
        }
    }

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
    console.error("Error: ", error)
    const errorId = reportError(error, {
        scope: "action",
    })
    return dataWithError(
        error instanceof Error ? error.message : "Unknown error",
        `Er is helaas iets fout gegaan. Probeer het later opnieuw of neem contact op met Ondersteuning en meldt de volgende foutcode: ${errorId}.`,
    )
}
