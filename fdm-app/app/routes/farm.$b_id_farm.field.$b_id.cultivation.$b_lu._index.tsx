import { CultivationForm } from "@/components/custom/cultivation/form"
import { FormSchema } from "@/components/custom/cultivation/schema"
import { HarvestsList } from "@/components/custom/harvest/list"
import type { HarvestableType } from "@/components/custom/harvest/types"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth.server"
import { handleActionError, handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import { useCalendarStore } from "@/store/calendar"
import {
    getCultivation,
    getCultivationsFromCatalogue,
    getField,
    getHarvests,
    removeHarvest,
    updateCultivation,
} from "@svenvw/fdm-core"
import { timestamp } from "drizzle-orm/mysql-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    NavLink,
    data,
    useFetcher,
    useLoaderData,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"

/**
 * Loads and prepares data for the farm fields overview page.
 *
 * This loader function validates the presence of required farm, field, and cultivation IDs from the request parameters.
 * It retrieves the user session and fetches details of the specified field and cultivation, along with available
 * cultivation options and associated harvest records. It also determines the harvestable type based on the cultivation
 * catalogue.
 *
 * @returns An object containing:
 *   - field: The details of the specified field.
 *   - cultivationsCatalogueOptions: Mapped options for cultivation selection.
 *   - cultivation: The data of the specified cultivation.
 *   - harvests: The list of harvests related to the cultivation.
 *   - b_lu_harvestable: The harvestable type from the catalogue, or "none" if not applicable.
 *   - b_id_farm: The farm ID.
 *
 * @throws {Response} If the farm, field, or cultivation ID is missing (status 400) or if the field or cultivation cannot be found (status 404).
 */
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

        // Get the cultivation id
        const b_lu = params.b_lu
        if (!b_lu) {
            throw data("Cultivation ID is required", {
                status: 400,
                statusText: "Cultivation ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = useCalendarStore.getState().getTimeframe()

        // Get details of field
        const field = await getField(fdm, session.principal_id, b_id)
        if (!field) {
            throw data("Field is not found", {
                status: 404,
                statusText: "Field is not found",
            })
        }

        // Get available cultivations for the farm
        const cultivationsCatalogue = await getCultivationsFromCatalogue(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        // Map cultivations to options for the combobox
        const cultivationsCatalogueOptions = cultivationsCatalogue.map(
            (cultivation) => {
                return {
                    value: cultivation.b_lu_catalogue,
                    label: cultivation.b_lu_name,
                }
            },
        )

        // Get cultivation
        const cultivation = await getCultivation(
            fdm,
            session.principal_id,
            b_lu,
        )
        if (!cultivation) {
            throw data("Cultivation is not found", { status: 404 })
        }

        // Get harvests
        const harvests = await getHarvests(
            fdm,
            session.principal_id,
            b_lu,
            timeframe,
        )

        let b_lu_harvestable: HarvestableType = "none"
        const cultivationCatalogueItem = cultivationsCatalogue.find((item) => {
            return item.b_lu_catalogue === cultivation.b_lu_catalogue
        })
        if (cultivationCatalogueItem) {
            b_lu_harvestable = cultivationCatalogueItem.b_lu_harvestable
        }

        // Return user information from loader
        return {
            field: field,
            cultivationsCatalogueOptions: cultivationsCatalogueOptions,
            cultivation: cultivation,
            harvests: harvests,
            b_lu_harvestable: b_lu_harvestable,
            b_id_farm: b_id_farm,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the overview block for a farm field cultivation.
 *
 * This component displays the cultivation's name along with a prompt to enter harvest data, provides a navigation button to return to the cultivation list, and incorporates a form for updating cultivation details. It also shows a list of harvest entries along with their current status, sourcing its data from the loader via React Router hooks.
 */
export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const fetcher = useFetcher()

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <h3 className="text-lg font-medium">
                        {loaderData.cultivation.b_lu_name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Vul de oogsten in voor dit gewas.
                    </p>
                </div>
                <div className="flex justify-end">
                    <NavLink to={"../cultivation"} className={"ml-auto"}>
                        <Button>{"Terug"}</Button>
                    </NavLink>
                </div>
            </div>
            <Separator />
            <div className="space-y-6">
                <CultivationForm
                    b_lu_catalogue={loaderData.cultivation.b_lu_catalogue}
                    b_lu_start={loaderData.cultivation.b_lu_start}
                    b_lu_end={loaderData.cultivation.b_lu_end}
                    options={loaderData.cultivationsCatalogueOptions}
                    action={`/farm/${loaderData.b_id_farm}/field/${loaderData.cultivation.b_id}/cultivation/${loaderData.cultivation.b_lu}`}
                />
                <Separator />
                <HarvestsList
                    harvests={loaderData.harvests}
                    b_lu_harvestable={loaderData.b_lu_harvestable}
                    state={fetcher.state}
                />
            </div>
        </div>
    )
}

/**
 * Processes form submissions to update cultivation data or delete a harvest.
 *
 * For POST requests, it extracts cultivation details from the submitted form and updates the corresponding record.
 * For DELETE requests, it removes a harvest identified by a provided ID.
 * The function validates the presence of required URL parameters and uses the authenticated user's session
 * to ensure authorized operations. It returns a response object indicating the outcome of the action.
 *
 * @returns A response object with either success data and a message or an error message if validations fail.
 * @throws {Error} When an unexpected error occurs during processing, after being handled by {@link handleActionError}.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        // Get the field ID
        const b_id = params.b_id
        if (!b_id) {
            return dataWithError(null, "Missing field ID.")
        }

        // Get the cultivation ID
        const b_lu = params.b_lu
        if (!b_lu) {
            return dataWithError(null, "Missing b_lu value.")
        }

        // Get the session
        const session = await getSession(request)

        if (request.method === "POST") {
            // Collect form entry
            const formValues = await extractFormValuesFromRequest(
                request,
                FormSchema,
            )
            const { b_lu_catalogue, b_lu_start, b_lu_end } = formValues

            await updateCultivation(
                fdm,
                session.principal_id,
                b_lu,
                b_lu_catalogue,
                b_lu_start,
                b_lu_end,
            )

            return dataWithSuccess(
                { result: "Data saved successfully" },
                { message: "Oogst is toegevoegd! 🎉" },
            )
        }

        if (request.method === "DELETE") {
            const formData = await request.formData()
            const b_id_harvesting = formData.get("b_id_harvesting")

            if (!b_id_harvesting || typeof b_id_harvesting !== "string") {
                return dataWithError(
                    "Invalid or missing b_id_harvesting value",
                    "Oops! Something went wrong. Please try again later.",
                )
            }

            await removeHarvest(fdm, session.principal_id, b_id_harvesting)

            return dataWithSuccess("Harvest deleted successfully", {
                message: "Oogst is verwijderd",
            })
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
