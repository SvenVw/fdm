import { type MetaFunction, type LoaderFunctionArgs, data, useLocation, Outlet } from "react-router";
import { useLoaderData } from "react-router";

// Components
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

// FDM
import { fdm } from "../lib/fdm.server";
import { getCultivationPlan, getCultivationsFromCatalogue, getField } from "@svenvw/fdm-core";

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

    // Get the cultivation data of field


    // Cultivation options
    const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
    const cultivationOptions = cultivationsCatalogue.map(cultivation => {
        return {
            value: cultivation.b_lu_catalogue,
            label: cultivation.b_lu_name
        }
    })

    return {
        b_id: b_id,
        b_id_farm: b_id_farm,
        field: field,
        cultivationOptions: cultivationOptions
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
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{loaderData.field.b_name}</h3>
                <p className="text-sm text-muted-foreground">
                    {Math.round(loaderData.field.b_area * 10) / 10} ha
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
    );
}
