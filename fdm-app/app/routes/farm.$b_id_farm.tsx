import { data, type LoaderFunctionArgs, type MetaFunction } from "react-router"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { InlineErrorBoundary } from "~/components/custom/inline-error-boundary"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
import { useFarmFieldOptionsStore } from "~/store/farm-field-options"
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
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Return the farm ID and session info
        return {
            farmId: b_id_farm,
            session,
        }
    } catch (error) {
        return handleActionError(error)
    }
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    const farmFieldOptionsStore = useFarmFieldOptionsStore()
    const { params } = props

    return (
        <SidebarInset>
            <Header action={undefined}>
                <HeaderFarm
                    b_id_farm={params.b_id_farm}
                    farmOptions={farmFieldOptionsStore.farmOptions}
                />
            </Header>
            <InlineErrorBoundary {...props} />
        </SidebarInset>
    )
}
