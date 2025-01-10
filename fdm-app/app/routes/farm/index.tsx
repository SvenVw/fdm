import { LoaderFunctionArgs, NavLink, redirect, useLoaderData } from "react-router";
import { getFarms } from "@svenvw/fdm-core";
import { fdm } from "@/lib/fdm.server";
import { auth } from "@/lib/auth.server";

// Components

// Blocks
import MissingFarm from "@/components/blocks/missing-farm";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

export async function loader({
    request,
}: LoaderFunctionArgs) {

    // Get the session
    const session = await auth.api.getSession({
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

    // Sort farms per name
    farmOptions.sort((a, b) => a.label.localeCompare(b.label))

    // Return user information from loader
    return {
        farmOptions: farmOptions
    }
}

export default function FarmBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
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
                            {loaderData.farmOptions.length > 0 ? (
                                <BreadcrumbItem>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger className="flex items-center gap-1">
                                            Kies een bedrijf
                                            <ChevronDown />
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            {loaderData.farmOptions.map((option) => (
                                                <DropdownMenuCheckboxItem
                                                    checked={false}
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
                            ) : (
                                <></>
                            )
                            }
                        </BreadcrumbList>
                    </Breadcrumb>
                </header>
                <main>
                    {
                        loaderData.farmOptions.length === 0 ? (
                            <MissingFarm />
                        ) : (
                            <div className="flex h-screen items-center justify-center">
                                <Card className="w-[350px]">

                                    <CardHeader>
                                        <CardTitle>Bedrijven</CardTitle>
                                        <CardDescription>Kies een bedrijf om verder te gaan</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid w-full items-center gap-4">
                                            <div className="flex flex-col space-y-4">
                                                {loaderData.farmOptions.map((option) => (
                                                    <div className="grid grid-cols-3 gap-x-3 items-center" key={option.value}>
                                                        <div className="col-span-2">
                                                            <p className="text-sm font-medium leading-none">
                                                                {option.label}
                                                            </p>
                                                            {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                                        </div>

                                                        <div className="">
                                                            <NavLink to={`/farm/${option.value}`}>
                                                                <Button>
                                                                    Selecteer
                                                                </Button>
                                                            </NavLink>
                                                        </div>

                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                    </CardContent>

                                    <CardFooter className="flex flex-col items-center space-y-2">
                                        <Separator />
                                        <p className="text-muted-foreground text-sm">
                                            Of maak een nieuw bedrijf aan:
                                        </p>
                                        <NavLink to="/farm/create">
                                            <Button className="w-full">
                                                Nieuw bedrijf
                                            </Button>
                                        </NavLink>

                                    </CardFooter>

                                </Card>
                            </div>
                        )
                    }
                </main>
            </SidebarInset >

        </>
    )
} 