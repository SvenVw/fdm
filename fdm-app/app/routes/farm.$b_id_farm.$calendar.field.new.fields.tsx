import { getFarm, getFarms, getField } from "@svenvw/fdm-core"
import { ArrowLeft } from "lucide-react"
import { useMemo } from "react"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    Outlet,
    useLoaderData,
    useLocation,
} from "react-router"
import { Header } from "~/components/blocks/header/base"
import { FieldFilterToggle } from "~/components/custom/field-filter-toggle"
import { SidebarPage } from "~/components/custom/sidebar-page"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Separator } from "~/components/ui/separator"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { useFieldFilterStore } from "~/store/field-filter"
import { HeaderFarm } from "../components/blocks/header/farm"
import { HeaderField } from "../components/blocks/header/field"

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
 * Loads farm details, available fields, and map configuration for the field selection page.
 *
 * This loader function retrieves the farm ID from the route parameters and validates its presence. It then
 * fetches the farm details using the current session. Additionally, it loads the list of available fields
 * for the specified calendar year (or the current year if not provided) from an external source.
 * It also fetches available cultivation options from the catalogue.
 *
 * @param {LoaderFunctionArgs} args - The arguments for the loader function, including the request and parameters.
 * @returns {Promise<object>} An object containing farm details, the list of available fields, cultivation options, and other related data.
 * @throws {Response} If the farm ID is missing.
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

        const calendar = getCalendar(params)
        const url = new URL(request.url)

        // Obtain the fieldIds
        // Redirect to one of them if not viewing a field currently.
        const b_id = params.b_id
        let fieldIds: string[] = b_id ? [b_id] : []
        const fieldIdsParam = url.searchParams.get("fieldIds")
        if (fieldIdsParam) fieldIds = fieldIdsParam.split(",")

        // Get the session
        const session = await getSession(request)

        const farm = await getFarm(fdm, session.principal_id, b_id_farm)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)
        const farmOptions = farms.map((farm) => {
            if (!farm?.b_id_farm || !farm?.b_name_farm) {
                throw new Error("Invalid farm data structure")
            }
            return {
                b_id_farm: farm.b_id_farm,
                b_name_farm: farm.b_name_farm,
            }
        })

        // Get the fields
        const fields = await Promise.all(
            fieldIds.map((b_id) => getField(fdm, session.principal_id, b_id)),
        )

        return {
            fields: fields,
            b_id_farm: b_id_farm,
            b_name_farm: farm.b_name_farm,
            farmOptions: farmOptions,
            calendar: calendar,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

// Main
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()
    const { fields, b_id_farm, calendar } = loaderData
    const { showProductiveOnly } = useFieldFilterStore()
    const location = useLocation()

    // Create the sidenav
    const sidebarPageItems = useMemo(
        () =>
            fields
                .filter((field) =>
                    showProductiveOnly ? field.b_isproductive : true,
                )
                .slice()
                .sort((a, b) => b.b_area - a.b_area) // Sort by area in descending order
                .map((field) => ({
                    title: field.b_name,
                    to: `/farm/${b_id_farm}/${calendar}/field/new/fields/${field.b_id}${location.search}`,
                })),
        [fields, showProductiveOnly, b_id_farm, calendar, location.search],
    )

    return (
        <SidebarInset>
            <Header
                action={{
                    to: `/farm/${loaderData.b_id_farm}/${calendar}/field/`,
                    label: "Terug naar percelen",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />
                <HeaderField
                    b_id_farm={loaderData.b_id_farm}
                    fieldOptions={[]}
                    b_id={undefined}
                />
            </Header>
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
                    </div>
                    <Separator className="my-6" />
                    <div className="space-y-6 pb-0">
                        <div className="flex flex-col space-y-0 lg:flex-row lg:space-x-4 lg:space-y-0">
                            <aside className="lg:w-1/5 gap-0">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <p>Percelen</p>
                                            <FieldFilterToggle />
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <SidebarPage items={sidebarPageItems} />
                                    </CardContent>
                                    <CardFooter className="flex flex-col items-center space-y-2 relative">
                                        {/* <Separator /> */}
                                        <Button variant={"link"} asChild>
                                            <NavLink
                                                to={`/farm/create/${b_id_farm}/${calendar}/atlas`}
                                            >
                                                <ArrowLeft />
                                                Terug naar kaart
                                            </NavLink>
                                        </Button>
                                    </CardFooter>
                                </Card>
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
