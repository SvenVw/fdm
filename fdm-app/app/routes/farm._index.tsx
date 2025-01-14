
// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Blocks
import MissingFarm from "@/components/blocks/missing-farm";
import { LoaderFunctionArgs, redirect, useLoaderData } from "react-router";
import { auth } from "@/lib/auth.server";
import { FarmHeader } from "@/components/custom/farm/farm-header";
import { getFarms } from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";

export async function loader({
    request,
}: LoaderFunctionArgs) {

    // Get the session
    const session = await auth.api.getSession({
        headers: request.headers
    })

    // Get the active farm and redirect to it
    const b_id_farm = session?.user?.farm_active

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            b_id_farm: farm.b_id_farm,
            b_name_farm: farm.b_name_farm
        }
    })

    console.log(farmOptions)

    // Return user information from loader
    return {
        b_id_farm: b_id_farm,
        farmOptions: farmOptions
    }
}

export default function AppIndex() {
    const loaderData = useLoaderData<typeof loader>()

    return (

        <SidebarInset>
            <FarmHeader 
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                action={undefined}
            />
            <main>
                {loaderData.farmOptions.length === 0 ? (
                    <MissingFarm />
                ) : (
                    // Render something else if b_id_farms is not empty
                    <div>Je hebt een bedrijf!</div>
                )}
            </main>
        </SidebarInset>

    )
} { }