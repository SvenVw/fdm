import { getFertilizers } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import {
    columns,
    type Fertilizer,
} from "~/components/blocks/fertilizer/columns"
import { DataTable } from "~/components/blocks/fertilizer/table"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststoffen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekij de lijst van meststoffen beschikbaar.",
        },
    ]
}

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

        // Get the available fertilizers
        const fertilizers: Fertilizer[] = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        // Return user information from loader
        return {
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
