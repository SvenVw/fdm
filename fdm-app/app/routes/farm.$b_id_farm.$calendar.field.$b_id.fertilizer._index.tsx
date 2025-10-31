import {
    calculateDose,
    createFunctionsForNorms,
    getNitrogenBalance,
    getNutrientAdvice,
    createFunctionsForFertilizerApplicationFilling,
    collectInputForNitrogenBalance,
    NitrogenBalanceNumeric,
} from "@svenvw/fdm-calculator"
import {
    addFertilizerApplication,
    getFertilizerApplications,
    getFertilizerParametersDescription,
    getFertilizers,
    getField,
    removeFertilizerApplication,
    getCurrentSoilData,
    getCultivations,
    Timeframe,
    FdmType,
    updateFertilizerApplication,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
    useNavigation,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { FertilizerApplicationCard } from "~/components/blocks/fertilizer-applications/card"
import {
    FormSchema,
    FormSchemaModify,
} from "~/components/blocks/fertilizer-applications/formschema"
import { getSession } from "~/lib/auth.server"
import { getCalendar, getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"
import { FertilizerApplicationMetricsCard } from "~/components/blocks/fertilizer-applications/metrics"
import {
    getNitrogenBalanceforField,
    getNorms,
    getNutrientAdviceForField,
} from "../integrations/calculator"

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
        const principal_id = session.principal_id

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
        const b_centroid = field.b_centroid

        // Get available fertilizers for the farm
        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        const fertilizerParameterDescription =
            getFertilizerParametersDescription()
        const applicationMethods = fertilizerParameterDescription.find(
            (x: any) => x.parameter === "p_app_method_options",
        )
        if (!applicationMethods) throw new Error("Parameter metadata missing")
        // Map fertilizers to options for the combobox
        const fertilizerOptions = fertilizers.map((fertilizer) => {
            const applicationMethodOptions = fertilizer.p_app_method_options
                .map((opt: any) => {
                    const meta = applicationMethods.options.find(
                        (x: any) => x.value === opt,
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

        const fertilizerApplicationMetricsData = {
            norms: getNorms({
                fdm,
                principal_id,
                b_id,
            }),
            nitrogenBalance: getNitrogenBalanceforField({
                fdm,
                principal_id,
                b_id_farm,
                b_id,
                timeframe,
            }),
            nutrientAdvice: getNutrientAdviceForField({
                fdm,
                principal_id,
                b_id,
                b_centroid,
                timeframe,
            }),
            dose: dose.dose,
            b_id: b_id,
            b_id_farm: b_id_farm,
            calendar: getCalendar(params),
        }

        // Return user information from loader, including the promises
        return {
            field: field,
            fertilizerOptions: fertilizerOptions,
            fertilizerApplications: fertilizerApplications,
            fertilizers: fertilizers,
            dose: dose.dose,
            applicationMethodOptions: applicationMethods.options,
            fertilizerApplicationMetricsData: fertilizerApplicationMetricsData,
            calendar: getCalendar(params),
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
    const navigation = useNavigation()
    const isSubmitting = navigation.state === "submitting"

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                <div className="md:col-span-1 lg:col-span-1">
                    <FertilizerApplicationCard
                        fertilizerApplications={
                            loaderData.fertilizerApplications
                        }
                        applicationMethodOptions={
                            loaderData.applicationMethodOptions
                        }
                        fertilizers={loaderData.fertilizers}
                        fertilizerOptions={loaderData.fertilizerOptions}
                        dose={loaderData.dose}
                    />
                </div>
                <div className="md:col-span-1 lg:col-span-2">
                    <FertilizerApplicationMetricsCard
                        fertilizerApplicationMetricsData={
                            loaderData.fertilizerApplicationMetricsData
                        }
                        isSubmitting={isSubmitting}
                    />
                </div>
            </div>
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

        if (request.method === "PUT") {
            // Collect form entry
            const formValues = await extractFormValuesFromRequest(
                request,
                FormSchemaModify,
            )
            const { p_app_id, p_id, p_app_amount, p_app_date, p_app_method } =
                formValues

            if (!p_app_id || typeof p_app_id !== "string") {
                return dataWithError(
                    "Invalid or missing p_app_id value",
                    "Helaas, er is wat misgegaan. Probeer het later opnieuw of neem contact op met ondersteuning.",
                )
            }

            await updateFertilizerApplication(
                fdm,
                session.principal_id,
                p_app_id,
                p_id,
                p_app_amount,
                p_app_method,
                p_app_date,
            )

            return dataWithSuccess("Date edited successfully", {
                message: "Bemesting is gewijzigd",
            })
        }

        if (request.method === "DELETE") {
            const formData = await request.formData()
            const p_app_id = formData.get("p_app_id")

            if (!p_app_id || typeof p_app_id !== "string") {
                return dataWithError(
                    "Invalid or missing p_app_id value",
                    "Helaas, er is wat misgegaan. Probeer het later opnieuw of neem contact op met ondersteuning.",
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
