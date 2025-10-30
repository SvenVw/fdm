import { calculateDose } from "@svenvw/fdm-calculator"
import {
    addFertilizerApplication,
    getCultivationPlan,
    getFertilizerParametersDescription,
    getFertilizers,
    removeFertilizerApplication,
    updateFertilizerApplication,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    data,
    type LoaderFunctionArgs,
    type MetaFunction,
    useLoaderData,
} from "react-router"
import { dataWithSuccess } from "remix-toast"
import { FertilizerApplicationCard } from "~/components/blocks/fertilizer-applications/card"
import {
    FormSchema,
    PatchFormSchema,
} from "~/components/blocks/fertilizer-applications/formschema"
import { getSession } from "~/lib/auth.server"
import { getTimeframe } from "~/lib/calendar"
import { clientConfig } from "~/lib/config"
import { handleActionError } from "~/lib/error"
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

    // Map fertilizer catalogue ids to their farm fertilizer acquiring ids
    const fertilizerAcquiringIds: Record<string, string> = {}
    for (const fertilizer of fertilizers) {
        if (fertilizer.p_id_catalogue) {
            fertilizerAcquiringIds[fertilizer.p_id_catalogue] = fertilizer.p_id
        }
    }

    const fertilizerParameterDescription = getFertilizerParametersDescription()
    const applicationMethods = fertilizerParameterDescription.find(
        (x: { parameter: string }) => x.parameter === "p_app_method_options",
    )
    if (!applicationMethods) throw new Error("Parameter metadata missing")
    // Map fertilizers to options for the combobox
    const fertilizerOptions = fertilizers.map((fertilizer) => {
        const applicationMethodOptions = fertilizer.p_app_method_options
            .map((opt: string) => {
                const meta = applicationMethods.options.find(
                    (x: { value: string }) => x.value === opt,
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
        (accumulator: any[], field: { fertilizer_applications: any[] }) => {
            field.fertilizer_applications.forEach((app: any) => {
                // Create a key based on application properties to identify similar applications.
                const isSimilarApplication = (app1: any, app2: any) =>
                    app1.p_id_catalogue === app2.p_id_catalogue &&
                    app1.p_app_amount === app2.p_app_amount &&
                    app1.p_app_method === app2.p_app_method &&
                    app1.p_app_date.getTime() === app2.p_app_date.getTime()

                const existingApplication = accumulator.find(
                    (existingApp: any) =>
                        isSimilarApplication(existingApp, app),
                )

                if (existingApplication) {
                    // If similar application exists, add the current p_app_id to its p_app_ids array.
                    existingApplication.p_app_ids.push(app.p_app_id)
                } else {
                    // If it's a new application, add it to the accumulator with a new p_app_ids array.
                    accumulator.push({
                        ...app,
                        p_id:
                            fertilizerAcquiringIds[app.p_id_catalogue] ??
                            app.p_id_catalogue,
                        p_app_ids: [app.p_app_id],
                    })
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
        dose: dose.dose,
        applicationMethodOptions: applicationMethods.options,
    }
}

export default function Index() {
    const loaderData = useLoaderData<typeof loader>() as Awaited<
        ReturnType<typeof loader>
    >

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
            const { p_id, p_app_amount, p_app_date, p_app_method } = formValues

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
            )?.fields

            if (fields) {
                await Promise.all(
                    fields.map(async (field: { b_id: string }) => {
                        const b_id = field.b_id
                        await addFertilizerApplication(
                            fdm,
                            session.principal_id,
                            b_id,
                            p_id,
                            p_app_amount,
                            p_app_method,
                            p_app_date,
                        )
                    }),
                )
            }

            return dataWithSuccess(
                { result: "Data saved successfully" },
                { message: "Bemesting is toegevoegd! 🎉" },
            )
        }
        if (request.method === "PUT") {
            const formValues = await extractFormValuesFromRequest(
                request,
                PatchFormSchema,
            )
            const rawAppIds = formValues.p_app_id

            if (!rawAppIds || typeof rawAppIds !== "string") {
                throw new Error("invalid: p_app_id")
            }

            const p_app_ids = rawAppIds.split(",")

            const { p_id, p_app_amount, p_app_date, p_app_method } = formValues

            await Promise.all(
                p_app_ids.map((p_app_id: string) =>
                    updateFertilizerApplication(
                        fdm,
                        session.principal_id,
                        p_app_id,
                        p_id,
                        p_app_amount,
                        p_app_method,
                        p_app_date,
                    ),
                ),
            )

            return dataWithSuccess({}, { message: "Bemesting is gewijzigd" })
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
