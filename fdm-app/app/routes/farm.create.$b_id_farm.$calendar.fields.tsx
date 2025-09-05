import { getFarm, getFields } from "@svenvw/fdm-core"
import { ArrowLeft } from "lucide-react"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    Outlet,
    useLoaderData,
} from "react-router"
import { SidebarPage } from "~/components/custom/sidebar-page"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { cn } from "~/lib/utils"
import type { Route } from "../+types/root"
import { InlineErrorBoundary } from "~/components/custom/inline-error-boundary"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Percelen beheren - Bedrijf toevoegen | ${clientConfig.name}`,
        },
        {
            name: "description",
            content:
                "Beheer de percelen van je bedrijf. Pas namen aan en bekijk perceelsinformatie.",
        },
    ]
}

/**
 * Loads and prepares all data required for the farm creation page.
 *
 * This loader retrieves the details of a farm and its associated fields using the provided farm ID from the URL parameters.
 * It also fetches available cultivation options from the catalogue and the Mapbox access token from the environment.
 * The fields are sorted alphabetically by name and converted into sidebar navigation items for use in the UI.
 *
 * @returns An object containing:
 * - sidebarPageItems: Navigation items for each field.
 * - cultivationOptions: A list of available cultivation options.
 * - mapboxToken: The Mapbox access token.
 * - b_id_farm: The farm ID.
 * - b_name_farm: The name of the farm.
 * - action: The URL for field update submissions.
 *
 * @throws {Response} If the farm ID is missing or if the Mapbox token is not set.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the Id and name of the farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        const farm = await getFarm(fdm, session.principal_id, b_id_farm)

        // Get the fields
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        // Sort by name
        fields.sort((a, b) => a.b_name.localeCompare(b.b_name))

        // Create the sidenav
        const sidebarPageItems = fields.map((field) => {
            return {
                title: field.b_name,
                to: `/farm/create/${b_id_farm}/${calendar}/fields/${field.b_id}`,
            }
        })

        return {
            sidebarPageItems: sidebarPageItems,
            b_id_farm: b_id_farm,
            b_name_farm: farm.b_name_farm,
            calendar: calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <main>
                <div className="space-y-6 p-10 pb-16">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Percelen
                            </h2>
                            <p className="text-muted-foreground">
                                Pas de naam aan, controleer het gewas en
                                bodemgegevens
                            </p>
                        </div>

                        <div className="ml-auto">
                            <NavLink
                                to={`/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/cultivations`}
                                className={cn("ml-auto", {
                                    "pointer-events-none":
                                        loaderData.sidebarPageItems.length ===
                                        0,
                                })}
                            >
                                <Button
                                    disabled={
                                        loaderData.sidebarPageItems.length === 0
                                    }
                                >
                                    Doorgaan
                                </Button>
                            </NavLink>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-6 pb-0">
                        <div className="flex flex-col space-y-0 lg:flex-row lg:space-x-4 lg:space-y-0">
                            <aside className="lg:w-1/5">
                                <SidebarPage
                                    items={loaderData.sidebarPageItems}
                                >
                                    <Button variant={"link"} asChild>
                                        <NavLink
                                            to={`/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/atlas`}
                                        >
                                            <ArrowLeft />
                                            Terug naar kaart
                                        </NavLink>
                                    </Button>
                                </SidebarPage>
                            </aside>
                            <div className="flex-1">
                                <Outlet />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </SidebarInset>
    )
}

export function ErrorBoundary(props: Route.ErrorBoundaryProps) {
    return (
        <SidebarInset>
            <main>
                <div className="space-y-6 p-10 pb-0">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Percelen
                            </h2>
                            <p className="text-muted-foreground">
                                Pas de naam aan, controleer het gewas en
                                bodemgegevens
                            </p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                </div>
                <InlineErrorBoundary {...props} />
            </main>
        </SidebarInset>
    )
}
