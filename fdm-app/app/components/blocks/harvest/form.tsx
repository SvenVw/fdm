import { zodResolver } from "@hookform/resolvers/zod"
import { format } from "date-fns/format"
import { nl } from "date-fns/locale/nl"
import { CalendarIcon } from "lucide-react"
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
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { FormSchema } from "./schema"

export function HarvestForm({
    b_lu_yield,
    b_lu_n_harvestable,
    b_lu_harvest_date,
}: {
    b_lu_yield: number | undefined
    b_lu_n_harvestable: number | undefined
    b_lu_harvest_date: Date | undefined
}) {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_yield: b_lu_yield,
            b_lu_n_harvestable: b_lu_n_harvestable,
            b_lu_harvest_date: b_lu_harvest_date,
        },
    })

    // Currently updateHarvest function is not available, therefore check if this is a new harvest or is has already values
    const isHarvestUpdate =
        b_lu_yield !== undefined ||
        b_lu_n_harvestable !== undefined ||
        b_lu_harvest_date !== undefined

    return (
        <div className="space-y-6">
            {/* <div>
                <p className="text-sm text-muted-foreground">
                    Werk de opbrengst, stikstofgehalte en zaai- en oogstdatum
                    bij voor dit gewas.
                </p>
            </div> */}
            <RemixFormProvider {...form}>
                <Form
                    id="formCultivation"
                    onSubmit={form.handleSubmit}
                    method="post"
                >
                    <fieldset
                        disabled={
                            form.formState.isSubmitting || isHarvestUpdate
                        }
                        className="space-y-8"
                    >
                        <div className="grid w-4/5 lg:grid-cols-2 items-center gap-y-6 gap-x-8">
                            <FormField
                                control={form.control}
                                name="b_lu_yield"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Opbrengst</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="Bv. 37500 kg ds / ha"
                                                aria-required="true"
                                                type="number"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            In kg droge stof per hectare
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
                            {/* <FormField
                                control={form.control}
                                name="b_lu_start"                    
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
                            /> */}
                            <FormField
                                control={form.control}
                                name="b_lu_harvest_date"
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
                        </div>
                        <div>
                            <Button type="submit">
                                {form.formState.isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                        <span>Toevoegen...</span>
                                    </div>
                                ) : (
                                    "Toevoegen"
                                )}
                            </Button>
                        </div>
                    </fieldset>
                </Form>
            </RemixFormProvider>
        </div>
    )
}
