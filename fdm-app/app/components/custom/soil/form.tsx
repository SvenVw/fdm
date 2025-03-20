import type { SoilParameterDescription, getSoilAnalysisType } from "@svenvw/fdm-core"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    FormControl,
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
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { Form } from "react-hook-form"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { LoadingSpinner } from "@/components/custom/loadingspinner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SoilAnalysisForm({
    soilAnalysis,
    soilParameterDescription,
    FormSchema,
    action,
    fetcher,
}: {
    soilAnalysis: getSoilAnalysisType
    soilParameterDescription: SoilParameterDescription
    FormSchema: ReturnType<typeof import("../soil/formschema").generateFormSchema>
    action: string
    fetcher: {
        state: string
        Form: typeof Form
        submit: (data: FormData, options?: { method: string }) => void
    }
}) {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            a_source: soilAnalysis.a_source,
            a_p_al: soilAnalysis.a_p_al,
            a_p_cc: soilAnalysis.a_p_cc,
            a_som_loi: soilAnalysis.a_som_loi,
            b_gwl_class: soilAnalysis.b_gwl_class,
            b_soiltype_agr: soilAnalysis.b_soiltype_agr,
            b_sampling_date: soilAnalysis.b_sampling_date,        },
    })

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset()
        }
    }, [form.formState, form.reset])

    return (
        <RemixFormProvider {...form}>
            <Form
                id="soilAnalysisForm"
                action={action}
                onSubmit={form.handleSubmit}
                method="post"
            >
                <fieldset
                    disabled={
                        form.formState.isSubmitting ||
                        fetcher.state === "submitting"
                    }
                >
                    <div className="space-y-4">
                    <div className="grid grid-cols-2 items-end gap-x-3 space-y-4 justify-between">
                        <FormField
                            control={form.control}
                            name="a_source"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                    {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
                                    </FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="text"
                                            value={
                                                field.value === 0
                                                    ? ""
                                                    : field.value
                                            }
                                            placeholder="Bv. Jansen lab B.V."
                                            aria-required="true"
                                            required
                                        />
                                    </FormControl>
                                    <FormDescription>
                                    {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        }
                                        </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                                control={form.control}
                                name="b_sampling_date"
                                render={({ field }) => (
                                    <FormItem className="">
                                        <FormLabel>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
                                    </FormLabel>
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
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    locale={nl}
                                                    disabled={(date) =>
                                                        date <
                                                        new Date("1970-01-01")
                                                    }
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                        <FormDescription>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        }
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            /> 
                        <FormField
                            control={form.control}
                            name="a_p_al"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
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
                                            placeholder="Bv. 14.5 mg P2O5/kg"
                                            aria-required="true"
                                            required
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {`${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        } [${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).unit
                                        }]`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="a_p_cc"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
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
                                            placeholder="Bv. 1.2 mg P/kg"
                                            aria-required="true"
                                            required
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {`${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        } [${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).unit
                                        }]`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="a_som_loi"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
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
                                            placeholder="Bv. 3.7%"
                                            aria-required="true"
                                            required
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        {`${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        } [${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).unit
                                        }]`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="b_soiltype_agr"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
                                    </FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecteer bodemtype" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {soilParameterDescription.find(
                                                    (x) =>
                                                        x.parameter === field.name,
                                                ).options.map((option) => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        {`${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        }`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="b_gwl_class"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).name
                                        }
                                    </FormLabel>
                                    <FormControl>
                                        <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                        >
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecteer bodemtype" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {soilParameterDescription.find(
                                                    (x) =>
                                                        x.parameter === field.name,
                                                ).options.map((option) => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    </FormControl>
                                    <FormDescription>
                                        {`${
                                            soilParameterDescription.find(
                                                (x) =>
                                                    x.parameter === field.name,
                                            ).description
                                        }`}
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                    <div>
                        <div className="justify-end items-end">
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
                    </div>
                    </div>                  
                </fieldset>
            </Form>
        </RemixFormProvider>
    )
}
