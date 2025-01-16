import { data, type LoaderFunctionArgs, NavLink, Outlet, redirect, useLoaderData } from "react-router"

import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
} from "@/components/ui/card"
// Components
import { Separator } from "@/components/ui/separator"
import { SidebarInset } from "@/components/ui/sidebar"

// Utils
import { auth } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getTimeBasedGreeting } from "@/lib/greetings"
import { getFarms, getField, getFields } from "@svenvw/fdm-core"
import { FarmContent } from "@/components/custom/farm/farm-content"
import { Toaster } from "@/components/ui/sonner"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the session
        const session = await auth.api.getSession({
            headers: request.headers,
        })

        if (!session?.user) {
            throw new Response("Unauthorized", { status: 401 })
        }

        // Get the active farm and field
        const b_id_farm = params.b_id_farm
        const b_id = params.b_id

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm)

        // Redirect to farms overview if user has no farm
        if (farms.length === 0) {
            return redirect("./farm")
        }

        // Get farms to be selected
        const farmOptions = farms.map((farm) => {
            if (!farm?.b_id_farm || !farm?.b_name_farm) {
                throw new Error("Invalid farm data structure")
            }
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the fields to be selected
        const fields = await getFields(fdm, b_id_farm)
        const fieldOptions = fields.map((field) => {
            if (!field?.b_id || !field?.b_name || !field?.b_area) {
                throw new Error("Invalid field data structure")
            }
            return {
                b_id: field.b_id,
                b_name: field.b_name,
                b_area: Math.round(field.b_area * 10) / 10,
            }
        })

        // Sort fields by name alphabetically
        fieldOptions.sort((a, b) => a.b_name.localeCompare(b.b_name))

        // Get the generral information of the field
        const field = await getField(fdm, b_id)
        if (!field) {
            throw data("Unable to find field", {
                status: 404,
                statusText: "Unable to find field",
            })
        }

        // Create the items for sidebar page
        const sidebarPageItems = [
            {
                to: `/farm/${b_id_farm}/field/${b_id}/overview`,
                title: "Overzicht",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/cultivations`,
                title: "Gewas",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/fertilizers`,
                title: "Bemesting",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/soil`,
                title: "Bodem",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/norms`,
                title: "Gebruiksnormen",
            },
        ]

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fieldOptions: fieldOptions,
            field: field,
            b_id: b_id,
            sidebarPageItems: sidebarPageItems,
            user: session.user,
        }
    } catch (error) {
        console.error(error)
        throw data(
            error instanceof Error ? error.message : "Internal Server Error", {
            status: 500,
            statusText: "Internal Server Error",
        }
        )
    }
}

export default function FarmFieldIndex() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <SidebarInset>
            <FarmHeader
                farmOptions={loaderData.farmOptions}
                b_id_farm={loaderData.b_id_farm}
                fieldOptions={loaderData.fieldOptions}
                b_id={loaderData.b_id}
                action={{to: `/farm/${loaderData.b_id_farm}/field/`, label: "Terug naar percelen"}}
            />
            <main>
                <>
                    <FarmTitle
                        title={loaderData.field?.b_name}
                        description={
                            "Beheer hier de gegevens van dit perceel"
                        }
                    />
                    <FarmContent sidebarItems={loaderData.sidebarPageItems}>
                        <Outlet />
                    </FarmContent>
                    <Toaster />
                </>
            </main>
        </SidebarInset>
    )
}
