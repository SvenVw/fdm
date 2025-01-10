import { type MetaFunction, type LoaderFunctionArgs, data, Outlet, NavLink } from "react-router";
import { useLoaderData } from "react-router";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster"

// FDM
import { fdm } from "@/lib/fdm.server";
import { getCultivationsFromCatalogue, getFarm, getFields, updateField } from "@svenvw/fdm-core";
import { Button } from "@/components/ui/button";
import { SidebarPage } from "@/components/custom/sidebar-page";
import { cn } from "@/lib/utils";
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

    // Get the Id and name of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }
    const farm = await getFarm(fdm, b_id_farm)

    // Get the fields
    const fields = await getFields(fdm, b_id_farm)

    // Sort by name
    fields.sort((a, b) => a.b_name.localeCompare(b.b_name));

    // Get the Mapbox Token
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
        throw data("MAPBOX_TOKEN environment variable is not set", { status: 500, statusText: "MAPBOX_TOKEN environment variable is not set" });
    }

    // Get the available cultivations
    let cultivationOptions = [];
    try {
        const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
        cultivationOptions = cultivationsCatalogue
            .filter(cultivation => cultivation?.b_lu_catalogue && cultivation?.b_lu_name)
            .map(cultivation => ({
                value: cultivation.b_lu_catalogue,
                label: `${cultivation.b_lu_name} (${cultivation.b_lu_catalogue.split('_')[1]})`
            }));
    } catch (error) {
        console.error('Failed to fetch cultivations:', error);
        throw data(
            'Failed to load cultivation options',
            { status: 500, statusText: 'Failed to load cultivation options' }
        );
    }

    // Create the sidenav
    const sidebarPageItems = fields.map(field => {
        return {
            title: field.b_name,
            to: `/farm/create/${b_id_farm}/fields/${field.b_id}`
        }
    })

    return {
        sidebarPageItems: sidebarPageItems,
        cultivationOptions: cultivationOptions,
        mapboxToken: mapboxToken,
        b_id_farm: b_id_farm,
        b_name_farm: farm.b_name_farm,
        action: `/farm/create/${b_id_farm}/fields`
    }

}

// Main
export default function CreateFarmFieldsLayout() {
    const loaderData = useLoaderData<typeof loader>();

    return (
        <SidebarInset>
            <FarmHeader
                farmName={loaderData.b_name_farm}
                breadcrumbs={[
                    { label: "Maak een bedrijf" },
                    { label: loaderData.b_name_farm },
                    { label: "Vul perceelsinformatie in" }
                ]}
                action={{
                    label: "Doorgaan",
                    to: `/farm/create/${loaderData.b_id_farm}/cultivations`,
                    disabled: loaderData.sidebarPageItems.length === 0
                }}
            />
            <ContentLayout
                title="Percelen"
                description="Pas de naam aan, controleer het gewas en bodemgegevens"
                sidebarItems={loaderData.sidebarPageItems}
            />
            <Toaster />
        </SidebarInset>
    );
}


// Action
export async function action({
    request, params
}: LoaderFunctionArgs) {
    const formData = await request.formData()
    const b_id = formData.get('b_id')?.toString();
    const b_name = formData.get('b_name')?.toString();

    if (!b_id) {
        throw data("Field ID is required", { status: 400, statusText: "Field ID is required" });
    }
    if (!b_name) {
        throw data("Field name is required", { status: 400, statusText: "Field name is required" });
    }

    try {
        const updatedField = await updateField(
            fdm,
            b_id,
            b_name,
            undefined, // b_id_source
            undefined, // b_geometry
            undefined, // b_manage_start
            undefined, // b_manage_end
            undefined  // b_manage_type
        );
        return { field: updatedField };
    } catch (error) {
        throw data(
            `Failed to update field: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { status: 500, statusText: 'Failed to update field' }
        );
    }
}