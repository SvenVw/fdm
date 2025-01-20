import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { Form, useFetcher } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { Combobox } from "@/components/custom/combobox"
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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { LoadingSpinner } from "./loadingspinner"

export const FormSchema = z
    .object({
        b_lu_catalogue: z.string({
            required_error: "Gewas is verplicht",
        }),
        b_sowing_date: z.coerce.date({
            required_error: "Datum is verplicht",
            invalid_type_error: "Datum is ongeldig",
        }),
        b_harvest_date: z.coerce
            .date({
                required_error: "Datum is verplicht",
            })
            .optional(),
    })
    .refine((data) => {
        if (data.b_harvest_date) {
            return data.b_harvest_date >= data.b_sowing_date
        }
        return true
    }, "Oogstdatum moet na zaaidatum zijn")
interface Cultivation {
    b_lu: string
    b_lus: string[] | null
    b_lu_catalogue: string
    b_lu_name: string
    b_sowing_date: Date
    b_harvest_date: Date | null
}

interface cultivationOption {
    value: string
    label: string
}

interface CultivationsFormProps {
    cultivations: Cultivation[]
    options: cultivationOption[]
    defaultValue?: string
    action: string
}

export function CultivationsForm(props: CultivationsFormProps) {
    const fetcher = useFetcher()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_sowing_date: new Date(new Date().getFullYear(), 0, 1),
            b_harvest_date: undefined,
        },
    })

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset()
        }
    }, [form.formState, form.reset])

    const handleDelete = (b_lu: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ b_lu }, { method: "delete", action: props.action })
    }

    return (
        <div>
            <RemixFormProvider {...form}>
                <Form
                    id="formAddCultivation"
                    action={props.action}
                    onSubmit={form.handleSubmit}
                    method="POST"
                >
                    <fieldset disabled={form.formState.isSubmitting}>
                        <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                            <div className="col-span-2">
                                <Combobox
                                    options={props.options}
                                    form={form}
                                    name="b_lu_catalogue"
                                    label={
                                        <span>
                                            Gewas
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </span>
                                    }
                                />
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name="b_sowing_date"
                                    render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Zaaidatum</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full text-left font-normal",
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
                                                        // disabled={(date) =>
                                                        //     date > new Date() || date < new Date("1900-01-01")
                                                        // }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <div>
                                <FormField
                                    control={form.control}
                                    name="b_harvest_date"
                                    render={({ field }) => (
                                        <FormItem className="">
                                            <FormLabel>Einddatum</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button
                                                            variant={"outline"}
                                                            className={cn(
                                                                "w-full text-left font-normal",
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
                                                        // disabled={(date) =>
                                                        //     date > new Date() || date < new Date("1900-01-01")
                                                        // }
                                                        initialFocus
                                                    />
                                                </PopoverContent>
                                            </Popover>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="justify-self-end">
                                <Button type="submit">
                                    {form.formState.isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            <LoadingSpinner />
                                            <span>Opslaan...</span>
                                        </div>
                                    ) : (
                                        "Voeg toe"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </fieldset>
                </Form>
            </RemixFormProvider>
            <div>
                <Separator className="my-4" />
                <div className="space-y-4">
                    {/* <div className="text-sm font-medium">Meststoffen</div> */}
                    <div className="grid gap-6">
                        {props.cultivations.map((cultivation) => (
                            <div
                                className="grid grid-cols-5 gap-x-3 items-center"
                                key={cultivation.b_lu}
                            >
                                <div className="col-span-2">
                                    <p className="text-sm font-medium leading-none">
                                        {cultivation.b_lu_name}
                                    </p>
                                    {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                </div>
                                <div>
                                    <p className="text-sm font-light leading-none">
                                        {format(
                                            cultivation.b_sowing_date,
                                            "yyyy-MM-dd",
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-light leading-none">
                                        {cultivation.b_harvest_date
                                            ? format(
                                                  cultivation.b_harvest_date,
                                                  "yyyy-MM-dd",
                                              )
                                            : "Nog niet geoogst"}
                                    </p>
                                </div>
                                <div className="justify-self-end">
                                    <Button
                                        variant="destructive"
                                        disabled={
                                            fetcher.state === "submitting"
                                        }
                                        onClick={() => {
                                            if (cultivation.b_lus) {
                                                handleDelete(cultivation.b_lus)
                                            } else {
                                                handleDelete([cultivation.b_lu])
                                            }
                                        }}
                                    >
                                        {fetcher.state === "submitting" ? (
                                            <div className="flex items-center space-x-2">
                                                <LoadingSpinner />
                                                <span>Verwijderen...</span>
                                            </div>
                                        ) : (
                                            "Verwijder"
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}
