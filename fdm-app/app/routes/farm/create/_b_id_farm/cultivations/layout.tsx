import { type MetaFunction, type LoaderFunctionArgs, data, NavLink, useLocation } from "react-router";
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
import { fdm } from "@/lib/fdm.server";
import { getCultivationPlan, getFarm } from "@svenvw/fdm-core";
import { PaginationLayout } from "@/components/custom/farm-layout/pagination";
import { ContentLayout } from "@/components/custom/farm-layout/content";
import { FarmHeader } from "@/components/custom/farm-layout/header";

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
            to: `/farm/create/${b_id_farm}/cultivations/${cultivation.b_lu_catalogue}`
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
export default function CreateFarmCultivationsLayout() {
    const loaderData = useLoaderData<typeof loader>();

    return (

        <SidebarInset>
            <FarmHeader
                farmName={loaderData.b_name_farm}
                breadcrumbs={[
                    { label: "Maak een bedrijf" },
                    { label: loaderData.b_name_farm },
                    { label: "Vul het bouwplan in" }
                ]}
                action={{
                    label: "Doorgaan",
                    to: `/farm/create/${loaderData.b_id_farm}/cattle`,
                    disabled: loaderData.sidebarPageItems.length === 0
                }}
            />
            <ContentLayout
                title="Bouwplan"
                description="Vul de gegevens in per onderdeel van het bouwplan"
                sidebarItems={loaderData.sidebarPageItems}
            />
            <Toaster />
        </SidebarInset>


    );
}
