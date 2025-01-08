import { data, LoaderFunctionArgs, NavLink, Outlet, redirect, useLoaderData } from "react-router";
import { getFarm, getFarms } from "@svenvw/fdm-core";
import { fdm } from "../lib/fdm.server";
import { auth } from "@/lib/auth.server";
import { authClient } from "@/lib/auth-client";

// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

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
    if (! farm) {
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

    // Return user information from loader
    return {
        farm: farm,
        farmOptions: farmOptions
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
                <p>{loaderData.farm.b_name_farm}</p>
            </main>
        </SidebarInset >
    )
} { }