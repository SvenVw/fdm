import { type MetaFunction, type ActionFunctionArgs, type LoaderFunctionArgs, redirect, json } from "@remix-run/node";
import { useNavigation, useLoaderData } from "@remix-run/react";
import wkx from 'wkx'

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Toaster } from "@/components/ui/toaster"

// Blocks
import { Fields } from "@/components/blocks/fields";

// FDM
import { fdm } from "../services/fdm.server";
import { getCultivationsFromCatalogue, getFields, updateField } from "@svenvw/fdm-core";
import { Button } from "@/components/ui/button";
import { cultivationsCatalogue } from "node_modules/@svenvw/fdm-core/dist/db/schema";

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
        throw new Response("Farm ID is required", { status: 400 });
    }

    // Get the fields
    const fields = await getFields(fdm, b_id_farm)

    const fieldsWithGeojson = fields.map(field => {
        if (!field.b_geometry) {
            return field;
        }
        field.b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()
        return field
    });

    // Sort by created
    fieldsWithGeojson.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())

    // Get the Mapbox Token
    const mapboxToken = process.env.MAPBOX_TOKEN;
    if (!mapboxToken) {
        throw new Error("MAPBOX_TOKEN environment variable is not set");
    }

    // Get the available cultivations
    const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
    const cultivationOptions = cultivationsCatalogue.map(cultivation => {
        return {
            value: cultivation.b_lu_catalogue,
            label: `${cultivation.b_lu_name} (${cultivation.b_lu_catalogue.split('_')[1]})`
        }
    })

    return json({
        fields: fieldsWithGeojson,
        cultivationOptions: cultivationOptions,
        mapboxToken: mapboxToken,
        b_id_farm: b_id_farm,
        action: `/app/addfarm/${b_id_farm}/fields`
    })

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
                                Vul perceelsinformatie in
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
                <a href={`/app/addfarm/${loaderData.b_id_farm}/cultivations`} className="ml-auto">
                    <Button>Doorgaan</Button>
                </a>
            </header>
            <main>
                <Fields
                    fields={loaderData.fields}
                    cultivationOptions={loaderData.cultivationOptions}
                    mapboxToken={loaderData.mapboxToken}
                    action={loaderData.action}
                />
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
        throw new Response("Field ID is required", { status: 400 });
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
        return json({ field: updatedField });
    } catch (error) {
        throw new Response(
            `Failed to update field: ${error instanceof Error ? error.message : 'Unknown error'}`,
            { status: 500 }
        );
    }
}