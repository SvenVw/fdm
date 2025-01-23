import { LoadingSpinner } from "@/components/custom/loadingspinner"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { fdm } from "@/lib/fdm.server"
import { extractFormValuesFromRequest } from "@/lib/form"
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { getField, updateField } from "@svenvw/fdm-core"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { useEffect, useState } from "react"
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
            b_acquiring_method: loaderData.field.b_acquiring_method,
            b_acquiring_date: loaderData.field.b_acquiring_date,
            b_terminating_date: loaderData.field.b_terminating_date,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: loaderData.field.b_name,
            b_acquiring_method: loaderData.field.b_acquiring_method,
            b_acquiring_date: loaderData.field.b_acquiring_date,
            b_terminating_date: loaderData.field.b_terminating_date,
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
                                                    defaultValue={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecteer of het perceel in eigendom is of gepacht" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="owner">
                                                            Eigendom
                                                        </SelectItem>
                                                        <SelectItem value="lease">
                                                            Pacht
                                                        </SelectItem>
                                                        <SelectItem value="unknown">
                                                            Onbekend
                                                        </SelectItem>
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
                                <FormField
                                    control={form.control}
                                    name="b_acquiring_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Vanaf wanneer in gebruik?
                                            </FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-[240px] pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "d MMM YYY",
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Kies een
                                                                    datum
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date <
                                                            new Date(
                                                                "1970-01-01",
                                                            )
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                Optioneel
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div className="flex flex-col space-y-1.5">
                                <FormField
                                    control={form.control}
                                    name="b_terminating_date"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>
                                                Tot wanneer in gebruik?
                                            </FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-[240px] pl-3 text-left font-normal",
                                                                !field.value &&
                                                                    "text-muted-foreground",
                                                            )}
                                                        >
                                                            {field.value ? (
                                                                format(
                                                                    field.value,
                                                                    "d MMM YYY",
                                                                )
                                                            ) : (
                                                                <span>
                                                                    Kies een
                                                                    datum
                                                                </span>
                                                            )}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent
                                                    className="w-auto p-0"
                                                    align="start"
                                                >
                                                    <Calendar
                                                        mode="single"
                                                        selected={field.value}
                                                        onSelect={
                                                            field.onChange
                                                        }
                                                        disabled={(date) =>
                                                            date <
                                                            new Date(
                                                                "1970-01-01",
                                                            )
                                                        }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription>
                                                Optioneel
                                            </FormDescription>
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

        await updateField(
            fdm,
            b_id,
            formValues.b_name,
            undefined,
            undefined,
            formValues.b_acquiring_date,
            formValues.b_acquiring_method,
            formValues.b_terminating_date,
        )

        return dataWithSuccess("field is updated", {
            message: `${formValues.b_name} is bijgewerkt! 🎉`,
        })
    } catch (error) {
        console.error("Failed to update field:", error)
        return dataWithError("Failed to update field", {
            message: `Er is iets misgegaan bij het bijwerken van de perceelgegevens: ${error instanceof Error ? error.message : "Onbekende fout"}`,
        })
    }
}

// Form Schema
const FormSchema = z.object({
    b_name: z.string().min(3, {
        message: "Naam van perceel moet minimaal 3 karakters bevatten",
    }),
    b_acquiring_method: z.enum(["owner", "lease", "unknown"]),
    b_acquiring_date: z.coerce.date().optional(),
    b_terminating_date: z.coerce.date().optional(),
})
