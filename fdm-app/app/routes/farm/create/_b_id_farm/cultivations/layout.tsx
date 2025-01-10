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
import { cn } from "@/lib/utils";
import { PaginationLayout } from "@/components/custom/farm-layout/pagination";

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
    const { pathname } = useLocation();

    const items = [
        { title: 'Gewas', href: `/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}` },
        { title: 'Bemesting', href: `/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/fertilizers` },
        { title: 'Vanggewas', href: `/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/covercrop` }
    ];

    return (
        <PaginationLayout
            items={items}
            currentPath={pathname}
        >
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium">{loaderData.cultivation.b_lu_name}</h3>
                    <p className="text-sm text-muted-foreground">
                        {formatFieldNames(loaderData.cultivation.fields)}
                    </p>
                </div>
                <Outlet />
            </div>
        </PaginationLayout>
    );
}

function formatFieldNames(fields: { b_name: string }[]): string {
    if (!fields?.length) return "Geen percelen geselecteerd";

    const fieldNames = fields.map(field => field.b_name);
    if (fieldNames.length === 1) return fieldNames[0];

    if (fieldNames.length === 2) return `${fieldNames[0]} and ${fieldNames[1]}`;

    return `${fieldNames.slice(0, -1).join(", ")}, and ${fieldNames[fieldNames.length - 1]}`;
}