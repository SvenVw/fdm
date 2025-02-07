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
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
// Components
import { CalendarIcon, Check, Cross, Lightbulb, Scale, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useEffect } from "react"
import { LoadingSpinner } from "./loadingspinner"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip"

export const FormSchema = z.object({
    p_app_amount: z.coerce
        .number({
            required_error: "Hoeveelheid is verplicht",
            invalid_type_error: "Hoeveelheid moet een getal zijn",
        })
        .positive({
            message: "Hoeveelheid moet positief zijn",
        })
        .finite({
            message: "Hoeveelheid moet een geheel getal zijn",
        })
        .safe({
            message: "Hoeveelheid moet een safe getal zijn",
        }),
    p_app_date: z.coerce.date({
        required_error: "Datum is verplicht",
        invalid_type_error: "Datum is ongeldig",
    }),
    p_id: z.coerce.string({
        // TODO: Validate against the options that are available
        required_error: "Keuze van meststof is verplicht",
        invalid_type_error: "Meststof is ongeldig",
    }),
})
interface FertilizerApplication {
    p_app_id: string
    p_app_ids: string[]
    p_name_nl: string
    p_app_amount: number
    p_app_date: Date
}

interface FertilizerOption {
    value: string
    label: string
}

interface FertilizerApplicationsFormProps {
    fertilizerApplications: FertilizerApplication[]
    options: FertilizerOption[]
    defaultValue?: string
    action: string
}

export function FertilizerApplicationsForm(
    props: FertilizerApplicationsFormProps,
) {
    const fetcher = useFetcher()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            p_app_amount: undefined,
            p_app_date: new Date(),
        },
    })

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset()
        }
    }, [form.formState, form.reset])

    const handleDelete = (p_app_id: string | string[]) => {
        if (fetcher.state === "submitting") return

        fetcher.submit({ p_app_id }, { method: "delete", action: props.action })
    }

    return (
        <div className="grid md:grid-cols-2 gap-8 space-x-16">
            <div>
                <RemixFormProvider {...form}>
                    <Form
                        id="formAddFertilizerApplication"
                        action={props.action}
                        onSubmit={form.handleSubmit}
                        method="POST"
                    >
                        <fieldset disabled={form.formState.isSubmitting}>
                            <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                                <div className="col-span-2">
                                    {/* <Label htmlFor="b_name_farm">Meststof</Label> */}
                                    <Combobox
                                        options={props.options}
                                        form={form}
                                        name="p_id"
                                        label={
                                            <span>
                                                Meststof
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
                                        name="p_app_amount"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>
                                                    Hoeveelheid
                                                    <span className="text-red-500">
                                                        *
                                                    </span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        type="number"
                                                        value={
                                                            field.value === 0
                                                                ? ""
                                                                : field.value
                                                        }
                                                        placeholder="12 ton/ha"
                                                        aria-required="true"
                                                        required
                                                    />
                                                </FormControl>
                                                <FormDescription />
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div>
                                    <FormField
                                        control={form.control}
                                        name="p_app_date"
                                        render={({ field }) => (
                                            <FormItem className="">
                                                <FormLabel>Datum</FormLabel>
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <FormControl>
                                                            <Button
                                                                variant={
                                                                    "outline"
                                                                }
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
                                                            selected={
                                                                field.value
                                                            }
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
                            {props.fertilizerApplications.map((application) => (
                                <div
                                    className="grid grid-cols-5 gap-x-3 items-center"
                                    key={application.p_app_id}
                                >
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium leading-none">
                                            {application.p_name_nl}
                                        </p>
                                        {/* <p className="text-sm text-muted-foreground">m@example.com</p> */}
                                    </div>
                                    <div>
                                        <p className="text-sm font-light leading-none">
                                            {application.p_app_amount} ton / ha
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-light leading-none">
                                            {format(
                                                application.p_app_date,
                                                "yyyy-MM-dd",
                                            )}
                                        </p>
                                    </div>
                                    <div className="justify-self-end">
                                        <Button
                                            variant="destructive"
                                            disabled={
                                                fetcher.state === "submitting"
                                            }
                                            onClick={() => {
                                                if (application.p_app_ids) {
                                                    handleDelete(
                                                        application.p_app_ids,
                                                    )
                                                } else {
                                                    handleDelete([
                                                        application.p_app_id,
                                                    ])
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
            <div className="space-y-4">
                {/* <div>
                    <h3 className="text-lg font-medium">Giften</h3>
                    <p className="text-sm text-muted-foreground">
                        Hier ziet u hoeveel van elke nutrient geeft per hectare.
                    </p>
                </div> */}
                {/* <Separator /> */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Stikstof totaal
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                Ntot
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">230 kg N</div>
                            <div className="grid grid-cols-2 items-center justify-center space-x-2">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <p className="text-xs text-muted-foreground">
                                                <span>
                                                    <Scale /> 210 kg N
                                                </span>
                                            </p>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            Gebruiksnormen voor stikstof
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Stikstof, werkzaam
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">Nw</p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">150 kg N</div>
                            <p className="text-xs text-muted-foreground">
                                Nog 20 kg gebruiksruimte
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Fosfaat
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                                P2O5
                            </p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">52 kg / ha</div>
                            {/* <p className="text-xs text-muted-foreground">
                                Nog 10 kg gwebruiksruimte
                            </p> */}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Organische stof
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">EOS</p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                873 kg / ha
                            </div>
                            <p className="text-xs text-muted-foreground"></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Organische stof
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">EOS</p>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                873 kg / ha
                            </div>
                            <p className="text-xs text-muted-foreground"></p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
