
import { fdm } from "@/lib/fdm.server"
import { getCultivation, getField } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    data,
} from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the field id
    const b_id = params.b_id
    if (!b_id) {
        throw data("Field ID is required", {
            status: 400,
            statusText: "Field ID is required",
        })
    }

    // Get details of field
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field is not found", {
            status: 404,
            statusText: "Field is not found",
        })
    }

    // Get the cultivation id
    const b_lu = params.b_lu
    if (!b_lu) {
        throw data("cultivation ID is required", {
            status: 400,
            statusText: "Cultivation ID is required",
        })
    }

    // Get cultivations of field
    const cultivation = await getCultivation(fdm, b_lu)
    if (!cultivation) {
        throw data("Cultivation is not found", {
            status: 404,
            statusText: "Cultivation is not found",
        })
    }

    // Return user information from loader
    return {
        cultivation: cultivation,
    }
}

export default function FarmFieldsCultivationBlock() {
    return null
}
