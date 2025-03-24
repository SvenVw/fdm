import { CultivationForm } from "~/components/custom/cultivation/form"
import { CultivationList } from "~/components/custom/cultivation/list"
import { FormSchema } from "~/components/custom/cultivation/schema"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { handleActionError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import {
    addCultivation,
    getCultivations,
    getCultivationsFromCatalogue,
    getField,
    getHarvests,
    removeCultivation,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    useLoaderData,
    useLocation,
} from "react-router"
import {dataWithSuccess } from "remix-toast"
import config from "@/fdm.config"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Gewas - Perceel | ${config.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de gewassen van je perceel.",
        },
    ]
}


/**
 * Loads data required for rendering the overview of a specific farm field.
 *
 * This function extracts the farm and field identifiers from the URL parameters and validates their presence.
 * It retrieves the user session to authorize data access, then fetches the field details, a catalogue of available
 * cultivations (formatted as combobox options), the list of cultivations for the field, and the corresponding harvests.
 *
 * @param args - An object containing the HTTP request and URL parameters. The route parameters must include "b_id_farm" (farm identifier) and "b_id" (field identifier).
 * @returns An object containing:
 *   - field: The details of the specified field.
 *   - cultivationsCatalogueOptions: A list of catalogue options for cultivations, formatted for use in a combobox.
 *   - cultivations: The list of cultivations associated with the field.
 *   - harvests: The harvest data for the first collection of cultivation harvests, or an empty array if none are available.
 *
 * @throws {Response} When the "b_id_farm" or "b_id" parameters are missing or if the field is not found.
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
        const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm, session.principal_id, b_id_farm)
        // Map cultivations to options for the combobox
        const cultivationsCatalogueOptions = cultivationsCatalogue.map(
            (cultivation) => {
                return {
                    value: cultivation.b_lu_catalogue,
                    label: cultivation.b_lu_name,
                }
            },
        )

        // Get cultivations for the field
        const cultivations = await getCultivations(
            fdm,
            session.principal_id,
            b_id,
        )

        // Get the harvests of the cultivations
        const harvests = await Promise.all(
            cultivations.map(async (cultivation) => {
                return await getHarvests(
                    fdm,
                    session.principal_id,
                    cultivation.b_lu,
                )
            }),
        )

        // Return user information from loader
        return {
            field: field,
            cultivationsCatalogueOptions: cultivationsCatalogueOptions,
            cultivations: cultivations,
            harvests: harvests?.[0] ?? [],
        }
    } catch (error) {
        return handleActionError(error)
    }
}

/**
 * Renders the overview block for farm fields.
 *
 * This component displays a UI section for managing cultivations in a farm field. It renders a header with a description,
 * a form for adding new cultivations (populated with catalogue options from loader data), and a list of existing cultivations
 * along with their associated harvests. The form's action is determined by the current URL.
 */
export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Gewassen</h3>
                <p className="text-sm text-muted-foreground">
                    Vul de gewassen in voor dit perceel.
                </p>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-8">
                <CultivationForm
                    b_lu_catalogue={undefined}
                    b_lu_start={undefined}
                    b_lu_end={undefined}
                    action={location.pathname}
                    options={loaderData.cultivationsCatalogueOptions}
                />
                <Separator />
                <CultivationList
                    cultivations={loaderData.cultivations}
                    harvests={loaderData.harvests}
                />
            </div>
        </div>
    )
}

/**
 * Handles form submissions to add or remove a cultivation.
 *
 * For POST requests, the function extracts cultivation data from the request,
 * and adds a new cultivation to the specified field using the current user session.
 * For DELETE requests, it removes an existing cultivation based on the cultivation ID
 * provided in the form data.
 *
 * Throws an error if the field identifier (b_id) is missing from the URL parameters,
 * or if, in a DELETE request, the cultivation identifier (b_lu) is missing or invalid.
 *
 * @returns A response object containing a success message.
 *
 * @throws {Error} When the field identifier is absent, or when the cultivation identifier is missing or invalid.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        // Get the field ID
        const b_id = params.b_id
        if (!b_id) {
            throw new Error("missing: b_id")
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

            await addCultivation(
                fdm,
                session.principal_id,
                b_lu_catalogue,
                b_id,
                b_lu_start,
                b_lu_end,
            )

            return dataWithSuccess(
                { result: "Data saved successfully" },
                { message: "Gewas is toegevoegd! 🎉" },
            )
        }
        if (request.method === "DELETE") {
            const formData = await request.formData()
            const b_lu = formData.get("b_lu")

            if (!b_lu) {
                throw new Error("missing: b_lu")
            }
            if (typeof b_lu !== "string") {
                throw new Error("invalid: b_lu")
            }

            await removeCultivation(fdm, session.principal_id, b_lu)

            return dataWithSuccess("Date deleted successfully", {
                message: "Gewas is verwijderd",
            })
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
