import {
    type ActionFunctionArgs,
    data,
    Form,
    type LoaderFunctionArgs,
    useLoaderData,
} from "react-router"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { z } from "zod"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { LoadingSpinner } from "@/components/custom/loadingspinner"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { nl } from "date-fns/locale"
import {
    addHarvest,
    getCultivationPlan,
    updateCultivation,
} from "@svenvw/fdm-core"
import { extractFormValuesFromRequest } from "@/lib/form"
import { dataWithSuccess } from "remix-toast"
import { fdm } from "@/lib/fdm.server"

const FormSchema = z.object({
    b_lu_yield: z.coerce
        .number({
            invalid_type_error: "Hoeveelheid moet een getal zijn",
        })
        .positive({
            message: "Hoeveelheid moet positief zijn",
        })
        .finite({
            message: "Hoeveelheid moet een geheel getal zijn",
        })
        .max(100, {
            message: "Hoeveelheid mag niet groter zijn dan 100",
        })
        .safe({
            message: "Hoeveelheid moet een safe getal zijn",
        })
        .optional(),
    b_lu_n_harvestable: z.coerce
        .number({
            invalid_type_error: "Hoeveelheid moet een getal zijn",
        })
        .positive({
            message: "Hoeveelheid moet positief zijn",
        })
        .finite({
            message: "Hoeveelheid moet een geheel getal zijn",
        })
        .max(1000, {
            message: "Hoeveelheid mag niet groter zijn dan 1000",
        })
        .safe({
            message: "Hoeveelheid moet een safe getal zijn",
        })
        .optional(),
    b_sowing_date: z.coerce.date().optional(),
    b_harvesting_date: z.coerce.date().optional(),
})

export async function loader({ request, params }: LoaderFunctionArgs) {
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw new Error("b_lu_catalogue is required")
    }

    return {
        b_lu_catalogue: b_lu_catalogue,
    }
}

export default function FarmAFieldCultivationBlock() {
    const loaderData = useLoaderData<typeof loader>()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_yield: undefined,
            b_lu_n_harvestable: undefined,
            b_sowing_date: undefined,
            b_harvesting_date: undefined,
        },
    })

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm text-muted-foreground">
                    Werk de opbrengst, stikstofgehalte en zaai- en oogstdatum
                    bij voor dit gewas.
                </p>
            </div>
            <RemixFormProvider {...form}>
                <Form
                    id="formCultivation"
                    onSubmit={form.handleSubmit}
                    method="POST"
                >
                    <fieldset disabled={form.formState.isSubmitting}>
                        <div className="grid w-4/5 lg:grid-cols-2 items-center gap-y-6 gap-x-8">
                            <FormField
                                control={form.control}
                                name="b_lu_yield"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            Opbrengst (droge stof)
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Bv. 37 ton ds / ha"
                                                aria-required="true"
                                                type="number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            In ton droge stof per hectare
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="b_lu_n_harvestable"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stikstofgehalte</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Bv. 4 kg N / ha"
                                                aria-required="true"
                                                type="number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            In geoogst product (kg N / ha)
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="b_sowing_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Zaaidatum</FormLabel>
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
                                                                "yyyy-MM-dd",
                                                            )
                                                        ) : (
                                                            <span>
                                                                Kies een datum
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
                                                    locale={nl}
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date <
                                                        new Date("1970-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            Kan ook poot- of aanplantdatum zijn
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="b_harvesting_date"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Oogstdatum</FormLabel>
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
                                                                "yyyy-MM-dd",
                                                            )
                                                        ) : (
                                                            <span>
                                                                Kies een datum
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
                                                    locale={nl}
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) =>
                                                        date <
                                                        new Date("1970-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                            Kan ook inwerkdatum zijn
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit">
                                {form.formState.isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                        <span>Opslaan...</span>
                                    </div>
                                ) : (
                                    "Opslaan"
                                )}
                            </Button>
                        </div>
                    </fieldset>
                </Form>
            </RemixFormProvider>
        </div>
    )
}

export async function action({ request, params }: ActionFunctionArgs) {
    const b_lu_catalogue = params.b_lu_catalogue
    if (!b_lu_catalogue) {
        throw new Error("b_lu_catalogue is required")
    }
    const b_id_farm = params.b_id_farm
    if (!b_id_farm) {
        throw new Error("b_id_farm is required")
    }

    // Get cultivation id's for this cultivation code
    const cultivationPlan = await getCultivationPlan(fdm, b_id_farm)
    const cultivation = cultivationPlan.find(
        (cultivation) => cultivation.b_lu_catalogue === b_lu_catalogue,
    )
    const b_lu = cultivation.fields.map((field) => field.b_lu)
    const formValues = await extractFormValuesFromRequest(request, FormSchema)
    console.log(formValues)

    // Add cultivation details for each cultivation
    await Promise.all(
        b_lu.map(async (item) => {
            try {
                if (formValues.b_sowing_date) {
                    await updateCultivation(
                        fdm,
                        item,
                        undefined,
                        formValues.b_sowing_date,
                    )
                }
                if (
                    formValues.b_harvesting_date ||
                    formValues.b_lu_yield ||
                    formValues.b_lu_n_harvestable
                ) {
                    await addHarvest(
                        fdm,
                        item,
                        formValues.b_harvesting_date,
                        formValues.b_lu_yield,
                        formValues.b_lu_n_harvestable,
                    )
                }
            } catch (error) {
                console.error(
                    `Failed to process cultivation ${b_lu_catalogue} for farm ${b_id_farm}:`,
                    error,
                )
                throw data(
                    `Failed to process cultivation ${b_lu_catalogue} for farm ${b_id_farm}: ${error.message}`,
                    {
                        status: 500,
                        statusText: `Failed to process cultivation ${b_lu_catalogue} for farm ${b_id_farm}`,
                    },
                )
            }
        }),
    )

    return dataWithSuccess(
        { result: "Data saved successfully" },
        "Gegegevens zijn succesvol opgeslagen! 🎉",
    )
}
