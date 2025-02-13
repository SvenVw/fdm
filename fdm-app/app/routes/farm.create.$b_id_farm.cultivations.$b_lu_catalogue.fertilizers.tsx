import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useFetcher,
    useLoaderData,
    useLocation,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"

// Components
import { FertilizerApplicationsForm } from "@/components/custom/fertilizer-applications"
import { FormSchema } from "@/components/custom/fertilizer-applications"
import { extractFormValuesFromRequest } from "@/lib/form"

import {
    addFertilizerApplication,
    getCultivationPlan,
    getFertilizers,
    removeFertilizerApplication,
} from "@svenvw/fdm-core"
// FDM
import { fdm } from "../lib/fdm.server"
import { FertilizerApplicationForm } from "@/components/custom/fertilizer-applications/form"
import { Separator } from "@/components/ui/separator"
import { FertilizerApplicationsList } from "@/components/custom/fertilizer-applications/list"
import { FertilizerApplicationsCards } from "@/components/custom/fertilizer-applications/cards"
import { calculateDose } from "@svenvw/fdm-calculator"
import { FertilizerApplicationsCardProps } from "@/components/custom/fertilizer-applications/types.d"

// Loader
export async function loader({ request, params }: LoaderFunctionArgs) {
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

    // Fetch available fertilizers for the farm
    const fertilizers = await getFertilizers(fdm, b_id_farm)
    // Map fertilizers to options for the combobox
    const fertilizerOptions = fertilizers.map((fertilizer) => {
        return {
            value: fertilizer.p_id,
            label: fertilizer.p_name_nl,
        }
    })

    // Fetch the cultivation plan for the farm
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(
        (error) => {
            throw data("Failed to fetch cultivation plan", {
                status: 500,
                statusText: error.message,
            })
        },
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

                const existingApplication = accumulator.find((existingApp) =>
                    isSimilarApplication(existingApp, app),
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
}

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

export async function action({ request, params }: ActionFunctionArgs) {
    // Get the Id of the farm
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw data("Farm ID is required", {
            status: 400,
            statusText: "Farm ID is required",
        })
    }

    // Get the cultivation
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw data("Cultivation catalogue ID is required", {
            status: 400,
            statusText: "Cultivation catalogue ID is required",
        })
    }

    if (request.method === "POST") {
        // Collect form entry
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const { p_id, p_app_amount, p_app_date } = formValues

        // Get the cultivation details for this cultivation
        const cultivationPlan = await getCultivationPlan(fdm, b_id_farm).catch(
            (error) => {
                throw data("Failed to fetch cultivation plan", {
                    status: 500,
                    statusText: error.message,
                })
            },
        )

        // Get the id of the fields with this cultivation
        const fields = cultivationPlan.find(
            (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
        ).fields

        fields.map(async (field) => {
            const b_id = field.b_id
            await addFertilizerApplication(
                fdm,
                b_id,
                p_id,
                p_app_amount,
                undefined,
                p_app_date,
            )
        })

        return dataWithSuccess(
            { result: "Data saved successfully" },
            { message: "Bemesting is toegevoegd! 🎉" },
        )
    }
    if (request.method === "DELETE") {
        const formData = await request.formData()
        const rawAppIds = formData.get("p_app_id")

        if (!rawAppIds || typeof rawAppIds !== "string") {
            return dataWithError(
                "Invalid or missing p_app_ids value",
                "Oops! Something went wrong. Please try again later.",
            )
        }

        try {
            const p_app_ids = rawAppIds.split(",")
            await Promise.all(
                p_app_ids.map((p_app_id: string) =>
                    removeFertilizerApplication(fdm, p_app_id),
                ),
            )

            return dataWithSuccess({}, { message: "Bemesting is verwijderd" })
        } catch (error) {
            // Handle errors appropriately. Log the error for debugging purposes.
            console.error("Error deleting fertilizer application:", error)
            return dataWithError(
                error instanceof Error ? error.message : "Unknown error",
                "Er is een fout opgetreden bij het verwijderen van de bemesting. Probeer het later opnieuw.",
            )
        }
    }

    //  Handle other methods. This returns an error response for methods other than POST or DELETE, which may or may not be what's desired.
    console.error(`${request.method} is not supported`)
    return dataWithError(
        null,
        "Oops! Something went wrong. Please try again later.",
    )
}
