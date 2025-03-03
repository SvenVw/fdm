import { FarmContent } from "@/components/custom/farm/farm-content"
import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { getFarm, getFarms } from "@svenvw/fdm-core"
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

        // Create the items for sidebar page
        const sidebarPageItems = [
            {
                to: `/farm/${b_id_farm}/settings/properties`,
                title: "Gegevens",
            },
            {
                to: `/farm/${b_id_farm}/settings/access`,
                title: "Toegang",
            },
            {
                to: `/farm/${b_id_farm}/settings/delete`,
                title: "Verwijderen",
            },
        ]

        // Return user information from loader
        return {
            farm: farm,
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            sidebarPageItems: sidebarPageItems,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmContentBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={{
                    to: `/farm/${loaderData.b_id_farm}/field`,
                    label: "Naar percelen",
                }}
            />
            <main>
                <FarmTitle
                    title={"Instellingen"}
                    description={"Beheer de instellingen van je bedrijf"}
                />
                <FarmContent sidebarItems={loaderData.sidebarPageItems}>
                    <Outlet />
                </FarmContent>
                <Toaster />
            </main>
        </SidebarInset>
    )
}
