import { calculateDose } from "@svenvw/fdm-calculator"
import {
    addFertilizerApplication,
    getFertilizerApplications,
    getFertilizerParametersDescription,
    getFertilizers,
    getField,
    removeFertilizerApplication,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { FertilizerApplicationCard } from "~/components/blocks/fertilizer-applications/card"
import { FormSchema } from "~/components/blocks/fertilizer-applications/formschema"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

// Meta
export const meta: MetaFunction = () => {
    return [
        { title: `Bemesting - Perceel | ${clientConfig.name}` },
        {
            name: "description",
            content: "Bekijk en bewerk de bemestinggegevens van je perceel.",
        },
    ]
}

/**
 * Loads data necessary for managing fertilizer applications for a specific field.
 *
 * This function validates that both the farm and field IDs are provided in the route parameters.
 * It retrieves the user session, fetches field details (throwing an error if the field is not found),
 * obtains available fertilizers for the farm and maps them to combobox options, and retrieves existing
 * fertilizer applications for the field. It also calculates the required fertilizer dose based on the retrieved data.
 *
 * @returns An object containing the field details, fertilizer options (for a combobox), the list of fertilizer applications,
 *          and the calculated fertilizer dose.
 *
 * @throws {Error} If the farm or field ID is missing, or if the specified field does not exist.
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

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Get details of field
        const field = await getField(fdm, session.principal_id, b_id)
        if (!field) {
            throw data("Field is not found", {
                status: 404,
                statusText: "Field is not found",
            })
        }

        // Get available fertilizers for the farm
        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        const fertilizerParameterDescription =
            getFertilizerParametersDescription()
        const applicationMethods = fertilizerParameterDescription.find(
            (x) => x.parameter === "p_app_method_options",
        )
        if (!applicationMethods) throw new Error("Parameter metadata missing")
        // Map fertilizers to options for the combobox
        const fertilizerOptions = fertilizers.map((fertilizer) => {
            const applicationMethodOptions = fertilizer.p_app_method_options
                .map((opt) => {
                    const meta = applicationMethods.options.find(
                        (x) => x.value === opt,
                    )
                    return meta ? { value: opt, label: meta.label } : undefined
                })
                .filter(Boolean)
            return {
                value: fertilizer.p_id,
                label: fertilizer.p_name_nl,
                applicationMethodOptions: applicationMethodOptions,
            }
        })

        // Get fertilizer applications for the field
        const fertilizerApplications = await getFertilizerApplications(
            fdm,
            session.principal_id,
            b_id,
            timeframe,
        )

        const dose = calculateDose({
            applications: fertilizerApplications,
            fertilizers,
        })

        // Return user information from loader
        return {
            field: field,
            fertilizerOptions: fertilizerOptions,
            fertilizerApplications: fertilizerApplications,
            dose: dose.dose,
            applicationMethodOptions: applicationMethods.options,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the overview for managing fertilizer applications on a field.
 *
 * This component displays a header and descriptive text followed by a grid layout.
 * The grid contains a form for submitting new fertilizer applications along with a list
 * of existing applications, and a section showcasing the calculated fertilizer dose in cards.
 * Data required for rendering is obtained via the loader, and the component leverages
 * React Router hooks for location tracking and data fetching.
 */
export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    return (
        <div className="space-y-6">
            <FertilizerApplicationCard
                fertilizerApplications={loaderData.fertilizerApplications}
                applicationMethodOptions={loaderData.applicationMethodOptions}
                fertilizerOptions={loaderData.fertilizerOptions}
                dose={loaderData.dose}
            />
        </div>
    )
}

/**
 * Processes form submissions to add or delete fertilizer applications for a field.
 *
 * For POST requests, this function extracts form data and uses it along with the active user session
 * to add a new fertilizer application. For DELETE requests, it validates and retrieves the application ID
 * from the form data before removing the corresponding application. The function requires a valid field
 * identifier from the URL parameters and ensures that the session is correctly retrieved.
 *
 * @returns A response object indicating the success or error outcome of the operation.
 *
 * @throws {Error} If the field identifier is missing or an unexpected error occurs during processing.
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
            const { p_id, p_app_amount, p_app_date, p_app_method } = formValues

            await addFertilizerApplication(
                fdm,
                session.principal_id,
                b_id,
                p_id,
                p_app_amount,
                p_app_method,
                p_app_date,
            )

            return dataWithSuccess(
                { result: "Data saved successfully" },
                { message: "Bemesting is toegevoegd! 🎉" },
            )
        }

        if (request.method === "DELETE") {
            const formData = await request.formData()
            const p_app_id = formData.get("p_app_id")

            if (!p_app_id || typeof p_app_id !== "string") {
                return dataWithError(
                    "Invalid or missing p_app_id value",
                    "Oops! Something went wrong. Please try again later.",
                )
            }

            await removeFertilizerApplication(
                fdm,
                session.principal_id,
                p_app_id,
            )

            return dataWithSuccess("Date deleted successfully", {
                message: "Bemesting is verwijderd",
            })
        }
    } catch (error) {
        throw handleActionError(error)
    }
}
