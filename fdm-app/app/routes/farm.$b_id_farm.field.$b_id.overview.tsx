import { LoadingSpinner } from "@/components/custom/loadingspinner"
import { Button } from "@/components/ui/button"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { getField, updateField } from "@svenvw/fdm-core"
import { useEffect } from "react"
import { Form } from "react-hook-form"
import {
    type ActionFunctionArgs,
    type LoaderFunctionArgs,
    data,
    useLoaderData,
} from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithError, dataWithSuccess } from "remix-toast"
import { z } from "zod"

export async function loader({ request, params }: LoaderFunctionArgs) {
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

    // Return user information from loader
    return {
        field: field,
    }
}

export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: loaderData.field.b_name,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: loaderData.field.b_name,
        })
    }, [loaderData, form.reset])

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Overzicht</h3>
                <p className="text-sm text-muted-foreground">
                    Werk de gegevens bij van dit perceel
                </p>
            </div>
            <Separator />
            <RemixFormProvider {...form}>
                <Form
                    id="formFieldOverview"
                    onSubmit={form.handleSubmit}
                    method="POST"
                >
                    <fieldset disabled={form.formState.isSubmitting}>
                        <div className="grid grid-cols-2 w-full items-center gap-4">
                            <div className="flex flex-col space-y-1.5 col-span-2">
                                <FormField
                                    control={form.control}
                                    name="b_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Perceelsnaam</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="bv. Achter het erf"
                                                    {...field}
                                                    required
                                                />
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>
                    </fieldset>
                    <br />
                    <div className="ml-auto">
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                            className="m-auto"
                        >
                            {form.formState.isSubmitting && <LoadingSpinner />}
                            Bijwerken
                        </Button>
                    </div>
                </Form>
            </RemixFormProvider>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const b_id = params.b_id

    if (!b_id) {
        return dataWithError(null, "Missing field ID.")
    }

    try {
        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        await updateField(fdm, b_id, formValues.b_name)

        return dataWithSuccess("fieldis updated", {
            message: `${formValues.b_name} is bijgewerkt! 🎉`,
        })
    } catch (error) {
        console.error("Failed to update field:", error)
        return dataWithError(
            null,
            `Er is iets misgegaan bij het bijwerken van de perceelgegevens: ${error instanceof Error ? error.message : "Onbekende fout"}`,
        )
    }
}

// Form Schema
const FormSchema = z.object({
    b_name: z.string().min(3, {
        message: "Naam van perceel moet minimaal 3 karakters bevatten",
    }),
})
