import { zodResolver } from "@hookform/resolvers/zod"
import { Form, useFetcher } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { cn } from "@/app/lib/utils"
import { DatePicker } from "~/components/custom/date-picker"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import { FormSchema } from "./schema"

export function HarvestForm({
    b_lu_yield,
    b_lu_n_harvestable,
    b_lu_harvest_date,
    b_lu_start,
    b_lu_end,
    b_lu_harvestable,
    action,
    handleConfirmation = () => Promise.resolve(true),
}: {
    b_lu_yield: number | undefined
    b_lu_n_harvestable: number | undefined
    b_lu_harvest_date: Date | undefined
    b_lu_start: Date | null | undefined
    b_lu_end: Date | null | undefined
    b_lu_harvestable: "once" | "multiple" | "none" | undefined
    action: string
    handleConfirmation?: (data: z.infer<typeof FormSchema>) => Promise<boolean>
}) {
    const fetcher = useFetcher()

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: async (values, bypass, options) => {
            // Do the validation using Zod
            const validation = await zodResolver(FormSchema)(
                values,
                bypass,
                options,
            )
            // If there are validation errors anyways, just return them
            if (
                validation.errors &&
                Object.keys(validation.errors).length > 0
            ) {
                return validation
            }
            // If submitting, handle the confirmation procedure
            // (it might just return true without a dialog)
            if (
                form.formState.isSubmitting &&
                !(await handleConfirmation(values))
            ) {
                return { values: {}, errors: true }
            }
            return validation
        },
        defaultValues: {
            b_lu_yield: b_lu_yield,
            b_lu_n_harvestable: b_lu_n_harvestable,
            b_lu_harvest_date: b_lu_harvest_date,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
            b_lu_harvestable: b_lu_harvestable,
        },
    })

    const handleDeleteHarvest = () => {
        return fetcher.submit(null, { action: action, method: "DELETE" })
    }

    // Check if this is a new harvest or is has already values
    const isHarvestUpdate =
        b_lu_yield !== undefined ||
        b_lu_n_harvestable !== undefined ||
        b_lu_harvest_date !== undefined

    return (
        <div className="space-y-6">
            <RemixFormProvider {...form}>
                <Form
                    id="formHarvest"
                    onSubmit={form.handleSubmit}
                    method="post"
                    action={action}
                >
                    <fieldset
                        disabled={form.formState.isSubmitting}
                        className="space-y-8"
                    >
                        <div className="grid lg:grid-cols-2 items-center gap-y-6 gap-x-8">
                            <DatePicker
                                form={form}
                                name={"b_lu_harvest_date"}
                                label={"Oogstdatum"}
                                description={""}
                            />
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
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormDescription />
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
                                                placeholder="Bv. 4 g N/kg DS"
                                                aria-required="true"
                                                type="number"
                                                {...field}
                                                value={field.value ?? ""}
                                            />
                                        </FormControl>
                                        <FormDescription>
                                            In geoogst product
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-2 items">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDeleteHarvest}
                                disabled={
                                    form.formState.isSubmitting ||
                                    fetcher.state === "submitting"
                                }
                                className={cn(
                                    "mr-auto",
                                    !isHarvestUpdate ? "invisible" : "",
                                )}
                            >
                                {form.formState.isSubmitting ||
                                fetcher.state === "submitting" ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                    </div>
                                ) : null}
                                Verwijderen
                            </Button>
                            <Button type="submit" className="ml-auto">
                                {form.formState.isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                        <span>Opslaan...</span>
                                    </div>
                                ) : isHarvestUpdate ? (
                                    "Bijwerken"
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
