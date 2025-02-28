import {
    type LoaderFunctionArgs,
    Outlet,
    data,
    redirect,
    useLoaderData,
} from "react-router"

import { FarmContent } from "@/components/custom/farm/farm-content"
import { FarmHeader } from "@/components/custom/farm/farm-header"
import { FarmTitle } from "@/components/custom/farm/farm-title"
import { SidebarInset } from "@/components/ui/sidebar"
import { getSession } from "@/lib/auth.server"
import { fdm } from "@/lib/fdm.server"
import { getFarms, getField, getFields } from "@svenvw/fdm-core"

export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the farm id
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Get the field id
        const b_id = params.b_id
        if (!b_id) {
            throw data("Field ID is required", {
                status: 400,
                statusText: "Field ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)

        // Redirect to farms overview if user has no farm
        if (farms.length === 0) {
            return redirect("farm")
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
        const fields = await getFields(fdm, session.principal_id, b_id_farm)
        const fieldOptions = fields.map((field) => {
            if (!field?.b_id || !field?.b_name) {
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
        const field = await getField(fdm, session.principal_id, b_id)
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
                to: `/farm/${b_id_farm}/field/${b_id}/cultivation`,
                title: "Gewas",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/fertilizer`,
                title: "Bemesting",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/soil`,
                title: "Bodem",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/norm`,
                title: "Gebruiksnormen",
            },
            {
                to: `/farm/${b_id_farm}/field/${b_id}/atlas`,
                title: "Kaart",
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
        throw data("An unexpected error occurred.", {
            status: 500,
            statusText: "Internal Server Error",
        })
    }
}

export default function FarmFieldIndex() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <>
            <SidebarInset>
                <FarmHeader
                    farmOptions={loaderData.farmOptions}
                    b_id_farm={loaderData.b_id_farm}
                    fieldOptions={loaderData.fieldOptions}
                    b_id={loaderData.b_id}
                    action={{
                        to: `/farm/${loaderData.b_id_farm}/field/`,
                        label: "Terug naar percelen",
                    }}
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
                    </>
                </main>
            </SidebarInset>
        </>
    )
}
