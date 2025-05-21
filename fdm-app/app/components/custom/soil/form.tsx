import { zodResolver } from "@hookform/resolvers/zod"
import { SoilParameterDescription } from "@svenvw/fdm-core"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { Form } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { FormSchema } from "~/components/custom/soil/formschema"
import type { SoilAnalysis } from "~/components/custom/soil/types"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { cn } from "~/lib/utils"

export function SoilAnalysisForm(props: {
    soilAnalysis: SoilAnalysis | undefined
    soilParameterDescription: SoilParameterDescription
    action: string
}) {
    const { soilAnalysis, soilParameterDescription, action } = props

    const defaultValues = soilParameterDescription.map((x) => {
        let defaultValue = soilAnalysis
            ? soilAnalysis[x.parameter as keyof SoilAnalysis]
            : undefined

        if (defaultValue === undefined && x.type === "string") {
            defaultValue = ""
        }

        return {
            [x.parameter]: defaultValue,
        }
    })
    defaultValues.a_id = undefined

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: defaultValues,
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
                            {soilParameterDescription.map((x) => {
                                if (x.parameter === "a_id") {
                                    return null
                                }
                                if (x.type === "numeric") {
                                    return (
                                        <FormField
                                            control={form.control}
                                            name={x.parameter}
                                            key={x.parameter}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {x.name}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="number"
                                                            value={field.value}
                                                            placeholder=""
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {`${x.description} [${x.unit}]`}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )
                                }

                                if (x.type === "enum") {
                                    return (
                                        <FormField
                                            control={form.control}
                                            name={x.parameter}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {x.name}
                                                    </FormLabel>
                                                    <Select
                                                        onValueChange={
                                                            field.onChange
                                                        }
                                                        value={field.value}
                                                    >
                                                        <SelectTrigger
                                                            {...field}
                                                        >
                                                            <SelectValue placeholder="" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {x.options?.map(
                                                                (option: {
                                                                    value: string
                                                                    label: string
                                                                }) => {
                                                                    if (
                                                                        option.value ===
                                                                        "nl-other-nmi"
                                                                    ) {
                                                                        return null
                                                                    }
                                                                    return (
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
                                                                    )
                                                                },
                                                            ) || null}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormDescription>
                                                        {x.description}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )
                                }

                                if (x.type === "date") {
                                    return (
                                        <FormField
                                            control={form.control}
                                            name={x.parameter}
                                            render={({ field }) => (
                                                <FormItem className="">
                                                    <FormLabel>
                                                        {x.name}
                                                    </FormLabel>
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
                                                                            Kies
                                                                            een
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
                                                                locale={nl}
                                                                disabled={(
                                                                    date,
                                                                ) =>
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
                                                        {x.description}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )
                                }

                                if (x.type === "text") {
                                    return (
                                        <FormField
                                            control={form.control}
                                            name={x.parameter}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>
                                                        {x.name}
                                                    </FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            {...field}
                                                            type="text"
                                                            value={field.value}
                                                            placeholder=""
                                                            aria-required="true"
                                                            required
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        {x.description}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )
                                }
                            })}
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
