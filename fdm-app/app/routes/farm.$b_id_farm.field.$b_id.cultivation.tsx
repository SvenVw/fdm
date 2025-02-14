import { CultivationsForm, FormSchema } from "@/components/custom/cultivations"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import {
    addCultivation,
    getCultivations,
    getCultivationsFromCatalogue,
    getField,
    removeCultivation,
} from "@svenvw/fdm-core"

import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
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

    // Get available cultivations for the farm
    const cultivationsCatalogue = await getCultivationsFromCatalogue(fdm)
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
    const cultivations = await getCultivations(fdm, b_id)

    // Return user information from loader
    return {
        field: field,
        cultivationsCatalogueOptions: cultivationsCatalogueOptions,
        cultivations: cultivations,
    }
}

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
                <CultivationsForm
                    cultivations={loaderData.cultivations}
                    action={location.pathname}
                    options={loaderData.cultivationsCatalogueOptions}
                />
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
        const { b_lu_catalogue, b_sowing_date, b_terminating_date } = formValues

        await addCultivation(
            fdm,
            b_lu_catalogue,
            b_id,
            b_sowing_date,
            b_terminating_date,
        )

        return dataWithSuccess(
            { result: "Data saved successfully" },
            { message: "Gewas is toegevoegd! 🎉" },
        )
    }

    if (request.method === "DELETE") {
        const formData = await request.formData()
        const b_lu = formData.get("b_lu")

        if (!b_lu || typeof b_lu !== "string") {
            return dataWithError(
                "Invalid or missing b_lu value",
                "Oops! Something went wrong. Please try again later.",
            )
        }

        try {
            await removeCultivation(fdm, b_lu)

            return dataWithSuccess("Date deleted successfully", {
                message: "Gewas is verwijderd",
            })
        } catch (error) {
            // Handle errors appropriately. Log the error for debugging purposes.
            console.error("Error deleting cultivation:", error)
            return dataWithError(
                error instanceof Error ? error.message : "Unknown error",
                "Er is een fout opgetreden bij het verwijderen van het gewas. Probeer het later opnieuw.",
            )
        }
    }
}
