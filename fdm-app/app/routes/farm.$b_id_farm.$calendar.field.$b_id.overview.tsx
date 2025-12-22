import { zodResolver } from "@hookform/resolvers/zod"
import {
    checkPermission,
    getField,
    listAvailableAcquiringMethods,
    updateField,
} from "@svenvw/fdm-core"
import { useEffect } from "react"
import { Controller } from "react-hook-form"
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
import { DatePicker } from "~/components/custom/date-picker-v2"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import { Field, FieldError, FieldLabel } from "~/components/ui/field"
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
import { cn } from "~/lib/utils"

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

        const fieldWritePermission = await checkPermission(
            fdm,
            "field",
            "write",
            b_id,
            session.principal_id,
            new URL(request.url).pathname,
            false,
        )

        // Return user information from loader
        return {
            field: field,
            fieldWritePermission,
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
            b_start: loaderData.field.b_start ?? new Date(),
            b_end: loaderData.field.b_end,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: loaderData.field.b_name,
            b_acquiring_method: loaderData.field.b_acquiring_method,
            b_start: loaderData.field.b_start ?? new Date(),
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
                        <div className="grid grid-cols-2 w-full gap-4">
                            <Controller
                                control={form.control}
                                name="b_name"
                                render={({ field, fieldState }) => (
                                    <Field
                                        data-invalid={fieldState.invalid}
                                        className="col-span-2"
                                    >
                                        <FieldLabel>Perceelsnaam</FieldLabel>
                                        <Input
                                            placeholder="bv. Achter het erf"
                                            {...field}
                                            required
                                        />
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="b_acquiring_method"
                                render={({ field, fieldState }) => (
                                    <Field
                                        data-invalid={fieldState.invalid}
                                        className="col-span-2"
                                    >
                                        <FieldLabel>
                                            Is perceel in eigendom of pacht?
                                        </FieldLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecteer of het perceel in eigendom is of gepacht" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {loaderData.acquiringMethodOptions.map(
                                                    (option) => (
                                                        <SelectItem
                                                            key={option.value}
                                                            value={option.value}
                                                        >
                                                            {option.label}
                                                        </SelectItem>
                                                    ),
                                                )}
                                            </SelectContent>
                                        </Select>
                                        <FieldError
                                            errors={[fieldState.error]}
                                        />
                                    </Field>
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="b_start"
                                render={({ field, fieldState }) => (
                                    <DatePicker
                                        label="Vanaf wanneer in gebruik?"
                                        field={field}
                                        fieldState={fieldState}
                                    />
                                )}
                            />
                            <Controller
                                control={form.control}
                                name="b_end"
                                render={({ field, fieldState }) => (
                                    <DatePicker
                                        label="Tot wanneer in gebruik?"
                                        description="Optioneel"
                                        field={field}
                                        fieldState={fieldState}
                                    />
                                )}
                            />
                        </div>
                    </fieldset>
                    <br />
                    <div className="ml-auto">
                        <Button
                            type="submit"
                            disabled={form.formState.isSubmitting}
                            className={cn(
                                "m-auto",
                                !loaderData.fieldWritePermission && "invisible",
                            )}
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
        b_name: z.string().min(2, {
            message: "Naam van perceel moet minimaal 2 karakters bevatten",
        }),
        b_acquiring_method: z.string({
            required_error:
                "Selecteer of het perceel in eigendom is of gepacht",
        }),
        b_start: z.coerce.date({
            required_error: "Kies een startdatum voor het perceel",
        }),
        b_end: z.coerce.date().nullable().optional(),
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
