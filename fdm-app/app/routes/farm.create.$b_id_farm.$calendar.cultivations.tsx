import { getCultivationPlan, getFarm } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    data,
} from "react-router"
import { Outlet, useLoaderData } from "react-router"
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
import { Header } from "~/components/custom/header/base"
import { HeaderFarmCreate } from "~/components/custom/header/create-farm"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bouwplan - Bedrijf toevoegen | ${clientConfig.name}` },
        {
            name: "description",
            content: "Beheer de gewassen op je percelen.",
        },
    ]
}

/**
 * Loads data required for the farm cultivations page.
 *
 * This loader verifies that a farm ID is provided in the URL parameters and uses the current user session to fetch
 * the corresponding farm details. It then retrieves the cultivation plan for the farm and constructs sidebar navigation
 * items based on the available cultivations.
 *
 * @returns An object containing:
 * - cultivationPlan: An array of cultivation entries.
 * - sidebarPageItems: An array of navigation items for the sidebar.
 * - b_id_farm: The farm identifier.
 * - b_name_farm: The name of the farm.
 *
 * @throws {Response} 400 if the farm ID is missing.
 * @throws {Response} 404 if the farm is not found.
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

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const calendar = getCalendar(params)
        const timeframe = getTimeframe(params)

        const farm = await getFarm(fdm, session.principal_id, b_id_farm).catch(
            (error) => {
                throw data(`Failed to fetch farm: ${error.message}`, {
                    status: 404,
                    statusText: "Farm not found",
                })
            },
        )

        if (!farm) {
            throw data("Farm not found", {
                status: 404,
                statusText: "Farm not found",
            })
        }

        // Get the cultivationPlan
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        // Create the sidenav
        const sidebarPageItems = cultivationPlan.map((cultivation) => {
            return {
                title: cultivation.b_lu_name,
                to: `/farm/create/${b_id_farm}/${calendar}/cultivations/${cultivation.b_lu_catalogue}`,
            }
        })

        return {
            cultivationPlan: cultivationPlan,
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
            <Header action={undefined}>
                <HeaderFarmCreate b_name_farm={loaderData.b_name_farm} />
            </Header>
            <main>
                <div className="space-y-6 p-10 pb-16">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">
                                Bouwplan
                            </h2>
                            <p className="text-muted-foreground">
                                Werk de eigenschappen per gewas in je bouwplan
                                bij.
                            </p>
                        </div>

                        <div className="ml-auto">
                            <NavLink
                                to={`/farm/create/${loaderData.b_id_farm}/${loaderData.calendar}/access`}
                                className={cn("ml-auto", {
                                    "pointer-events-none":
                                        loaderData.cultivationPlan.length === 0,
                                })}
                            >
                                <Button
                                    disabled={
                                        loaderData.cultivationPlan.length === 0
                                    }
                                >
                                    Volgende
                                </Button>
                            </NavLink>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        {loaderData.sidebarPageItems && (
                            <aside className="-mx-4 lg:w-1/5">
                                <SidebarPage
                                    items={loaderData.sidebarPageItems}
                                />
                            </aside>
                        )}
                        <div className="flex-2">
                            {" "}
                            <Outlet />
                        </div>
                    </div>
                </div>
            </main>
        </SidebarInset>
    )
}
