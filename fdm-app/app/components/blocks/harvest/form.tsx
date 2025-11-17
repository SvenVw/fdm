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
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldSet,
} from "~/components/ui/field"
import { Controller } from "react-hook-form"
import type { HarvestParameters } from "@svenvw/fdm-core"
import { CircleQuestionMark } from "lucide-react"
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "~/components/ui/collapsible"
import { useState, useEffect } from "react"
import { getHarvestParameterLabel } from "./parameters"

type HarvestFormDialogProps = {
    harvestParameters: HarvestParameters
    b_lu_harvest_date: Date
    b_lu_yield: number | undefined
    b_lu_yield_fresh: number | undefined
    b_lu_yield_bruto: number | undefined
    b_lu_tarra: number | undefined
    b_lu_uww: number | undefined
    b_lu_moist: number | undefined
    b_lu_dm: number | undefined
    b_lu_cp: number | undefined
    b_lu_n_harvestable: number | undefined
    b_lu_harvestable: "once" | "multiple" | "none"
    b_lu_start: Date | undefined | null
    b_lu_end: Date | undefined | null
}

export function HarvestFormDialog({
    harvestParameters,
    b_lu_harvest_date,
    b_lu_yield,
    b_lu_yield_fresh,
    b_lu_yield_bruto,
    b_lu_tarra,
    b_lu_uww,
    b_lu_moist,
    b_lu_dm,
    b_lu_cp,
    b_lu_n_harvestable,
    b_lu_harvestable,
    b_lu_start,
    b_lu_end,
}: HarvestFormDialogProps) {
    const navigate = useNavigate()
    const fetcher = useFetcher()
    const [hostname, setHostname] = useState("")

    useEffect(() => {
        if (typeof window !== "undefined") {
            setHostname(window.location.hostname)
        }
    }, [])

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_harvest_date: b_lu_harvest_date,
            b_lu_yield: harvestParameters.includes("b_lu_yield")
                ? b_lu_yield
                : undefined,
            b_lu_yield_fresh: harvestParameters.includes("b_lu_yield_fresh")
                ? b_lu_yield_fresh
                : undefined,
            b_lu_yield_bruto: harvestParameters.includes("b_lu_yield_bruto")
                ? b_lu_yield_bruto
                : undefined,
            b_lu_tarra: harvestParameters.includes("b_lu_tarra")
                ? b_lu_tarra
                : undefined,
            b_lu_dm: harvestParameters.includes("b_lu_dm")
                ? b_lu_dm
                : undefined,
            b_lu_uww: harvestParameters.includes("b_lu_uww")
                ? b_lu_uww
                : undefined,
            b_lu_moist: harvestParameters.includes("b_lu_moist")
                ? b_lu_moist
                : undefined,
            b_lu_cp: harvestParameters.includes("b_lu_cp")
                ? b_lu_cp
                : undefined,
            b_lu_n_harvestable: harvestParameters.includes("b_lu_n_harvestable")
                ? b_lu_n_harvestable
                : undefined,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
            b_lu_harvestable: b_lu_harvestable,
        },
    })

    const handleDeleteHarvest = () => {
        return fetcher.submit(null, { method: "DELETE" })
    }

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
                    <FieldSet disabled={form.formState.isSubmitting}>
                        <DialogContent className="gap-6">
                            <DialogHeader>
                                <DialogTitle>
                                    {isHarvestUpdate
                                        ? "Oogst bijwerken"
                                        : "Oogst toevoegen"}
                                </DialogTitle>
                                <DialogDescription>
                                    {isHarvestUpdate
                                        ? "Werk de oogst bij van dit gewas. Vul de gegevens in, zodat deze gebruikt kunnen worden in de berekeningen."
                                        : "Voeg een oogst toe aan dit gewas. Vul de gegevens in, zodat deze gebruikt kunnen worden in de berekeningen."}
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
                                            required={true}
                                        />
                                    )}
                                />
                                <Controller
                                    name="b_lu_yield"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
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
                                    name="b_lu_yield_fresh"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
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
                                    name="b_lu_yield_bruto"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
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
                                    name="b_lu_tarra"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {" "}
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 5 %"
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
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
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
                                    name="b_lu_uww"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 350 g / 5 kg"
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
                                    name="b_lu_moist"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 15 %"
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
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
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
                                    name="b_lu_cp"
                                    control={form.control}
                                    render={({ field, fieldState }) => (
                                        <Field
                                            data-invalid={fieldState.invalid}
                                            className={cn(
                                                "gap-1",
                                                harvestParameters.includes(
                                                    field.name,
                                                )
                                                    ? ""
                                                    : "hidden",
                                            )}
                                        >
                                            <FieldLabel>
                                                {getHarvestParameterLabel(
                                                    field.name,
                                                )}
                                            </FieldLabel>
                                            <Input
                                                {...field}
                                                placeholder="Bv. 170 g RE / kg DS"
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
                            <FieldGroup>
                                <Collapsible className="space-y-2">
                                    <CollapsibleTrigger className="flex flex-row gap-1 items-center text-xs text-muted-foreground hover:underline">
                                        <CircleQuestionMark className="h-4" />
                                        <p>
                                            Waarom zie ik deze oogstparameters?
                                        </p>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent className="flex flex-row gap-1 items-center text-xs text-muted-foreground">
                                        <p>
                                            De getoonde oogstparameters zijn
                                            gebaseerd op wat gangbare gegevens
                                            zijn die bekend zijn voor dit gewas
                                            en wat er nodig is om de berekening
                                            voor de stikstofbalans uit te
                                            rekenen. Klopt dit niet? Stuur een
                                            mail naar{" "}
                                            <a
                                                href={`mailto:support@${hostname}`}
                                                className="underline"
                                            >
                                                support@
                                                {hostname}
                                            </a>{" "}
                                            met welke oogstparameters volgens
                                            jou gemeten worden voor dit gewas.
                                            Alvast bedankt!
                                        </p>
                                    </CollapsibleContent>
                                </Collapsible>
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
                                    <Button type="submit" form="formHarvest">
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
