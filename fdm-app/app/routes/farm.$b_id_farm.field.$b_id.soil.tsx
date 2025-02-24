import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { getField } from "@svenvw/fdm-core"
import { type LoaderFunctionArgs, data, useLoaderData } from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
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

    // Get details of field
    const field = await getField(fdm, b_id)
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
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Bodem</h3>
                <p className="text-sm text-muted-foreground">
                    Binnenkort kunt u hier de bodemanalyses bekijken en bewerken
                </p>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-8" />
        </div>
    )
}
