import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
} from "@/components/ui/pagination"
import { getSession } from "@/lib/auth.server"
import { getCalendar, getTimeframe } from "@/lib/calendar"
import { handleLoaderError } from "@/lib/error"
import { useCalendarStore } from "@/store/calendar"
import { getCultivationPlan } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    Outlet,
    data,
    useLocation,
} from "react-router"
import { useLoaderData } from "react-router"
import { fdm } from "../lib/fdm.server"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
    ]
}

/**
 * Loads cultivation details for a specific farm and catalogue.
 *
 * This function verifies that the route parameters include a valid farm ID and cultivation catalogue ID.
 * It retrieves the user session and fetches the cultivation plan for the specified farm using the session's principal ID.
 * The function then searches for the cultivation matching the provided catalogue ID and returns an object containing the farm ID,
 * the catalogue ID, and the corresponding cultivation details.
 *
 * @throws {Response} When the required farm ID or cultivation catalogue ID is missing, or if the specified cultivation is not found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
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

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        // Get the cultivation details for this cultivation
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
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
            calendar: calendar,
            cultivation: cultivation,
        }
    } catch (error) {
        throw handleLoaderError(error)
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
            href: `/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/cultivations/${loaderData.b_lu_catalogue}/crop`,
        },
        {
            title: "Bemesting",
            href: `/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/cultivations/${loaderData.b_lu_catalogue}/fertilizers`,
        },
        {
            title: "Vanggewas",
            href: `/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/cultivations/${loaderData.b_lu_catalogue}/covercrop`,
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
