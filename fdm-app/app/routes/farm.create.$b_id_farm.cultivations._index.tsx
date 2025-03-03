import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getCultivationPlan } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, redirect } from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Redirect to first cultivation
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("b_id_farm is required")
        }

        // Get the session
        const session = await getSession(request)

        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        if (!cultivationPlan.length) {
            throw new Error("No cultivations found for this farm")
        }
        return redirect(`./${cultivationPlan[0].b_lu_catalogue}/crop`)
    } catch (error) {
        throw handleLoaderError(error)
    }
}
