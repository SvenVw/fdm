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
import { getFields, updateField } from "@svenvw/fdm-core";
import { Button } from "@/components/ui/button";

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
    const b_id_farm = params.b_id_farm
    const fields = await getFields(fdm, b_id_farm)

    const fieldsWithGeojson = fields.map(field => {
        field.b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()
        return field
    });

    // Sort by created
    fieldsWithGeojson.sort((a, b) => new Date(a.created).getTime() - new Date(b.created).getTime())


    // Get the Mapbox token
    const mapboxToken = String(process.env.MAPBOX_TOKEN)

    return json({
        fields: fieldsWithGeojson,
        mapboxToken: mapboxToken,
        action: `/app/addfarm/${b_id_farm}/fields`
    })

}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>();
    // const navigation = useNavigation();

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
                <Button className="mx-auto">Doorgaan</Button>
            </header>
            <main>
                <Fields
                    fields={loaderData.fields}
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
    const b_id = formData.get('b_id')
    const b_name = formData.get('b_name')
    const b_id_source = undefined
    const b_geometry = undefined
    const b_manage_start = undefined
    const b_manage_end = undefined
    const b_manage_type = undefined

    const updatedField = await updateField(fdm, b_id, b_name, b_id_source, b_geometry, b_manage_start, b_manage_end, b_manage_type)

    return (json({ field: updatedField }))
}