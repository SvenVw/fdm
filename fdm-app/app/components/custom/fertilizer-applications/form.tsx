import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import { CalendarIcon } from "lucide-react"
import { useEffect } from "react"
import { Form } from "react-hook-form"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
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
import { cn } from "~/lib/utils"
import { Combobox } from "../combobox"
import { LoadingSpinner } from "../loadingspinner"
import { FormSchema } from "./formschema"
import type { FertilizerOption } from "./types.d"

export function FertilizerApplicationForm({
    options,
    action,
    fetcher,
}: {
    options: FertilizerOption[]
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
            p_app_amount: undefined,
            p_app_date: new Date(),
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
                id="formAddFertilizerApplication"
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
                    <div className="grid grid-cols-1 xl2:grid-cols-5 items-end gap-x-3 justify-between">
                        <div className="col-span-2">
                            {/* <Label htmlFor="b_name_farm">Meststof</Label> */}
                            <Combobox
                                options={options}
                                form={form}
                                name="p_id"
                                label={
                                    <span>
                                        Meststof
                                        <span className="text-red-500">*</span>
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
                                                placeholder="12500 kg/ha"
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
                        <div className="justify-end items-end">
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
    )
}
