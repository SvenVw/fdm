import { type MetaFunction, type LoaderFunctionArgs, data, useLocation, Outlet } from "react-router";
import { useLoaderData } from "react-router";
import wkx from 'wkx'

// Components
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

// FDM
import { fdm } from "../lib/fdm.server";
import { getField } from "@svenvw/fdm-core";
import { FieldMap } from "@/components/blocks/field-map";

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

    // Get the field id
    const b_id = params.b_id
    if (!b_id) {
        throw data("Field ID is required", { status: 400, statusText: "Field ID is required" });
    }

    // Get the field data
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field not found", { status: 404, statusText: "Field not found" });
    }

    // Get the geojson
    if (!field.b_geometry) {
        throw data("Field geometry is required", { status: 400, statusText: "Field geometry is required" });
    }
    const b_geojson = wkx.Geometry.parse(field.b_geometry).toGeoJSON()
    // console.log(b_geojson)

    // Get Mapbox token
    const mapboxToken = String(process.env.MAPBOX_TOKEN)
    if (!mapboxToken) {
        throw data("MAPBOX_TOKEN environment variable is not set", { status: 500, statusText: "MAPBOX_TOKEN environment variable is not set" });
    }

    return {
        b_id: b_id,
        b_id_farm: b_id_farm,
        b_name: field.b_name,
        b_area: field.b_area,
        b_geojson: b_geojson,
        mapboxToken: mapboxToken
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>();
    const { pathname } = useLocation();

    const items = [
        {
            title: 'Perceel',
            href: `/app/addfarm/${loaderData.b_id_farm}/fields/${loaderData.b_id}/field`
        },
        {
            title: 'Gewas',
            href: `/app/addfarm/${loaderData.b_id_farm}/fields/${loaderData.b_id}/crop`
        },
        {
            title: 'Bodem',
            href: `/app/addfarm/${loaderData.b_id_farm}/fields/${loaderData.b_id}/soil_analysis`
        },
        {
            title: 'Grondbewerking',
            href: `/app/addfarm/${loaderData.b_id_farm}/fields/${loaderData.b_id}/soil_management`
        }
    ]

    return (
        <>
            <div className="flex-1 lg:max-w-3xl">
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-medium">{loaderData.b_name}</h3>
                        <p className="text-sm text-muted-foreground">
                            {Math.round(loaderData.b_area * 10) / 10} ha
                        </p>
                    </div>

                    <Pagination>
                        <PaginationContent className="">
                            {items.map((item) => (
                                <PaginationItem
                                    key={item.href}
                                >
                                    <PaginationLink
                                        href={item.href}
                                        size="default"
                                        isActive={pathname === item.href}
                                    >
                                        {item.title}
                                    </PaginationLink>
                                </PaginationItem>
                            ))}
                        </PaginationContent>
                    </Pagination>
                    <Outlet />
                </div>
            </div>
            <aside>
                <FieldMap
                    b_geojson={loaderData.b_geojson}
                    mapboxToken={loaderData.mapboxToken}
                />
            </aside>
        </>
    );
}
