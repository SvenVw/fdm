import { Button } from "@/components/ui/button"
import { Form } from "react-hook-form"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { LoadingSpinner } from "../loadingspinner"
import { CalendarIcon } from "lucide-react"
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
import { Calendar } from "@/components/ui/calendar"
import { zodResolver } from "@hookform/resolvers/zod"
import type { z } from "zod"
import { useEffect } from "react"
import { FormSchema } from "./formschema"
import { Combobox } from "../combobox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import type { FertilizerOption } from "./types.d"

export function FertilizerApplicationForm({
    options,
    action,
    fetcher,
}: { 
    options: FertilizerOption[]; 
    action: string; 
    fetcher: { state: string; Form: typeof Form; submit: (data: FormData, options?: { method: string }) => void }
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
