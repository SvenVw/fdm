import { calculateDose } from "@svenvw/fdm-calculator"
import {
    addFertilizerApplication,
    getCultivationPlan,
    getFertilizers,
    removeFertilizerApplication,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    type MetaFunction,
    data,
    useFetcher,
    useLoaderData,
    useLocation,
} from "react-router"
import { dataWithSuccess } from "remix-toast"
import { FertilizerApplicationsCards } from "~/components/custom/fertilizer-applications/cards"
import { FertilizerApplicationForm } from "~/components/custom/fertilizer-applications/form"
import { FormSchema } from "~/components/custom/fertilizer-applications/formschema"
import { FertilizerApplicationsList } from "~/components/custom/fertilizer-applications/list"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "@/app/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

// Meta
export const meta: MetaFunction = () => {
    return [
        {
            title: `Bemesting - Bouwplan - Bedrijf toevoegen | ${clientConfig.name}`,
        },
        {
            name: "description",
            content: "Bekijk en voeg bemestingen toe aan je bouwplan.",
        },
    ]
}

/**
 * Loads fertilizer and cultivation data for a given farm and cultivation catalogue.
 *
 * This function retrieves available fertilizers and the cultivation plan using session details, then aggregates similar fertilizer applications across all fields of the target cultivation. It also calculates the fertilizer dose and prepares fertilizer options for a combobox. If the required farm or catalogue identifiers are missing, or if the specified cultivation is not found, it returns an error response through a centralized error handler.
 *
 * @returns An object containing the farm ID, cultivation catalogue ID, fertilizer options, aggregated fertilizer applications, and the calculated fertilizer dose.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        // Extract farm ID from URL parameters
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", {
                status: 400,
                statusText: "Farm ID is required",
            })
        }

        // Extract cultivation catalogue ID from URL parameters
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw data("Cultivation catalogue ID is required", {
                status: 400,
                statusText: "Cultivation catalogue ID is required",
            })
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        // Fetch available fertilizers for the farm
        const fertilizers = await getFertilizers(
            fdm,
            session.principal_id,
            b_id_farm,
        )
        // Map fertilizers to options for the combobox
        const fertilizerOptions = fertilizers.map((fertilizer) => {
            return {
                value: fertilizer.p_id,
                label: fertilizer.p_name_nl,
            }
        })

        // Fetch the cultivation plan for the farm
        const cultivationPlan = await getCultivationPlan(
            fdm,
            session.principal_id,
            b_id_farm,
            timeframe,
        )

        // Find the target cultivation within the cultivation plan
        const targetCultivation = cultivationPlan.find(
            (c) => c.b_lu_catalogue === b_lu_catalogue,
        )
        if (!targetCultivation) {
            throw data("Cultivation not found", { status: 404 })
        }

        // Combine similar fertilizer applications across all fields of the target cultivation.
        const fertilizerApplications = targetCultivation.fields.reduce(
            (accumulator, field) => {
                field.fertilizer_applications.forEach((app) => {
                    // Create a key based on application properties to identify similar applications.
                    const isSimilarApplication = (app1: any, app2: any) =>
                        app1.p_id_catalogue === app2.p_id_catalogue &&
                        app1.p_app_amount === app2.p_app_amount &&
                        app1.p_app_method === app2.p_app_method &&
                        app1.p_app_date.getTime() === app2.p_app_date.getTime()

                    const existingApplication = accumulator.find(
                        (existingApp) => isSimilarApplication(existingApp, app),
                    )

                    if (existingApplication) {
                        // If similar application exists, add the current p_app_id to its p_app_ids array.
                        existingApplication.p_app_ids.push(app.p_app_id)
                    } else {
                        // If it's a new application, add it to the accumulator with a new p_app_ids array.
                        accumulator.push({ ...app, p_app_ids: [app.p_app_id] })
                    }
                })

                return accumulator
            },
            [],
        )

        const dose = calculateDose({
            applications: fertilizerApplications,
            fertilizers,
        })

        return {
            b_lu_catalogue: b_lu_catalogue,
            b_id_farm: b_id_farm,
            fertilizerOptions: fertilizerOptions,
            fertilizerApplications: fertilizerApplications,
            dose: dose,
        }
    } catch (error) {
        return handleLoaderError(error)
    }
}

/**
 * Renders the fertilizer management interface.
 *
 * This component displays a form for adding new fertilizer applications alongside a list of existing applications and a card
 * that shows the calculated fertilizer dose. It retrieves necessary data using loader data, the current location, and a fetcher
 * for asynchronous actions.
 *
 * @example
 * // Renders the fertilizer applications view.
 * <Index />
 */
