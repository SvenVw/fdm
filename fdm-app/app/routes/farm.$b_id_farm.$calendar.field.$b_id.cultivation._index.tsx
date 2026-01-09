import { getCultivations } from "@svenvw/fdm-core"
import {
    data,
    isRouteErrorResponse,
    type LoaderFunctionArgs,
    redirect,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "./+types/farm.$b_id_farm.$calendar.field.$b_id.cultivation._index"

export const noCultivationsFoundStatusText = "No cultivations found"
export async function loader({ request, params }: LoaderFunctionArgs) {
    let cultivations: Awaited<ReturnType<typeof getCultivations>> = []
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

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get cultivations for the field
        cultivations = await getCultivations(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )
    } catch (error) {
        throw handleLoaderError(error)
    }

    if (cultivations.length === 0) {
        throw data("No cultivations found for this field", {
            status: 404,
            statusText: noCultivationsFoundStatusText,
        })
    }

    // Redirect to overview page
    const url = new URL(request.url)
    return redirect(`./${cultivations[0].b_lu}${url.search}`)
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
    if (
        isRouteErrorResponse(error) &&
        error.statusText === noCultivationsFoundStatusText
    ) {
        // The parent route will see that there are no cultivations, and show a message to the user
        // This route can just be rendered blank.
        return null
    }

    throw error
}
