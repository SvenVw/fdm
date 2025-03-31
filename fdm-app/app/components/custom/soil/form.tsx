import type { SoilParameterDescription } from "@svenvw/fdm-core"
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
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { Form } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { LoadingSpinner } from "@/components/custom/loadingspinner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { FormSchema } from "./formschema"
import type { SoilAnalysis } from "./types"
import { get } from "react-hook-form"

export function SoilAnalysisForm(props: {
    soilAnalysis: SoilAnalysis | undefined
    soilParameterDescription: SoilParameterDescription
    action: string
}) {
    const { soilAnalysis, soilParameterDescription, action } = props
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            a_source: soilAnalysis?.a_source ? soilAnalysis.a_source : "",
            a_p_al: soilAnalysis?.a_p_al ? soilAnalysis.a_p_al : undefined,
            a_p_cc: soilAnalysis?.a_p_cc ? soilAnalysis.a_p_cc : undefined,
            a_som_loi: soilAnalysis?.a_som_loi
                ? soilAnalysis.a_som_loi
                : undefined,
            b_gwl_class: soilAnalysis?.b_gwl_class
                ? soilAnalysis.b_gwl_class
                : undefined,
            b_soiltype_agr: soilAnalysis?.b_soiltype_agr
                ? soilAnalysis.b_soiltype_agr
                : undefined,
            b_sampling_date: soilAnalysis?.b_sampling_date
                ? new Date(soilAnalysis.b_sampling_date)
                : undefined,
        },
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
                <fieldset disabled={form.formState.isSubmitting}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 items-end gap-x-3 space-y-4 justify-between">
                            <FormField
                                control={form.control}
                                name="a_source"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                value={field.value}
                                                placeholder="Bv. Jansen lab B.V."
                                                aria-required="true"
                                                required
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )}
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
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
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
                                            {getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )}
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
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                value={field.value}
                                                placeholder="Bv. 14.5 mg P2O5 / 100 g"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {`${getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )} [${getParameterUnit(
                                                soilParameterDescription,
                                                field.name,
                                            )}]`}
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
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                value={field.value}
                                                placeholder="Bv. 1.2 mg P/kg"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {`${getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )} [${getParameterUnit(
                                                soilParameterDescription,
                                                field.name,
                                            )}]`}
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
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="number"
                                                value={field.value}
                                                placeholder="Bv. 3.7%"
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            {`${getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                             [${getParameterUnit(
                                                 soilParameterDescription,
                                                 field.name,
                                             )}]`}
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
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger {...field}>
                                                <SelectValue placeholder="Selecteer bodemtype" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {soilParameterDescription
                                                    .find(
                                                        (x) =>
                                                            x.parameter ===
                                                            field.name,
                                                    )
                                                    ?.options?.map((option) => (
                                                        <SelectItem
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </SelectItem>
                                                    )) || null}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )}
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
                                            {getParameterName(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormLabel>
                                        <Select
                                            onValueChange={field.onChange}
                                            value={field.value}
                                        >
                                            <SelectTrigger {...field}>
                                                <SelectValue placeholder="Selecteer bodemtype" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {soilParameterDescription
                                                    .find(
                                                        (x) =>
                                                            x.parameter ===
                                                            field.name,
                                                    )
                                                    ?.options?.map((option) => (
                                                        <SelectItem
                                                            key={option}
                                                            value={option}
                                                        >
                                                            {option}
                                                        </SelectItem>
                                                    )) || null}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {getParameterDescription(
                                                soilParameterDescription,
                                                field.name,
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="flex justify-end mt-4">
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
                </fieldset>
            </Form>
        </RemixFormProvider>
    )
}
function getParameterName(
    soilParameterDescription: SoilParameterDescription[],
    parameter: string,
) {
    return (
        soilParameterDescription.find((x) => x.parameter === parameter)?.name ||
        parameter
    )
}

function getParameterDescription(
    soilParameterDescription: SoilParameterDescription[],
    parameter: string,
) {
    return (
        soilParameterDescription.find((x) => x.parameter === parameter)
            ?.description || ""
    )
}

function getParameterUnit(
    soilParameterDescription: SoilParameterDescription[],
    parameter: string,
) {
    return (
        soilParameterDescription.find((x) => x.parameter === parameter)?.unit ||
        ""
    )
}
