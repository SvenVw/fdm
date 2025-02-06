import { useState } from "react"
import { Form, useNavigation } from "react-router"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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

const FormSchema = z.object({
    b_lu_catalogue: z.coerce.string(),
    b_lu_yield: z.coerce.number(),
    b_lu_n_harvestable: z.coerce.number(),
    b_sowing_date: z.coerce.date(),
    b_harvesting_date: z.coerce.date(),
})

export default function Index(props: { action: string | undefined }) {
    const navigation = useNavigation()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_catalogue: "nl_265",
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
                                                                "PPP",
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
                                                                "PPP",
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
