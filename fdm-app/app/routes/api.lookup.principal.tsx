import { lookupPrincipal } from "@svenvw/fdm-core"
import type { LoaderFunctionArgs } from "react-router-dom"
import { handleLoaderError } from "~/lib/error"
import { getSession } from "~/lib/auth.server"
import { fdm } from "../lib/fdm.server"

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

export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await getSession(request);

        // Get identifier from URL query parameters
        const url = new URL(request.url)
        const identifier = url.searchParams.get("identifier") // Read 'identifier' param

        if (!identifier) {
            return [] // Return empty array directly
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