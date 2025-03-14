import { SidebarPage } from "@/components/custom/sidebar-page"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { getSession } from "@/lib/auth.server"
import { handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { cn } from "@/lib/utils"
import { getCultivationPlan, getFarm } from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    data,
} from "react-router"
import { Outlet, useLoaderData } from "react-router"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: "FDM App" },
        { name: "description", content: "Welcome to FDM!" },
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
        const timeframe = useCalendarStore.getState().getTimeframe()

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
                to: `/farm/create/${b_id_farm}/cultivations/${cultivation.b_lu_catalogue}`,
            }
        })

        return {
            cultivationPlan: cultivationPlan,
            sidebarPageItems: sidebarPageItems,
            b_id_farm: b_id_farm,
            b_name_farm: farm.b_name_farm,
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
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink>Maak een bedrijf</BreadcrumbLink>
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
                                Vul gewasinformatie in
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
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
                                to={`/farm/${loaderData.b_id_farm}/field`}
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
                                    Voltooien
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
