import { type MetaFunction, type LoaderFunctionArgs, data, NavLink } from "react-router";
import { Outlet, useLoaderData } from "react-router";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster"
import { Button } from "@/components/ui/button";
import { SidebarPage } from "@/components/custom/sidebar-page";

// Blocks


// FDM
import { fdm } from "../lib/fdm.server";
import { getCultivationPlan, getFarm } from "@svenvw/fdm-core";

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ];
};

// Loader
export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }
    const farm = await getFarm(fdm, b_id_farm)
        .catch(error => {
            throw data(`Failed to fetch farm: ${error.message}`, { 
                status: 404,
                statusText: "Farm not found"
            });
        });
    
    if (!farm) {
        throw data("Farm not found", { status: 404, statusText: "Farm not found" });
    }

    // Get the cultivationPlan
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm)

    // Create the sidenav
    const sidebarPageItems = cultivationPlan.map(cultivation => {
        return {
            title: cultivation.b_lu_name,
            to: `/app/addfarm/${b_id_farm}/cultivations/${cultivation.b_lu_catalogue}`
        }
    })

    return {
        cultivationPlan: cultivationPlan,
        sidebarPageItems: sidebarPageItems,
        b_id_farm: b_id_farm,
        b_name_farm: farm.b_name_farm,
    }

}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>
                                Maak een bedrijf
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>
                                {loaderData.b_name_farm}
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator className="hidden md:block" />
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>
                                Vul gewasinformatie in
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main>
                <div className="space-y-6 p-10 pb-16">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">Bouwplan</h2>
                            <p className="text-muted-foreground">
                                Werk de eigenschappen per gewas in je bouwplan bij.
                            </p>
                        </div>

                        <div className="ml-auto">
                            <NavLink to={`/app/addfarm/${loaderData.b_id_farm}/cattle`} className="ml-auto">
                                <Button>Doorgaan</Button>
                            </NavLink>
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
            </main>
            <Toaster />
        </SidebarInset >
    );
}

