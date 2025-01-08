import { LoaderFunctionArgs, NavLink, redirect, useLoaderData } from "react-router";
import { getFarms } from "@svenvw/fdm-core";
import { fdm } from "../lib/fdm.server";
import { auth } from "@/lib/auth.server";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

// Blocks
import MissingFarm from "@/components/blocks/missing-farm";

export async function loader({
    request,
}: LoaderFunctionArgs) {

    // Get the session
    const session = await auth.api.getSession({
        headers: request.headers
    })

    // Get the active farm and redirect to it
    const b_id_farm = session?.user?.farm_active
    if (b_id_farm) {
        redirect(`/farm/${b_id_farm}`)
    }

    // Get a list of possible farms of the user
    const farms = await getFarms(fdm)
    const farmOptions = farms.map(farm => {
        return {
            value: farm.b_id_farm,
            label: farm.b_name_farm
        }
    })

    // Return user information from loader
    return {
        b_id_farm: b_id_farm,
        farmOptions: farmOptions
    }
}

export default function AppIndex() {
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
                                    {loaderData.b_id_farm && loaderData.farmOptions ? (
                                        loaderData.farmOptions.find(option => option.value === loaderData.b_id_farm).label
                                    ) : `Kies een bedrijf`}
                                    <ChevronDown />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    {loaderData.farmOptions.map((option) => (
                                        <DropdownMenuCheckboxItem
                                            checked={loaderData.b_id_farm === option.value}
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

                {loaderData.farmOptions.length === 0 ? (
                    <MissingFarm />
                ) : (
                    // Render something else if b_id_farms is not empty
                    <div>Je hebt een bedrijf!</div>
                )}
            </main>
        </SidebarInset >
    )
} { }