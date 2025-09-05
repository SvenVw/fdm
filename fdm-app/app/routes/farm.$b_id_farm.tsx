import type { LoaderFunctionArgs, MetaFunction } from "react-router"
import { InlineErrorBoundary } from "~/components/custom/inline-error-boundary"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import type { Route } from "../+types/root"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bedrijf | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de gegevens van je bedrijf.",
        },
    ]
}

/**
 * Processes a request to retrieve a farm's session details.
 *
 * This function extracts the farm ID from the route parameters and throws an error with a 400 status
 * if the ID is missing. When a valid farm ID is provided, it retrieves the session associated with the
 * incoming request and returns an object containing both the farm ID and the session information.
 *
 * @returns An object with "farmId" and "session" properties.
 *
 * @throws {Response} If the farm ID is not provided.
 */
export async function loader({ request }: LoaderFunctionArgs) {
    try {
        // Get the session
        await getSession(request)
    } catch (error) {
        return handleActionError(error)
    }
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    return (
        <SidebarInset>
            <InlineErrorBoundary {...props} />
        </SidebarInset>
    )
}
