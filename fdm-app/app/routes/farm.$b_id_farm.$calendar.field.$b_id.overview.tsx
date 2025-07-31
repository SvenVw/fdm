import { zodResolver } from "@hookform/resolvers/zod"
import {
    getField,
    listAvailableAcquiringMethods,
    updateField,
} from "@svenvw/fdm-core"
import { useEffect } from "react"
import type { MetaFunction } from "react-router"
import {
    type ActionFunctionArgs,
    data,
    Form,
    type LoaderFunctionArgs,
    useLoaderData,
} from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { dataWithSuccess } from "remix-toast"
import { z } from "zod"
import { DatePicker } from "~/components/custom/date-picker"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Separator } from "~/components/ui/separator"
import { getSession } from "~/lib/auth.server"
import { clientConfig } from "~/lib/config"
import { handleActionError, handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { extractFormValuesFromRequest } from "~/lib/form"

export const meta: MetaFunction = () => {
    return [
        { title: `Overzicht - Perceel | ${clientConfig.name}` },
        {
            name: "description",
            content:
                "Bekijk en beheer de algemene informatie van uw perceel, inclusief naam, eigendomsgegevens en tijdsperiode.",
        },
    ]
}

/**
 * Loads farm field details for the overview page.
 *
 * Retrieves the field ID from route parameters and uses the current user's session to fetch the corresponding field details.
 * Throws an error with a 400 status if the field ID is missing, or with a 404 status if the field is not found.
 *
 * @returns An object containing the retrieved field details.
 *
 * @throws {Response} When the field ID is missing or the field is not found.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
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

        // Return user information from loader
        return {
            field: field,
            acquiringMethodOptions: listAvailableAcquiringMethods(),
        }
    } catch (error) {
        throw handleLoaderError(error)
    }
}

/**
 * Renders the overview block for editing farm field details.
 *
 * Retrieves initial field data via useLoaderData and initializes a validated form with fields for the
 * field's name, acquiring method, acquiring date, and terminating date. The form automatically resets
 * its values when updated loader data is provided and integrates with a submit handler to update the field.
 */
export default function FarmFieldsOverviewBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: loaderData.field.b_name,
            b_acquiring_method: loaderData.field.b_acquiring_method,
            b_start: loaderData.field.b_start,
            b_end: loaderData.field.b_end,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: loaderData.field.b_name,
            b_acquiring_method: loaderData.field.b_acquiring_method,
            b_start: loaderData.field.b_start,
            b_end: loaderData.field.b_end,
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
                    method="post"
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
                            <div className="flex flex-col space-y-1.5 col-span-2">
                                <FormField
                                    control={form.control}
                                    name="b_acquiring_method"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Is perceel in eigendom of pacht?
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecteer of het perceel in eigendom is of gepacht" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {loaderData.acquiringMethodOptions.map(
                                                            (option) => (
                                                                <SelectItem
                                                                    key={
                                                                        option.value
                                                                    }
                                                                    value={
                                                                        option.value
                                                                    }
                                                                >
                                                                    {
                                                                        option.label
                                                                    }
                                                                </SelectItem>
                                                            ),
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <DatePicker
                                    form={form}
                                    name={"b_start"}
                                    label={"Vanaf wanneer in gebruik?"}
                                    description={""}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <DatePicker
                                    form={form}
                                    name={"b_end"}
                                    label={"Tot wanneer in gebruik?"}
                                    description={"Optioneel"}
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

/**
 * Updates a farm field's details using the form data submitted in the request.
 *
 * This action function retrieves the required field identifier from the route parameters, obtains the user session,
 * and extracts validated form data according to a predefined schema. It then updates the corresponding farm field record
 * and returns a success response. Any errors encountered during the process are handled by a centralized error handler.
 */
export async function action({ request, params }: ActionFunctionArgs) {
    try {
        const b_id = params.b_id

        if (!b_id) {
            throw new Error("missing: b_id")
        }

        // Get the session
        const session = await getSession(request)

        const formValues = await extractFormValuesFromRequest(
            request,
            FormSchema,
        )

        await updateField(
            fdm,
            session.principal_id,
            b_id,
            formValues.b_name,
            undefined,
            undefined,
            formValues.b_start,
            formValues.b_acquiring_method,
            formValues.b_end,
        )

        return dataWithSuccess("field is updated", {
            message: `Perceel ${formValues.b_name} is bijgewerkt! 🎉`,
        })
    } catch (error) {
        return handleActionError(error)
    }
}

// Form Schema
const FormSchema = z
    .object({
        b_name: z.string().min(3, {
            message: "Naam van perceel moet minimaal 3 karakters bevatten",
        }),
        b_acquiring_method: z.string({
            required_error:
                "Selecteer of het perceel in eigendom is of gepacht",
        }),
        b_start: z.coerce.date().optional(),
        b_end: z.coerce.date().optional(),
    })
    .refine(
        (schema) => {
            if (schema.b_start && schema.b_end) {
                return schema.b_end > schema.b_start
            }
            return true
        },
        {
            message: "Einddatum moet na de startdatum zijn",
            path: ["b_end"],
        },
    )
