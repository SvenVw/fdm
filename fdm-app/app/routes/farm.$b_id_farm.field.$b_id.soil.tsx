import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { getField } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, data, useLoaderData } from "react-router"
import type { MetaFunction } from "react-router"
import config from "@/fdm.config"

export const meta: MetaFunction = () => {
    return [
        { title: `Bodemanalyse - Perceel | ${config.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de bodemanalyses van je perceel.",
        },
    ]
}

/**
 * Retrieves details of a specific farm field.
 *
 * This asynchronous function validates that the required farm ID (`b_id_farm`)
 * and field ID (`b_id`) are provided in the parameters. It then obtains the user
 * session from the request and uses it to fetch the corresponding field details.
 * If either identifier is missing, it throws an error with a 400 status. If the field
 * is not found, it throws an error with a 404 status.
 *
 * @param request - The incoming HTTP request.
 * @param params - Route parameters expected to include `b_id_farm` and `b_id`.
 * @returns An object containing the field details.
 *
 * @throws {Error} If the farm ID is missing (HTTP 400).
 * @throws {Error} If the field ID is missing (HTTP 400).
 * @throws {Error} If the field is not found (HTTP 404).
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

        // Get the field id
        const b_id = params.b_id
        if (!b_id) {
            throw data("Field ID is required", {
                status: 400,
                statusText: "Field ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of field
        const field = await getField(fdm, session.principal_id, b_id)
        if (!field) {
            throw data("Field is not found", {
                status: 404,
                statusText: "Field is not found",
            })
        }

        // Return user information from loader
        return {
            field: field,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders an overview block for farm field details.
 *
 * This component displays a section with a title ("Bodem") and a description indicating that soil analyses will be available soon. It utilizes loader data from the corresponding loader function and includes a separator and grid layout reserved for future content.
 */
export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Bodem</h3>
                <p className="text-sm text-muted-foreground">
                    Binnenkort kunt u hier de bodemanalyses bekijken en bewerken
                </p>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-8" />
        </div>
    )
}
