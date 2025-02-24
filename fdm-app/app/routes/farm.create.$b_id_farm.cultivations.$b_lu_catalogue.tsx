import {
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    data,
    useLocation,
} from "react-router"
import { useLoaderData } from "react-router"

// Components
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"

import {
    getCultivationPlan,
    getCultivationsFromCatalogue,
} from "@svenvw/fdm-core"
// FDM
import { fdm } from "../lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

// Loader
export async function loader({ request, params }: LoaderFunctionArgs) {
    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }

    // Get the cultivation
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw data("Cultivation catalogue ID is required", {
            status: 400,
            statusText: "Cultivation catalogue ID is required",
        })
    }

    // Get the cultivation details for this cultivation
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(
        (error) => {
            throw data("Failed to fetch cultivation plan", {
                status: 500,
                statusText: error.message,
            })
        },
    )

    const cultivation = cultivationPlan.find(
        (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
    )
    if (!cultivation) {
        throw data("Cultivation not found", {
            status: 404,
            statusText: "Cultivation not found",
        })
    }

    return {
        b_lu_catalogue: b_lu_catalogue,
        b_id_farm: b_id_farm,
        cultivation: cultivation,
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()
    const { pathname } = useLocation()

    // Get field names
    let fieldNames = loaderData.cultivation.fields.map((field) => field.b_name)
    if (fieldNames.length > 1) {
        fieldNames = fieldNames.join(", ")
        fieldNames = fieldNames.replace(/,(?=[^,]+$)/, ", en") //Replace last comma with and
    }

    const items = [
        {
            title: "Gewas",
            href: `/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/crop`,
        },
        {
            title: "Bemesting",
            href: `/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/fertilizers`,
        },
        {
            title: "Vanggewas",
            href: `/farm/create/${loaderData.b_id_farm}/cultivations/${loaderData.b_lu_catalogue}/covercrop`,
        },
    ]

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">
                    {loaderData.cultivation.b_lu_name}
                </h3>
                <p className="text-sm text-muted-foreground">{fieldNames}</p>
            </div>

            <Pagination>
                <PaginationContent className="">
                    {items.map((item) => (
                        <PaginationItem key={item.href}>
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
    )
}
