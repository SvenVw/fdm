import { getCultivationPlan } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from "react-router"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bouwplan - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en selecteer een gewas uit je bouwplan.",
        },
    ]
}

/**
 * Loads cultivation details for a specific farm and catalogue.
 *
 * This function verifies that the route parameters include a valid farm ID and cultivation catalogue ID.
 * It retrieves the user session and fetches the cultivation plan for the specified farm using the session's principal ID.
 * The function then searches for the cultivation matching the provided catalogue ID and returns an object containing the farm ID,
 * the catalogue ID, and the corresponding cultivation details.
 *
 * @throws {Response} When the required farm ID or cultivation catalogue ID is missing, or if the specified cultivation is not found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the Id of the farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the cultivation
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw data("Cultivation catalogue ID is required", {
                status: 400,
                statusText: "Cultivation catalogue ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        // Get the cultivation details for this cultivation
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        const cultivation = cultivationPlan.find(
            (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
        )
        if (!cultivation) {
            throw data("Cultivation not found", {
                status: 404,
                statusText: "Cultivation not found",
            })
        }

        return {
            b_lu_catalogue: b_lu_catalogue,
            b_id_farm: b_id_farm,
            calendar: calendar,
            cultivation: cultivation,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <Outlet />
        </div>
    )
}
