import {
    getCultivations,
    getCurrentSoilData,
    getFarms,
    getFertilizerApplications,
    getFields,
} from "@svenvw/fdm-core"
import {
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    redirect,
    useLoaderData,
} from "react-router"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { Button } from "~/components/ui/button"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { DataTable } from "~/components/blocks/fields/table"
import { columns } from "~/components/blocks/fields/columns"
import { FarmContent } from "~/components/blocks/farm/farm-content"
import { BreadcrumbItem, BreadcrumbSeparator } from "~/components/ui/breadcrumb"
import { useFieldFilterStore } from "~/store/field-filter"
import { FieldFilterToggle } from "~/components/custom/field-filter-toggle"

export const meta: MetaFunction = () => {
    return [
        { title: `Perceel | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Beheer al uw percelen op één plek. Bekijk een overzicht van alle percelen binnen uw bedrijf met hun belangrijkste kenmerken.",
        },
    ]
}

/**
 * Retrieves and processes farm and field options for the specified farm ID based on the current user session.
 *
 * This loader function extracts the active farm ID from the route parameters and uses the user's session to:
 * - Fetch all farms associated with the user, redirecting to the farms overview if none exist.
 * - Validate and map the farms into selectable options.
 * - Retrieve and validate the fields for the active farm, rounding each field's area and sorting the fields alphabetically.
 *
 * @throws {Response} When the required farm ID is missing from the route parameters.
 * @throws {Error} When a farm or field lacks the necessary data structure.
 *
 * @returns An object containing:
 * - b_id_farm: The active farm ID.
 * - farmOptions: An array of validated farm options.
 * - fieldOptions: A sorted array of processed field options.
 * - userName: The name of the current user.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Get the active farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("missing: b_id_farm", {
                status: 400,
                statusText: "missing: b_id_farm",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get a list of possible farms of the user
        const farms = await getFarms(fdm, session.principal_id)

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
        const fields = await getFields(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )
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

        const fieldsExtended = await Promise.all(
            fields.map(async (field) => {
                const cultivations = await getCultivations(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )

                const fertilizerApplications = await getFertilizerApplications(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )

                const currentSoilData = await getCurrentSoilData(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )
                const a_som_loi =
                    currentSoilData.find((x) => x.parameter === "a_som_loi")
                        ?.value ?? null
                const b_soiltype_agr =
                    currentSoilData.find(
                        (x) => x.parameter === "b_soiltype_agr",
                    )?.value ?? null

                return {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    cultivations: cultivations,
                    fertilizerApplications: fertilizerApplications,
                    a_som_loi: a_som_loi,
                    b_soiltype_agr: b_soiltype_agr,
                    b_area: Math.round(field.b_area * 10) / 10,
                    b_isproductive: field.b_isproductive,
                }
            }),
        )

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fieldOptions: fieldOptions,
            fieldsExtended: fieldsExtended,
            userName: session.userName,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders a user interface for selecting or creating a field within a farm.
 *
 * This component retrieves loader data to access the available farm options, field options, and user information.
 * Depending on whether fields exist, it either displays:
 * - A welcome screen prompting the user to create a new field if no fields are present.
 * - A list of existing fields with selection controls and a time-based greeting for navigation.
 *
 * @example
 * <FarmFieldIndex />
 */
export default function FarmFieldIndex() {
    const loaderData = useLoaderData<typeof loader>()
    const { showProductiveOnly } = useFieldFilterStore()

    const filteredFields = loaderData.fieldsExtended.filter((field) => {
        if (!showProductiveOnly) {
            return true
        }
        return field.b_isproductive === true
    })

    const currentFarmName =
        loaderData.farmOptions.find(
            (farm) => farm.b_id_farm === loaderData.b_id_farm,
        )?.b_name_farm ?? ""

    return (
        <SidebarInset>
            <Header
                action={{
                    to: `/farm/${loaderData.b_id_farm}`,
                    label: "Terug naar bedrijf",
                    disabled: false,
                }}
            >
                <HeaderFarm
                    b_id_farm={loaderData.b_id_farm}
                    farmOptions={loaderData.farmOptions}
                />

                <BreadcrumbSeparator />
                <BreadcrumbItem className="hidden md:block">
                    Percelen
                </BreadcrumbItem>
            </Header>
            <main>
                {loaderData.fieldOptions.length === 0 ? (
                    <>
                        <FarmTitle
                            title={`Percelen van ${currentFarmName}`}
                            description="Dit bedrijf heeft nog geen percelen"
                        />
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Het lijkt erop dat je nog geen perceel hebt
                                    :(
                                </h1>
                            </div>
                            <div className="flex flex-col items-center relative">
                                <NavLink to="./new">
                                    <Button>Maak een perceel</Button>
                                </NavLink>
                            </div>
                            {/* <p className="px-8 text-center text-sm text-muted-foreground">
                            </p> */}
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <FarmTitle
                                title={`Percelen van ${currentFarmName}`}
                                description="Selecteer een perceel voor details of voeg een nieuw perceel toe."
                            />
                        </div>
                        <FarmContent>
                            <div className="flex flex-col space-y-8 pb-10 lg:flex-row lg:space-x-12 lg:space-y-0">
                                <DataTable
                                    columns={columns}
                                    data={filteredFields}
                                />
                            </div>
                        </FarmContent>
                    </>
                )}
            </main>
        </SidebarInset>
    )
}