export default function Index() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()
    const fetcher = useFetcher()

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Vul de bemesting op bouwplanniveau in voor dit gewas.
            </p>
            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <FertilizerApplicationForm
                        options={loaderData.fertilizerOptions}
                        action={location.pathname}
                        fetcher={fetcher}
                    />
                    <Separator className="my-4" />
                    <FertilizerApplicationsList
                        fertilizerApplications={
                            loaderData.fertilizerApplications
                        }
                        fetcher={fetcher}
                    />
                </div>
                <div>
                    <FertilizerApplicationsCards dose={loaderData.dose} />
                </div>
            </div>
        </div>
    )
}

/**
 * Handles the addition and removal of fertilizer applications for a specific farm cultivation.
 *
 * Processes POST requests by validating URL parameters, retrieving session data, extracting fertilizer details from the form,
 * and applying the fertilizer to all fields within the specified cultivation. Processes DELETE requests by validating and parsing
 * a comma-separated list of fertilizer application IDs and removing each application.
 *
 * @throws {Error} If required URL parameters (farm ID or cultivation catalogue ID) are missing, if form data validation fails,
 * or if the request method is unsupported.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        // Get the Id of the farm
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw new Error("missing: b_id_farm")
        }
        // Get the cultivation
        const b_lu_catalogue = params.b_lu_catalogue
        if (!b_lu_catalogue) {
            throw new Error("missing: b_lu_catalogue")
        }

        // Get the session
        const session = await getSession(request)

        // Get timeframe from calendar store
        const timeframe = getTimeframe(params)

        if (request.method === "POST") {
            // Collect form entry
            const formValues = await extractFormValuesFromRequest(
                request,
                FormSchema,
            )
            const { p_id, p_app_amount, p_app_date } = formValues

            // Get the cultivation details for this cultivation
            const cultivationPlan = await getCultivationPlan(
                fdm,
                session.principal_id,
                b_id_farm,
                timeframe,
            )

            // Get the id of the fields with this cultivation
            const fields = cultivationPlan.find(
                (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
            ).fields

            await Promise.all(
                fields.map(async (field) => {
                    const b_id = field.b_id
                    addFertilizerApplication(
                        fdm,
                        session.principal_id,
                        b_id,
                        p_id,
                        p_app_amount,
                        undefined,
                        p_app_date,
                    )
                }),
            )

            return dataWithSuccess(
                { result: "Data saved successfully" },
                { message: "Bemesting is toegevoegd! 🎉" },
            )
        }
        if (request.method === "DELETE") {
            const formData = await request.formData()
            const rawAppIds = formData.get("p_app_id")

            if (!rawAppIds || typeof rawAppIds !== "string") {
                throw new Error("invalid: p_app_id")
            }

            const p_app_ids = rawAppIds.split(",")
            await Promise.all(
                p_app_ids.map((p_app_id: string) =>
                    removeFertilizerApplication(
                        fdm,
                        session.principal_id,
                        p_app_id,
                    ),
                ),
            )

            return dataWithSuccess({}, { message: "Bemesting is verwijderd" })
        }
        throw new Error(`${request.method} is not supported`)
    } catch (error) {
        throw handleActionError(error)
    }
}
