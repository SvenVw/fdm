
// Components
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList } from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

// Blocks
import MissingFarm from "@/components/blocks/missing-farm";
import { LoaderFunctionArgs, redirect, useLoaderData } from "react-router";
import { auth } from "@/lib/auth.server";

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
    const b_id_farms: string[] = []

    // Return user information from loader
    return {
        b_id_farms: b_id_farms
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
                                Start
                            </BreadcrumbLink>
                        </BreadcrumbItem>
                    </BreadcrumbList>
                </Breadcrumb>
            </header>
            <main>

                {loaderData.b_id_farms.length === 0 ? (
                    <MissingFarm />
                ) : (
                    // Render something else if b_id_farms is not empty
                    <div>Je hebt een bedrijf!</div>
                )}
            </main>
        </SidebarInset>

    )
} { }