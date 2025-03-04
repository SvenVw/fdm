import { getSession } from "@/lib/auth.server"
import { handleActionError } from "@/lib/error"
import { type LoaderFunctionArgs, data } from "react-router"

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
        throw handleActionError(error)
    }
}
