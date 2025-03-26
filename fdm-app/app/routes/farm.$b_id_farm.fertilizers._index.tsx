import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import {
    columns,
    type Fertilizer,
} from "@/components/custom/fertilizer/columns"
import { DataTable } from "@/components/custom/fertilizer/table"
import { SidebarInset } from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getFarm, getFarms, getFertilizers } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    Outlet,
    data,
    useLoaderData,
} from "react-router"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("invalid: b_id_farm", {
                status: 400,
                statusText: "invalid: b_id_farm",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get details of farm
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        if (!farms || farms.length === 0) {
            throw data("not found: farms", {
                status: 404,
                statusText: "not found: farms",
            })
        }

        const farmOptions = farms.map((farm) => {
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the available fertilizers
        const fertilizers: Fertilizer[] = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        // console.log(fertilizers)

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fertilizers: fertilizers,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the layout for managing farm settings.
 *
 * This component displays a sidebar that includes the farm header, navigation options, and a link to farm fields.
 * It also renders a main section containing the farm title, description, nested routes via an Outlet, and a notification toaster.
 */
export default function FarmFertilizersBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={{
                    to: `/farm/${loaderData.b_id_farm}/fertilizers/new`,
                    label: "Meststof toevoegen",
                }}
            />
            <main>
                <FarmTitle
                    title={"Meststoffen"}
                    description={"Beheer de meststoffen van dit bedrijf"}
                />
                <div className="space-y-6 p-10 pb-0">
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <div className="flex-1">
                            <DataTable
                                columns={columns}
                                data={loaderData.fertilizers}
                            />
                        </div>
                    </div>
                </div>
            </main>
        </SidebarInset>
    )
}
