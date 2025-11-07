/**
 * @file This module provides a centralized set of utilities for error handling
 * throughout the application. It includes functions for generating unique error IDs,
 * reporting errors to Sentry, and gracefully handling exceptions within Remix
 * loaders and actions.
 *
 * @packageDocumentation
 */
import * as Sentry from "@sentry/react-router"
import { customAlphabet } from "nanoid"
import { data, redirect } from "react-router"
import { dataWithError, dataWithWarning } from "remix-toast"
import { clientConfig } from "~/lib/config"

const customErrorAlphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"
const errorIdSize = 8

/**
 * Creates a unique, user-friendly error ID using `nanoid`.
 * The alphabet is customized to exclude lookalike characters.
 */
export const createErrorId = customAlphabet(customErrorAlphabet, errorIdSize)

/**
 * Reports an error to Sentry, if configured, or logs it to the console.
 *
 * It generates a unique, user-facing error ID that is included in the report,
 * allowing for easy correlation between what the user sees and the logged error.
 *
 * @param error - The error object or value to report.
 * @param tags - Optional tags to add to the Sentry event for categorization.
 * @param context - Optional extra data to include in the Sentry event.
 * @returns The generated unique error ID.
 */
export function reportError(
    error: unknown,
    tags: Record<string, string> = {},
    context?: Record<string, unknown>,
): string {
    const errorId =
        createErrorId()
            .match(/.{1,4}/g)
            ?.join("-") || createErrorId()

    if (clientConfig.analytics.sentry?.dsn) {
        Sentry.captureException(error, {
            tags,
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

/**
 * A generic error handler for use within Remix `loader` functions.
 *
 * This function catches various types of errors and transforms them into
 * appropriate `Response` objects. It handles specific HTTP statuses (like 401, 403, 404),
 * permission errors, and invalid parameter errors, returning user-friendly messages.
 * All other unexpected errors are reported to Sentry and a generic 500-level
 * error message with a unique error ID is returned.
 *
 * @param error - The caught error object or value.
 * @returns A Remix `Response` object (often created with `data` or `redirect`).
 */
export function handleLoaderError(error: unknown) {
    // Handle thrown `Response` objects.
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "statusText" in error &&
        typeof error.status === "number" &&
        typeof error.statusText === "string"
    ) {
        console.warn(`Loader error: ${error.status} - ${error.statusText}`)
        let userMessage = "Er is iets fout gegaan."
        switch (error.status) {
            case 400:
                userMessage = error.statusText
                break
            case 401:
                return redirect("/signin")
            case 403:
                userMessage = "U heeft geen rechten om deze actie uit te voeren."
                break
            case 404:
                userMessage = "De gevraagde data kon niet worden gevonden."
                break
            default:
                userMessage =
                    "Er is een onverwachte fout opgetreden. Probeer het later opnieuw."
                break
        }
        return data({ warning: error }, { status: error.status, statusText: userMessage })
    }

    // Handle specific error messages.
    if (error instanceof Error) {
        if (
            error.message ===
            "Principal does not have permission to perform this action"
        ) {
            console.warn("Permission denied: ", error)
            return data({ warning: error.message }, { status: 403, statusText: "U heeft helaas geen rechten om dit te doen." })
        }
        if (
            error.message.startsWith("missing: ") ||
            error.message.startsWith("invalid: ")
        ) {
            console.warn(error.message)
            return data({ warning: error }, { status: 400, statusText: "Ongeldige waarde" })
        }
        if (error.message.startsWith("not found")) {
            console.warn(error.message)
            return data({ warning: error }, { status: 404, statusText: "Pagina is niet gevonden" })
        }
    }

    // Handle all other unexpected errors.
    console.error("Loader Error: ", error)
    const errorId = reportError(error, { scope: "loader" })
    return data(
        { warning: error instanceof Error ? error.message : "Unknown error" },
        {
            status: 500,
            statusText: `Er is helaas iets fout gegaan. Meld de volgende foutcode: ${errorId}.`,
        },
    )
}

/**
 * A generic error handler for use within Remix `action` functions.
 *
 * Similar to `handleLoaderError`, this function transforms errors into user-friendly
 * feedback, but it uses `dataWithError` and `dataWithWarning` from `remix-toast`
 * to display toast notifications on the client-side instead of rendering an error page.
 *
 * @param error - The caught error object or value.
 * @returns A Remix `Response` object configured to display a toast message.
 */
export function handleActionError(error: unknown) {
    // Handle thrown `Response` objects.
    if (
        typeof error === "object" &&
        error !== null &&
        "status" in error &&
        "statusText" in error &&
        typeof error.status === "number" &&
        typeof error.statusText === "string"
    ) {
        console.warn(`Action error: ${error.status} - ${error.statusText}`)
        let userMessage = "Er is iets fout gegaan."
        let isWarning = false
        switch (error.status) {
            case 400:
                userMessage = error.statusText
                isWarning = true
                break
            case 401:
                return redirect("/signin")
            case 403:
                userMessage = "U heeft geen rechten om deze actie uit te voeren."
                isWarning = true
                break
            case 404:
                userMessage = "De gevraagde data kon niet worden gevonden."
                isWarning = true
                break
            default:
                userMessage = "Er is een onverwachte fout opgetreden."
                break
        }
        return isWarning
            ? dataWithWarning({ error }, userMessage)
            : dataWithError({ error }, userMessage)
    }

    // Handle specific error messages.
    if (error instanceof Error) {
        if (
            error.message ===
            "Principal does not have permission to perform this action"
        ) {
            console.warn("Permission denied: ", error)
            return dataWithWarning({ error }, "U heeft helaas geen rechten om dit te doen.")
        }
        if (
            error.message.startsWith("missing: ") ||
            error.message.startsWith("invalid: ")
        ) {
            console.warn(error.message)
            return dataWithWarning({ error }, error.message)
        }
    }

    // Handle all other unexpected errors.
    console.error("Error: ", error)
    const errorId = reportError(error, { scope: "action" })
    return dataWithError(
        error instanceof Error ? error.message : "Unknown error",
        `Er is helaas iets fout gegaan. Meld de volgende foutcode: ${errorId}.`,
    )
}
