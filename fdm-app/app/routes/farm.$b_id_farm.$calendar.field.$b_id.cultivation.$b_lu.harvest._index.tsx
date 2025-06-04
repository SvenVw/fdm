import {
    addHarvest,
    getCultivation,
    getCultivationsFromCatalogue,
    getField,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    NavLink,
    data,
    useLoaderData,
} from "react-router"
import { redirectWithSuccess } from "remix-toast"
import { HarvestForm } from "~/components/custom/harvest/form"
import { FormSchema } from "~/components/custom/harvest/schema"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { getCalendar } from "../lib/calendar"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Oogsten - Gewas - Perceel | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de oogsten van je gewas.",
        },
    ]
}

/**
 * Loads the necessary data for the harvest page.
 *
 * This function extracts the farm, field, and cultivation IDs from the URL parameters and validates their presence.
 * Using the current user session, it retrieves:
 * - The details of the specified field.
 * - A list of cultivations formatted as combobox options.
 * - The selected cultivation information.
 *
 * Throws an error with a 400 status if any required identifier is missing, or a 404 status if the field is not found.
 *
 * @returns An object containing the field details, the available cultivation options, and the selected cultivation.
 *
 * @throws {Error} If a required parameter is missing or if the field does not exist.
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

        // Get selected cultivation
        const cultivation = await getCultivation(
            fdm,
            session.principal_id,
            b_lu,
        )

        // Return user information from loader
        return {
            field: field,
            cultivationsCatalogueOptions: cultivationsCatalogueOptions,
            cultivation: cultivation,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders a UI block that displays the current cultivation's overview and a harvest entry form.
 *
 * This component retrieves data using the loader context to display the selected cultivation's name
 * and a prompt for entering harvest data. It also includes a navigation button to return to the
 * cultivation overview and renders the HarvestForm component for submitting harvest details.
 */
export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

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
                <HarvestForm
                    b_lu_yield={undefined}
                    b_lu_n_harvestable={undefined}
                    b_lu_harvest_date={undefined}
                />
            </div>
        </div>
    )
}

/**
 * Handles POST requests to record harvest data for a specific cultivation.
 *
 * This action function validates that the required route parameters (farm ID, field ID, and cultivation ID)
 * are provided. It retrieves the current user session, extracts form data using a defined schema, and records
 * the new harvest entry tied to the user's session. On successful submission, it redirects to the cultivation's
 * page with a success message.
 *
 * @throws {Error} If any required identifier (farm ID, field ID, or cultivation ID) is missing.
 * @throws {Error} If an error occurs during form processing, the error is wrapped with a custom handler and re-thrown.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        // Get the farm ID
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }

        // Get the field ID
        const b_id = params.b_id
        if (!b_id) {
            throw new Error("missing: b_id")
        }

        // Get cultivation id
        const b_lu = params.b_lu
        if (!b_lu) {
            throw new Error("missing: b_lu")
        }

        // Get the session
        const session = await getSession(request)
        const calendar = await getCalendar(params)

        if (request.method === "POST") {
            // Collect form entry
            const formValues = await extractFormValuesFromRequest(
                request,
                FormSchema,
            )
            const { b_lu_yield, b_lu_n_harvestable, b_lu_harvest_date } =
                formValues

            await addHarvest(
                fdm,
                session.principal_id,
                b_lu,
                b_lu_harvest_date,
                b_lu_yield,
                b_lu_n_harvestable,
            )

            return redirectWithSuccess(
                `/farm/${b_id_farm}/${calendar}/field/${b_id}/cultivation/${b_lu}`,
                {
                    message: "Oogst is toegevoegd! 🎉",
                },
            )
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
