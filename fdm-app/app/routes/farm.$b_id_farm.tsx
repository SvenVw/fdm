import { data, LoaderFunctionArgs, NavLink, Outlet, redirect, useLoaderData } from "react-router";
import { getFarm, getFarms } from "@svenvw/fdm-core";
import { fdm } from "../lib/fdm.server";
import { auth } from "@/lib/auth.server";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { SidebarPage } from "@/components/custom/sidebar-page";

// Blocks

export async function loader({
    request, params
}: LoaderFunctionArgs) {

    // Get the farm id
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", { status: 400, statusText: "Farm ID is required" });
    }

    // Get details of farm
    const farm = await getFarm(fdm, b_id_farm)
    if (!farm) {
        throw data("Farm is not found", { status: 404, statusText: "Farm is not found" });
    }

    // Set farm to active
    await auth.api.updateUser({
        body: {
            farm_active: b_id_farm,
        },
        headers: request.headers
    })

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            value: farm.b_id_farm,
            label: farm.b_name_farm
        }
    })

    // Create the items for sidebar page
    const sidebarPageItems = [
        {
            to: `/farm/${farm.b_id_farm}/properties`,
            title: "Gegevens"
        },
        {
            to: `/farm/${farm.b_id_farm}/access`,
            title: "Toegang"
        },
        {
            to: `/farm/${farm.b_id_farm}/delete`,
            title: "Verwijderen"
        }
    ]

    // Return user information from loader
    return {
        farm: farm,
        farmOptions: farmOptions,
        sidebarPageItems: sidebarPageItems
    }
}

export default function FarmPage() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb>
                    <BreadcrumbList>
                        <BreadcrumbItem className="hidden md:block">
                            <BreadcrumbLink href="/">
                                Bedrijf
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger className="flex items-center gap-1">
                                    {loaderData.farm.b_name_farm}
                                    <ChevronDown />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {loaderData.farmOptions.map((option) => (
                                        <DropdownMenuCheckboxItem
                                            checked={loaderData.farm.b_id_farm === option.value}
                                            key={option.value}
                                        >
                                            <NavLink
                                                key={option.value}
                                                to={`/farm/${option.value}`}>

                                                {option.label}
                                            </NavLink>
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main>
                <div className="space-y-6 p-10 pb-16">
                    <div className="flex items-center">
                        <div className="space-y-0.5">
                            <h2 className="text-2xl font-bold tracking-tight">Bedrijf</h2>
                            <p className="text-muted-foreground">
                                Beheer de gegevens en instellingen van dit bedrijf
                            </p>
                        </div>
                    </div>
                    <Separator className="my-6" />
                    <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                        <aside className="-mx-4 lg:w-1/5">
                            <SidebarPage items={loaderData.sidebarPageItems} />
                        </aside>
                        <div className="flex-1 lg:max-w-2xl"><Outlet /></div>
                    </div>
                </div>
            </main>
        </SidebarInset >
    )
} { }