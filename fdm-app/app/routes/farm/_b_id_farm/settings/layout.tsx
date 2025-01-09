import { data, LoaderFunctionArgs, Outlet, useLoaderData } from "react-router";
import { getFarm, getFarms } from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";
import { auth } from "@/lib/auth.server";

// Components
import { Separator } from "@/components/ui/separator";
import { SidebarPage } from "@/components/custom/sidebar-page";

// Blocks

export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get details of farm
    const farm = await getFarm(fdm, b_id_farm)
    if (!farm) {
        throw data("Farm is not found", { status: 404, statusText: "Farm is not found" });
    }

    // Set farm to active
    await auth.api.updateUser({
        body: {
            farm_active: b_id_farm,
        },
        headers: request.headers
    })

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            value: farm.b_id_farm,
            label: farm.b_name_farm
        }
    })

    // Create the items for sidebar page
    const sidebarPageItems = [
        {
            to: `/farm/${farm.b_id_farm}/settings/properties`,
            title: "Gegevens"
        },
        {
            to: `/farm/${farm.b_id_farm}/settings/access`,
            title: "Toegang"
        },
        {
            to: `/farm/${farm.b_id_farm}/settings/delete`,
            title: "Verwijderen"
        }
    ]



    // Return user information from loader
    return {
        farm: farm,
        farmOptions: farmOptions,
        sidebarPageItems: sidebarPageItems
    }
}

export default function FarmSettingsLayout() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
            <div className="space-y-6 p-10 pb-16">
                <div className="flex items-center">
                    <div className="space-y-0.5">
                        <h2 className="text-2xl font-bold tracking-tight">Bedrijf</h2>
                        <p className="text-muted-foreground">
                            Beheer de gegevens en instellingen van dit bedrijf
                        </p>
                    </div>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                    <aside className="-mx-4 lg:w-1/5">
                        <SidebarPage items={loaderData.sidebarPageItems} />
                    </aside>
                    <div className="flex-1 lg:max-w-2xl"><Outlet /></div>
                </div>
            </div>
        </>
    )
}