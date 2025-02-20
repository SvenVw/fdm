import { fdm } from "@/lib/fdm.server"
import { getCultivationPlan } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, redirect } from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Redirect to first cultivation
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm)
    if (!cultivationPlan.length) {
        throw new Error("No cultivations found for this farm")
    }
    return redirect(`./${cultivationPlan[0].b_lu_catalogue}/crop`)
}
