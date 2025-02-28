import { getSession } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getFields } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, redirect } from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Redirect to first cultivation
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }

    // Get the session
    const session = await getSession(request)

    const fields = await getFields(fdm, session.principal_id, b_id_farm)
    if (!fields.length) {
        throw new Error("No fields found for this farm")
    }
    return redirect(`./${fields[0].b_id}`)
}
