import {
    type CultivationCatalogue,
    getCultivations,
    getCultivationsFromCatalogue,
    getCurrentSoilData,
    getFarms,
    getFertilizerApplications,
    getFertilizers,
    getFields,
    getHarvests,
} from "@svenvw/fdm-core"
import {
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    redirect,
    useLoaderData,
} from "react-router"
import { FarmContent } from "~/components/blocks/farm/farm-content"
import { FarmTitle } from "~/components/blocks/farm/farm-title"
import {
    columns,
    type RotationExtended,
} from "~/components/blocks/rotation/columns"
import { DataTable } from "~/components/blocks/rotation/table"
import { Header } from "~/components/blocks/header/base"
import { HeaderFarm } from "~/components/blocks/header/farm"
import { BreadcrumbItem, BreadcrumbSeparator } from "~/components/ui/breadcrumb"
import { Button } from "~/components/ui/button"
import { SidebarInset } from "~/components/ui/sidebar"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"

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
            throw new Response("Not Found", {
                status: 404,
                statusText: "Not Found",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get calendar and timeframe from calendar store
        const calendar = getCalendar(params)
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

        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        const cultivationCatalogue = await getCultivationsFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
        )

        function getHarvestabilityFromCatalogue(b_lu_catalogue: string) {
            return cultivationCatalogue.find(
                (item: { b_lu_catalogue: string }) => item.b_lu_catalogue === b_lu_catalogue,
            )?.b_lu_harvestable ?? "once"
        }

        const fieldsExtended = await Promise.all(
            fields.map(async (field) => {
                const cultivations = await getCultivations(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )

                const harvests = await Promise.all(
                    cultivations.flatMap(async (cultivation) => {
                        const b_lu_harvestable = getHarvestabilityFromCatalogue(cultivation.b_lu_catalogue)

                        const harvests = await getHarvests(
                            fdm,
                            session.principal_id,
                            cultivation.b_lu,
                            b_lu_harvestable === "once" ? undefined : timeframe,
                        )

                        return {
                            b_lu: cultivation.b_lu,
                            b_lu_harvest_date: harvests.map(
                                (harvest) => harvest.b_lu_harvest_date,
                            ),
                        }
                    }),
                )

                const fertilizerApplications = await getFertilizerApplications(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )

                const fertilizerApplicationIds = new Set(
                    fertilizerApplications.map((app) => app.p_id),
                )

                const fertilizersFiltered = fertilizers.filter((fertilizer) =>
                    fertilizerApplicationIds.has(fertilizer.p_id),
                )

                const currentSoilData = await getCurrentSoilData(
                    fdm,
                    session.principal_id,
                    field.b_id,
                    timeframe,
                )
                const a_som_loi =
                    currentSoilData.find(
                        (item: { parameter: string }) => item.parameter === "a_som_loi",
                    )?.value ?? null
                const b_soiltype_agr =
                    currentSoilData.find(
                        (item: { parameter: string }) => item.parameter === "b_soiltype_agr",
                    )?.value ?? null

                return {
                    b_id: field.b_id,
                    b_name: field.b_name,
                    cultivations: cultivations,
                    harvests: harvests,
                    fertilizerApplications: fertilizerApplications,
                    fertilizers: fertilizersFiltered,
                    a_som_loi: a_som_loi,
                    b_soiltype_agr: b_soiltype_agr,
                    b_area: Math.round(field.b_area * 10) / 10,
                    b_isproductive: field.b_isproductive ?? true,
                }
            }),
        )

        const transformFieldsToRotationExtended = (
            fieldsExtended: any[], // TODO: Define a proper type for fieldsExtended
            cultivationCatalogue: CultivationCatalogue,
        ): RotationExtended[] => {
            const cultivationsInRotation: string[] = [
                ...new Set(
                    fieldsExtended.flatMap((field: { cultivations: { b_lu_catalogue: string }[] }) => {
                        return field.cultivations.flatMap((cultivation) => {
                            return cultivation.b_lu_catalogue
                        })
                    }),
                ),
            ]

            return cultivationsInRotation.map((b_lu_catalogue) => {
                const cultivationsForCatalogue = fieldsExtended.flatMap(
                    (field) =>
                        field.cultivations.filter(
                            (cultivation: { b_lu_catalogue: string }) =>
                                cultivation.b_lu_catalogue === b_lu_catalogue,
                        ),
                )

                const fieldsWithThisCultivation = fieldsExtended.filter(
                    (field) =>
                        field.cultivations.some(
                            (cultivation: { b_lu_catalogue: string }) =>
                                cultivation.b_lu_catalogue === b_lu_catalogue,
                        ),
                )

                // Get all unique b_lu_start of cultivation
                const b_lu_start = [
                    ...new Set(
                        cultivationsForCatalogue.map((cultivation: { b_lu_start: Date }) =>
                            cultivation.b_lu_start.getTime(),
                        ),
                    ),
                ].map((timestamp) => new Date(timestamp))

                const b_lu_end = [
                    ...new Set(
                        cultivationsForCatalogue
                            .filter((cultivation: { b_lu_end: Date | null }) => cultivation.b_lu_end)
                            .map((cultivation: { b_lu_end: Date }) => cultivation.b_lu_end.getTime()),
                    ),
                ].map((timestamp) => new Date(timestamp))

                const b_lu = cultivationsForCatalogue.map(
                    (cultivation: { b_lu: string }) => cultivation.b_lu,
                )

                return {
                    b_lu_catalogue: b_lu_catalogue,
                    b_lu: b_lu,
                    b_lu_name: cultivationsForCatalogue[0]?.b_lu_name ?? "",
                    b_lu_croprotation:
                        cultivationsForCatalogue[0]?.b_lu_croprotation ?? "",
                    b_lu_harvestable: getHarvestabilityFromCatalogue(b_lu_catalogue),
                    b_lu_start: b_lu_start,
                    b_lu_end: b_lu_end,
                    calendar: calendar,
                    fields: fieldsWithThisCultivation.map((field: any) => ({ // TODO: Define a proper type for field
                        b_id: field.b_id,
                        b_name: field.b_name,
                        b_area: field.b_area,
                        b_isproductive: field.b_isproductive,
                        a_som_loi: field.a_som_loi ?? 0,
                        b_soiltype_agr: field.b_soiltype_agr ?? "",
                        b_lu_harvest_date: field.harvests
                            .filter((harvest: { b_lu: string }) => b_lu.includes(harvest.b_lu))
                            .flatMap(
                                (harvest: { b_lu_harvest_date: Date[] }) => harvest.b_lu_harvest_date,
                            ),
                        fertilizerApplications:
                            field.fertilizerApplications.map((app: { p_name_nl: string; p_id: string; p_type: string }) => ({
                                p_name_nl: app.p_name_nl,
                                p_id: app.p_id,
                                p_type: app.p_type,
                            })),
                        fertilizers: field.fertilizers.map((app: { p_name_nl: string; p_id: string; p_type: string }) => ({
                            p_name_nl: app.p_name_nl,
                            p_id: app.p_id,
                            p_type: app.p_type,
                        })),
                    })),
                }
            })
        }

        const rotationExtended: RotationExtended[] = transformFieldsToRotationExtended(
            fieldsExtended,
            cultivationCatalogue,        
        )

        // Return user information from loader
        return {
            b_id_farm: b_id_farm,
            farmOptions: farmOptions,
            fieldOptions: fieldOptions,
            rotationExtended: rotationExtended, // Return filtered data
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
export default function FarmRotationIndex() {
    const loaderData = useLoaderData<typeof loader>()

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
                    Bouwplan
                </BreadcrumbItem>
            </Header>
            <main>
                {loaderData.fieldOptions.length === 0 ? (
                    <>
                        <FarmTitle
                            title={`Bouwplan van ${currentFarmName}`}
                            description="Dit bedrijf heeft nog geen bouwplan"
                        />
                        <div className="mx-auto flex h-full w-full items-center flex-col justify-center space-y-6 sm:w-[350px]">
                            <div className="flex flex-col space-y-2 text-center">
                                <h1 className="text-2xl font-semibold tracking-tight">
                                    Het lijkt erop dat je nog geen bouwplan hebt
                                    :(
                                </h1>
                            </div>
                            <div className="flex flex-col items-center relative">
                                <NavLink to="../field/new">
                                    <Button>Maak een perceel</Button>
                                </NavLink>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <FarmTitle
                                title={`Bouwplan van ${currentFarmName}`}
                                description="Bekijk het bouwplan en voeg gegevens toe."
                            />
                        </div>
                        <FarmContent>
                            <div className="flex flex-col space-y-8 pb-10 lg:flex-row lg:space-x-12 lg:space-y-0">
                                <DataTable
                                    columns={columns}
                                    data={loaderData.rotationExtended}
                                />
                            </div>
                        </FarmContent>
                    </>
                )}
            </main>
        </SidebarInset>
    )
}
