import { getField } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Gebruiksnormen - Perceel | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de gebruiksnormen van je perceel.",
        },
    ]
}

/**
 * Loads field details using the farm and field IDs from route parameters.
 *
 * This function validates that both the farm ID and field ID are provided. It then retrieves the current session to obtain the
 * user's principal ID and uses this information to fetch the corresponding field details. If any required ID is missing or if the
 * field is not found, it throws an error with the appropriate HTTP status code. Errors encountered during processing are handled
 * by a centralized error handler.
 *
 * @throws {Response} When the farm ID or field ID is missing, or if the field is not found.
 *
 * @returns An object containing the field details.
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
 * Renders the farm fields overview block displaying usage norms.
 *
 * This component retrieves loader data via `useLoaderData` and displays a heading with descriptive text alongside a visual separator. It also sets up an empty grid layout intended for future content.
 */
export default function FarmFieldsOverviewBlock() {
    const _loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gebruiksnormen</h3>
                <p className="text-sm text-muted-foreground">
                    Binnenkort kunt u hier de gebruiksnormen invoeren
                </p>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-8" />
        </div>
    )
}
