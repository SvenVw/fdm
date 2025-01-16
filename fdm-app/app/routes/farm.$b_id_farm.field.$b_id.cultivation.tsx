import { FarmPagination } from "@/components/custom/farm/farm-pagination"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { getCultivations, getField} from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    Outlet,
    data,
    useLoaderData,
    useLocation,
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

    // Get cultivations of field
    const cultivations = await getCultivations(fdm, b_id)
    if (!cultivations) {
        throw data("Cultivations are not found", {
            status: 404,
            statusText: "Cultivations are not found",
        })
    }

    const cultivationItems = cultivations.map((cultivation) => { 
        return {
            to: cultivation.b_lu,
            label: cultivation.b_lu_name
        }
    })

    cultivationItems.push({
        to: "./create",
        label: "Nieuw gewas"
    })

    // Return user information from loader
    return {
        field: field,
        cultivationItems: cultivationItems,
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gewasssen</h3>
                <p className="text-sm text-muted-foreground">
                    Werk de gegevens bij van dit gewas
                </p>
            </div>
            <Separator />
            <FarmPagination
                items={loaderData.cultivationItems}
                currentPath={location.pathname}
            >
                <Outlet/>
            </FarmPagination>
        </div>
    )
}

