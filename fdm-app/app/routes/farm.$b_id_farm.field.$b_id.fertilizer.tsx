import { FertilizerApplicationForm } from "@/components/custom/fertilizer-applications/form"
import { FertilizerApplicationsCards } from "@/components/custom/fertilizer-applications/cards"
import { FormSchema } from "@/components/custom/fertilizer-applications/formschema"
import { FertilizerApplicationsList } from "@/components/custom/fertilizer-applications/list"
import {
    FertilizerApplication,
    FertilizerApplicationsCardProps,
} from "@/components/custom/fertilizer-applications/types.d"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
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

    // Get details of field
    const field = await getField(fdm, b_id)
    if (!field) {
        throw data("Field is not found", {
            status: 404,
            statusText: "Field is not found",
        })
    }

    // Get available fertilizers for the farm
    const fertilizers = await getFertilizers(fdm, b_id_farm)
    // Map fertilizers to options for the combobox
    const fertilizerOptions = fertilizers.map((fertilizer) => {
        return {
            value: fertilizer.p_id,
            label: fertilizer.p_name_nl,
        }
    })

    // Get fertilizer applications for the field
    const fertilizerApplications = await getFertilizerApplications(fdm, b_id)

    // Get the fertilizer application cards
    //
    const cards: FertilizerApplicationsCardProps[] = [
        {
            title: "Stikstof, totaal",
            shortname: "Ntot",
            value: 120,
            unit: "kg/ha",
            limit: 230,
            advice: 200,
        },
        {
            title: "Fosfaat, totaal",
            shortname: "P",
            value: 80,
            unit: "kg/ha",
            limit: 100,
            advice: 80,
        },
        {
            title: "Kalium, totaal",
            shortname: "K",
            value: 100,
            unit: "kg/ha",
            limit: 120,
            advice: 100,
        },
    ]

    // Return user information from loader
    return {
        field: field,
        fertilizerOptions: fertilizerOptions,
        fertilizerApplications: fertilizerApplications,
        fertilizerApplicationsCards: cards,
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()

    const fetcher = useFetcher()

    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "delete", action: props.action })
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Bemesting</h3>
                <p className="text-sm text-muted-foreground">
                    Hier kunt u de bemestingsgegevens van het perceel bijwerken.
                </p>
            </div>
            <Separator />
            <div className="grid md:grid-cols-2 gap-8 space-x-16">
                <div>
                    <FertilizerApplicationForm
                        options={loaderData.fertilizerOptions}
                        action={location.pathname}
                    />
                    <Separator className="my-4" />
                    <FertilizerApplicationsList
                        fertilizerApplications={
                            loaderData.fertilizerApplications
                        }
                        handleDelete={handleDelete}
                        state={fetcher.state}
                    />
                </div>
                <div>
                    <FertilizerApplicationsCards
                        cards={loaderData.fertilizerApplicationsCards}
                    />
                </div>
            </div>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    // Get the field ID
    const b_id = params.b_id
    if (!b_id) {
        return dataWithError(null, "Missing field ID.")
    }

    if (request.method === "POST") {
        // Collect form entry
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )
        const { p_id, p_app_amount, p_app_date } = formValues

        await addFertilizerApplication(
            fdm,
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

        try {
            await removeFertilizerApplication(fdm, p_app_id)

            return dataWithSuccess("Date deleted successfully", {
                message: "Bemesting is verwijderd",
            })
        } catch (error) {
            // Handle errors appropriately. Log the error for debugging purposes.
            console.error("Error deleting fertilizer application:", error)
            return dataWithError(
                error instanceof Error ? error.message : "Unknown error",
                "Er is een fout opgetreden bij het verwijderen van de bemesting. Probeer het later opnieuw.",
            )
        }
    }
}
