import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "~/components/ui/dialog"
import { Button } from "~/components/ui/button"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { useEffect, useState } from "react"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { Input } from "~/components/ui/input"
import type { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { FormSchema } from "./schema"
import { Combobox } from "~/components/custom/combobox"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import type { Feature, Polygon } from "geojson"
import { Form } from "react-router"

interface FieldDetailsDialogProps {
    open: boolean
    setOpen: (value: boolean) => void
    field: Feature<Polygon>
    cultivationOptions: { value: string; label: string }[]
    fieldNameDefault: string
}

export default function FieldDetailsDialog({
    open,
    setOpen,
    field,
    cultivationOptions,
    fieldNameDefault,
}: FieldDetailsDialogProps) {
    const b_lu_catalogue = `nl_${field.properties?.b_lu_catalogue ?? ""}`
    const [selectedCultivation, setSelectedCultivation] =
        useState<string>(b_lu_catalogue)

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: fieldNameDefault,
            b_lu_catalogue: selectedCultivation,
        },
        submitData: {
            b_id_source: field.properties?.b_id_source,
            b_geometry: JSON.stringify(field.geometry),
        },
    })

    useEffect(() => {
        form.setValue("b_lu_catalogue", selectedCultivation)
    }, [selectedCultivation, form])

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            form.reset()
        }
    }, [form.formState, form.reset])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <RemixFormProvider {...form}>
                    <Form
                        id="formField"
                        onSubmit={form.handleSubmit}
                        method="post"
                    >
                        <fieldset disabled={form.formState.isSubmitting}>
                            <DialogHeader>
                                <DialogTitle>Nieuw perceel</DialogTitle>
                                <DialogDescription>
                                    Vul de details van dit perceel in
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <FormField
                                    control={form.control}
                                    name="b_name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Naam</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="text"
                                                    required
                                                    disabled={
                                                        form.formState
                                                            .isSubmitting
                                                    }
                                                />
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Combobox
                                    options={cultivationOptions}
                                    name="b_lu_catalogue"
                                    label={
                                        <span>
                                            Hoofdgewas
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </span>
                                    }
                                    defaultValue={selectedCultivation}
                                    disabled={form.formState.isSubmitting}
                                    onChange={setSelectedCultivation}
                                />
                            </div>
                            <DialogFooter>
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? (
                                        <div className="flex items-center space-x-2">
                                            <LoadingSpinner />
                                            <span>Opslaan...</span>
                                        </div>
                                    ) : (
                                        "Opslaan"
                                    )}
                                </Button>
                            </DialogFooter>
                        </fieldset>
                    </Form>
                </RemixFormProvider>
            </DialogContent>
        </Dialog>
    )
}
