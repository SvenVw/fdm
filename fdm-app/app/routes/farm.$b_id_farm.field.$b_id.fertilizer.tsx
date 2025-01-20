import {
    FertilizerApplicationsForm,
    FormSchema,
} from "@/components/custom/fertilizer-applications"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import {
    addFertilizerApplication,
    getFertilizerApplications,
    getFertilizers,
    getField,
    removeFertilizerApplication,
    updateField,
} from "@svenvw/fdm-core"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { Form } from "react-hook-form"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useLoaderData,
    useLocation,
} from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { z } from "zod"

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

    // Return user information from loader
    return {
        field: field,
        fertilizerOptions: fertilizerOptions,
        fertilizerApplications: fertilizerApplications,
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()
    const location = useLocation()

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Bemesting</h3>
                <p className="text-sm text-muted-foreground">
                    Hier kunt u de bemestingsgegevens van het perceel bijwerken.
                </p>
            </div>
            <Separator />
            <FertilizerApplicationsForm
                fertilizerApplications={loaderData.fertilizerApplications}
                action={location.pathname}
                options={loaderData.fertilizerOptions}
            />
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
        console.log("DELETE request")
        const formData = await request.formData()
        console.log(formData)
        const rawAppIds = formData.get("p_app_ids")

        if (!rawAppIds || typeof rawAppIds !== "string") {
            return dataWithError(
                "Invalid or missing p_app_ids value",
                "Oops! Something went wrong. Please try again later.",
            )
        }

        try {
            console.log(rawAppIds)
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

    try {
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        return dataWithSuccess("Fertilizer application is updated", {
            message: `Bemesting is bijgewerkt! 🎉`,
        })
    } catch (error) {
        console.error("Failed to update field:", error)
        return dataWithError("Failed to update field", {
            message: `Er is iets misgegaan bij het bijwerken van de perceelgegevens: ${error instanceof Error ? error.message : "Onbekende fout"}`,
        })
    }
}
