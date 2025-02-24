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
import { cn } from "@/lib/utils"
import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns/format"
import { nl } from "date-fns/locale/nl"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { Form } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { Combobox } from "../combobox"
import { LoadingSpinner } from "../loadingspinner"
import { FormSchema } from "./schema"
import type { CultivationsFormProps } from "./types"

export function CultivationForm({
    b_lu_catalogue,
    b_sowing_date,
    b_terminating_date,
    options,
    action,
}: CultivationsFormProps) {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_catalogue: b_lu_catalogue,
            b_sowing_date: b_sowing_date,
            b_terminating_date: b_terminating_date,
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
                id="formCultivation"
                action={action}
                onSubmit={form.handleSubmit}
                method="POST"
            >
                <fieldset disabled={form.formState.isSubmitting}>
                    <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                        <div className="col-span-2">
                            <Combobox
                                options={options}
                                form={form}
                                name="b_lu_catalogue"
                                label={
                                    <span>
                                        Gewas
                                        <span className="text-red-500">*</span>
                                    </span>
                                }
                                disabled={!!b_lu_catalogue}
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
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <FormField
                                control={form.control}
                                name="b_terminating_date"
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
                                ) : b_lu_catalogue ? (
                                    "Bijwerken"
                                ) : (
                                    "Voeg toe"
                                )}
                            </Button>
                        </div>
                    </div>
                </fieldset>
            </Form>
        </RemixFormProvider>
    )
}
