/**
 * @file This file provides an API endpoint for looking up principals (users and organizations).
 * It's designed to be used by autocomplete components in the frontend.
 * @copyright 2023 Batavi
 * @license MIT
 */
import { lookupPrincipal } from "@svenvw/fdm-core"
import type { LoaderFunctionArgs } from "react-router-dom"
import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Define the expected return type from lookupPrincipal based on previous usage
type CorePrincipal = {
    username: string
    displayUserName: string
    type: "user" | "organization"
}

// Define the structure expected by the AutoComplete component
type AutocompletePrincipal = {
    value: string
    label: string
    icon: "user" | "organization" // Icon identifier string
}

/**
 * Handles GET requests to look up principals.
 *
 * This function retrieves the session, validates the user is authenticated,
 * and then uses the `lookupPrincipal` function from fdm-core to find
 * users and organizations matching the provided identifier. The results are
 * formatted for use in an autocomplete component.
 *
 * @param request - The incoming request object, containing the search identifier.
 * @returns An array of principals formatted for the autocomplete component.
 * @throws {Response} A 401 Unauthorized response if the user is not authenticated.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request)

        // Verify user is authenticated
        if (!session.principal_id) {
            throw new Response("Unauthorized", { status: 401 })
        }

        // Get identifier from URL query parameters
        const url = new URL(request.url)
        const identifier = url.searchParams.get("identifier") // Read 'identifier' param

        if (!identifier) {
            return [] // Return empty array directly
        }

        // Basic validation to prevent malicious input
        // Only allow alphanumeric characters, underscores, and hyphens
        if (!/^[a-zA-Z0-9_-]+$/.test(identifier)) {
            return []
        }
        if (identifier.length < 2 || identifier.length > 100) {
            return [] // Return empty for too short or too long inputs
        }

        const principals: CorePrincipal[] = await lookupPrincipal(
            fdm,
            identifier,
        )

        // Map the result to the format expected by AutoComplete
        const autocompletePrincipals: AutocompletePrincipal[] = principals.map(
            (p) => ({
                value: p.username,
                label: p.displayUserName,
                icon: p.type, // Pass the type as the icon identifier
            }),
        )

        return autocompletePrincipals // Return array directly
    } catch (error) {
        // Use handleLoaderError for loaders
        return handleLoaderError(error)
    }
}
