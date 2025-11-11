import { zodResolver } from "@hookform/resolvers/zod"
import { Form, useFetcher, useNavigate } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { cn } from "@/app/lib/utils"
import { DatePicker } from "~/components/custom/date-picker-v2"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import { FormSchema } from "./schema"
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import {
    Field,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSeparator,
    FieldSet,
} from "~/components/ui/field"
import { Controller } from "react-hook-form"
import { useEffect, useState } from "react"

type HarvestFormDialogProps = {
    b_lu_harvest_date: Date | undefined
    b_lu_yield_fresh: number | undefined
    b_lu_dm: number | undefined
    b_lu_n_harvestable: number | undefined
    b_lu_harvestable: "once" | "multiple" | "none" | undefined
    b_lu_start: Date | undefined | null
    b_lu_end: Date | undefined | null
}

export function HarvestFormDialog({
    b_lu_harvest_date,
    b_lu_yield_fresh,
    b_lu_dm,
    b_lu_n_harvestable,
    b_lu_harvestable,
    b_lu_start,
    b_lu_end,
}: HarvestFormDialogProps) {
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const [yieldDryMatter, setYieldDryMatter] = useState<number | undefined>(
        undefined,
    )
    const [nitrogenUptake, setNitrogenUptake] = useState<number | undefined>(
        undefined,
    )

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_harvest_date: b_lu_harvest_date,
            b_lu_yield_fresh: b_lu_yield_fresh,
            b_lu_dm: b_lu_dm,
            b_lu_n_harvestable: b_lu_n_harvestable,
            // b_lu_yield_bruto: b_lu_yield_bruto,
            // b_lu_yield_uvw: b_lu_yield_uvw,
            // b_lu_n_harvestable: b_lu_n_harvestable,,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
            b_lu_harvestable: b_lu_harvestable,
        },
    })

    const handleDeleteHarvest = () => {
        return fetcher.submit(null, { method: "DELETE" })
    }

    // Calculate dry matter yield
    useEffect(() => {
        if (form.getValues("b_lu_yield_fresh") && form.getValues("b_lu_dm")) {
            const b_lu_yield_fresh = Number(form.getValues("b_lu_yield_fresh"))
            const b_lu_dm = Number(form.getValues("b_lu_dm"))
            const b_lu_yield = Math.round(b_lu_yield_fresh * (b_lu_dm / 1000))
            setYieldDryMatter(b_lu_yield)
        } else {
            setYieldDryMatter(undefined)
        }
    }, [form.getValues("b_lu_yield_fresh"), form.getValues("b_lu_dm")])

    // Calculate nitrogen uptake
    useEffect(() => {
        if (yieldDryMatter && form.getValues("b_lu_n_harvestable")) {
            const b_lu_n_harvestable = Number(form.getValues("b_lu_n_harvestable"))
            const nitrogenUptake = Math.round(yieldDryMatter * b_lu_n_harvestable  / 1000)
            setNitrogenUptake(nitrogenUptake)
        } else {
            setNitrogenUptake(undefined)
        }
    }, [yieldDryMatter, form.getValues("b_lu_n_harvestable")])

    // Check if this is a new harvest or is has already values
    const isHarvestUpdate = b_lu_harvest_date !== undefined

    return (
        <Dialog open={true} onOpenChange={() => navigate("..")}>
            <RemixFormProvider {...form}>
                <Form
                    id="formHarvest"
                    onSubmit={form.handleSubmit}
                    method="post"
                >
                    <FieldSet
                        disabled={form.formState.isSubmitting}
                        // className="flex flex-col items-center"
                    >
                        <DialogContent className="gap-6">
                            <DialogHeader>
                                <DialogTitle>Oogst toevoegen</DialogTitle>
                                <DialogDescription>
                                    Voeg een oogst toe aan dit gewas. Vul de
                                    gegevens in, zodat deze gebruikt kunnen
                                    worden in de berekeningen.
                                </DialogDescription>
                            </DialogHeader>

                            <FieldGroup className="gap-5">
                                <Controller
                                    name="b_lu_harvest_date"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <DatePicker
                                            label="Oogstdatum"
                                            defaultValue={b_lu_harvest_date}
                                            field={field}
                                            fieldState={fieldState}
                                        />
                                    )}
                                />
                                <Controller
                                    name="b_lu_yield_fresh"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="gap-1"
                                        >
                                            <FieldLabel>
                                                Opbrengst (kg versproduct / ha)
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 37500 kg / ha"
                                                aria-required="true"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                type="number"
                                                value={field.value ?? ""}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="b_lu_dm"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="gap-1"
                                        >
                                            <FieldLabel>
                                                Droge stofgehalte (g DS / kg
                                                versproduct)
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 850 g / kg"
                                                aria-required="true"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                type="number"
                                                value={field.value ?? ""}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                                <Controller
                                    name="b_lu_n_harvestable"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className="gap-1"
                                        >
                                            <FieldLabel>
                                                Stiktstofgehalte (g N / kg DS)
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 850 g / kg"
                                                aria-required="true"
                                                aria-invalid={
                                                    fieldState.invalid
                                                }
                                                type="number"
                                                value={field.value ?? ""}
                                            />
                                            {fieldState.invalid && (
                                                <FieldError
                                                    errors={[fieldState.error]}
                                                />
                                            )}
                                        </Field>
                                    )}
                                />
                            </FieldGroup>
                            <FieldSeparator />
                            <FieldGroup className="gap-1">
                                <Field orientation="horizontal">
                                    <FieldLabel>Droge stofopbrengst</FieldLabel>
                                    <p className="text-muted-foreground text-sm">
                                        {yieldDryMatter
                                            ? yieldDryMatter?.toLocaleString()
                                            : "-"}{" "}
                                        kg DS / ha
                                    </p>
                                </Field>
                                <Field orientation="horizontal">
                                    <FieldLabel>Stikstofafvoer</FieldLabel>
                                    <p className="text-muted-foreground text-sm">
                                        {nitrogenUptake
                                            ? nitrogenUptake?.toLocaleString()
                                            : "-"}{" "}
                                        kg N / ha
                                    </p>
                                </Field>
                            </FieldGroup>
                            <DialogFooter>
                                <Field orientation="horizontal">
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
                                    <DialogClose asChild>
                                        <Button variant="outline">
                                            Sluiten
                                        </Button>
                                    </DialogClose>
                                    <Button type="submit" className="">
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
                                </Field>
                            </DialogFooter>
                        </DialogContent>
                    </FieldSet>
                </Form>
            </RemixFormProvider>
        </Dialog>
    )
}
