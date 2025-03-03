import { FertilizerApplicationsCards } from "@/components/custom/fertilizer-applications/cards"
import { FertilizerApplicationForm } from "@/components/custom/fertilizer-applications/form"
import { FormSchema } from "@/components/custom/fertilizer-applications/formschema"
import { FertilizerApplicationsList } from "@/components/custom/fertilizer-applications/list"
import { Separator } from "@/components/ui/separator"
import { getSession } from "@/lib/auth.server"
import { handleActionError, handleLoaderError } from "@/lib/error"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import { calculateDose } from "@svenvw/fdm-calculator"
import {
    addFertilizerApplication,
    getFertilizerApplications,
    getFertilizers,
    getField,
    removeFertilizerApplication,
} from "@svenvw/fdm-core"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useFetcher,
    useLoaderData,
    useLocation,
} from "react-router"
import { dataWithError, dataWithSuccess } from "remix-toast"

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

        // Get available fertilizers for the farm
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

        // Get fertilizer applications for the field
        const fertilizerApplications = await getFertilizerApplications(
            fdm,
            session.principal_id,
            b_id,
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
            dose: dose,
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()
    const fetcher = useFetcher()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Bemesting</h3>
                <p className="text-sm text-muted-foreground">
                    Hier kunt u de bemestingsgegevens van het perceel bijwerken.
                </p>
            </div>
            <Separator />
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
            const { p_id, p_app_amount, p_app_date } = formValues

            await addFertilizerApplication(
                fdm,
                session.principal_id,
                b_id,
                p_id,
                p_app_amount,
                undefined,
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
