import { type MetaFunction, type LoaderFunctionArgs, data, Outlet } from "react-router";
import { useLoaderData } from "react-router";
import wkx from 'wkx'

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster"

// Blocks
import { Fields } from "@/components/blocks/fields";

// FDM
import { fdm } from "../lib/fdm.server";
import { getCultivations, getCultivationsFromCatalogue, getFarm, getFields, updateField } from "@svenvw/fdm-core";
import { Button } from "@/components/ui/button";
import { SidebarPage } from "@/components/custom/sidebar-page";

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

    // const fieldsWithGeojson = await Promise.all(fields.map(async field => {
    //     if (!field.b_geometry) {
    //         return field;
    //     }
    //     field.b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()

    //     // Get cultivation of field
    //     const cultivations = await getCultivations(fdm, field.b_id)
    //     field.cultivations = cultivations[0] ?? { b_lu: "" };

    //     return field
    // }));

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
            href: `/app/addfarm/${b_id_farm}/fields/${field.b_id}`
        }
    })

    return {
        sidebarPageItems: sidebarPageItems,
        cultivationOptions: cultivationOptions,
        mapboxToken: mapboxToken,
        b_id_farm: b_id_farm,
        b_name_farm: farm.b_name_farm,
        action: `/app/addfarm/${b_id_farm}/fields`
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
                                Vul perceelsinformatie in
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main>
                <div className="space-y-6 p-10 pb-16">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">Percelen</h2>
                            <p className="text-muted-foreground">
                                Pas de naam aan, controleer het gewas en bodemtype
                            </p>
                        </div>

                        <div className="ml-auto">
                            <a href={`/app/addfarm/${loaderData.b_id_farm}/cultivations`} className="ml-auto">
                                <Button>Doorgaan</Button>
                            </a>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <aside className="-mx-4 lg:w-1/5">
                            <SidebarPage items={loaderData.sidebarPageItems} />
                        </aside>
                        <Outlet />                        
                    </div>
                </div>
            </main>
            <Toaster />
        </SidebarInset >
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