import { getFarm } from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    useLoaderData,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarmCreate } from "~/components/blocks/header/create-farm"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import type { Route } from "./+types/farm.create.$b_id_farm.$calendar.fertilizers.$b_lu_catalogue.manage.new"

export const meta: MetaFunction = () => {
    return [
        { title: `Meststof toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Voeg een meststof toe om deze te gebruiken op dit bedrijf.",
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

        // Get details of farm
        const farm = await getFarm(fdm, session.principal_id, b_id_farm)
        if (!farm) {
            throw data("not found: b_id_farm", {
                status: 404,
                statusText: "not found: b_id_farm",
            })
        }

        const b_name_farm = farm.b_name_farm

        // Return user information from loader
        return {
            b_name_farm: b_name_farm,
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
export default function FarmFertilizerBlock({ params }: Route.ComponentProps) {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <Header
                action={{
                    label: "Terug naar bemesting toevoegen",
                    to: `/farm/create/${params.b_id_farm}/${params.calendar}/fertilizers/${params.b_lu_catalogue}`,
                    disabled: false,
                }}
            >
                <HeaderFarmCreate b_name_farm={loaderData.b_name_farm} />
            </Header>
            <main className="mx-auto max-w-4xl">
                <FarmTitle
                    title={"Meststof toevoegen"}
                    description={
                        "Voeg een meststof toe om deze te gebruiken op dit bedrijf."
                    }
                />
                <div className="space-y-6 p-10 pb-0">
                    <Outlet />
                </div>
            </main>
        </SidebarInset>
    )
}
