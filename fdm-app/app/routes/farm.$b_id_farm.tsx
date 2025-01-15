import { auth } from "@/lib/auth.server"
import { type LoaderFunctionArgs, data } from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }

    // Set the farm id to active
    try {
        await auth.api.updateUser({
            body: {
                farm_active: b_id_farm,
            },
            headers: request.headers,
        })
    } catch (error) {
        throw data("Failed to update active farm", {
            status: 500,
            statusText: "Internal Server Error",
        })
    }
}
