import { FarmContent } from "@/components/custom/farm/farm-content";
import { FarmHeader } from "@/components/custom/farm/farm-header";
import { FarmTitle } from "@/components/custom/farm/farm-title";
import { SidebarInset } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/sonner";
import { auth } from "@/lib/auth.server";
import { fdm } from "@/lib/fdm.server";
import { getFarm, getFarms } from "@svenvw/fdm-core";
import { data, LoaderFunctionArgs, Outlet, useLoaderData } from "react-router";

export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get details of farm
    let farm;
    try {
        farm = await getFarm(fdm, b_id_farm)
        if (!farm) {
            throw data("Farm is not found", { status: 404, statusText: "Farm is not found" });
        }
    } catch (error) {
        console.error("Failed to fetch farm details:", error);
        throw data("Failed to fetch farm details", {
            status: 500,
            statusText: "Internal Server Error"
        });
    }

    // Set farm to active
    try {
        await auth.api.updateUser({
            body: {
                farm_active: b_id_farm,
            },
            headers: request.headers
        })
    } catch (error) {
        console.error("Failed to update active farm:", error);
        throw data("Failed to update active farm", {
            status: 500,
            statusText: "Internal Server Error"
        });
    }

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            b_id_farm: farm.b_id_farm,
            b_name_farm: farm.b_name_farm
        }
    })

    // Create the items for sidebar page
    const sidebarPageItems = [
        {
            to: `/farm/${b_id_farm}/settings/properties`,
            title: "Gegevens"
        },
        {
            to: `/farm/${b_id_farm}/settings/access`,
            title: "Toegang"
        },
        {
            to: `/farm/${b_id_farm}/settings/delete`,
            title: "Verwijderen"
        }
    ]

    // Return user information from loader
    return {
        farm: farm,
        b_id_farm: b_id_farm,
        farmOptions: farmOptions,
        sidebarPageItems: sidebarPageItems
    }
}

export default function FarmContentBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={undefined}
            />
            <main>
                <FarmTitle
                    title={"Instellingen"}
                    description={"Beheer de instellingen van je bedrijf"}
                />
                <FarmContent
                    sidebarItems={loaderData.sidebarPageItems}       
                    children={<Outlet/>}             
                />
                <Toaster/>
            </main>
        </SidebarInset>
    )
}