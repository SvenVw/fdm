import { getSession } from "@/lib/auth.server"
import { getTimeframe } from "@/lib/calendar"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getCultivationPlan } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, redirect } from "react-router"

/**
 * Loads data for a farm and redirects to the crop page of its first cultivation.
 *
 * This function validates the presence of a farm identifier from the URL parameters, retrieves the user session,
 * and fetches the related cultivation plan. If the farm ID is missing or no cultivation plan is found, it throws an error.
 * All errors are processed by a custom error handler.
 *
 * @returns A redirect response to the crop page based on the first cultivation's catalogue.
 *
 * @throws {Error} If the farm identifier is missing or if no cultivations exist for the given farm.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Redirect to first cultivation
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("b_id_farm is required")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
        if (!cultivationPlan.length) {
            throw new Error("No cultivations found for this farm")
        }
        return redirect(`./${cultivationPlan[0].b_lu_catalogue}/crop`)
    } catch (error) {
        throw handleLoaderError(error)
    }
}
