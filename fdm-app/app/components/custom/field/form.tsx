import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { useEffect } from "react"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import type { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form } from "react-router"
import { FormSchema } from "./schema"
import { Combobox } from "../combobox"
import { LoadingSpinner } from "@/components/custom/loadingspinner"

interface FieldDetailsDialogProps {
    open: boolean
    setOpen: (value: boolean) => void
    field: any
    cultivationOptions: any
    fieldNameDefault: string
}

export default function FieldDetailsDialog({
    open,
    setOpen,
    field,
    cultivationOptions,
    fieldNameDefault,
}: FieldDetailsDialogProps) {
    const b_geojson = JSON.stringify(field.geometry)
    const b_lu_catalogue = `nl_${field.properties.b_lu_catalogue}`

    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: fieldNameDefault,
            b_lu_catalogue: b_lu_catalogue,
            b_id_source: field.properties.b_id_source,
            b_geometry: b_geojson,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: fieldNameDefault,
            b_lu_catalogue: b_lu_catalogue,
            b_id_source: field.properties.b_id_source,
            b_geometry: b_geojson,
        })
    }, [form, field, fieldNameDefault, b_lu_catalogue, b_geojson])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <RemixFormProvider {...form}>
                    <Form id="formField" method="post" onSubmit={form.handleSubmit}> 
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
                                                    disabled={form.formState.isSubmitting}
                                                />
                                            </FormControl>
                                            <FormDescription />
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Combobox
                                    options={cultivationOptions}
                                    form={form}
                                    name="b_lu_catalogue"
                                    label={
                                        <span>
                                            Hoofdgewas
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </span>
                                    }
                                    disabled={form.formState.isSubmitting}
                                />
                                <FormField
                                    control={form.control}
                                    name="b_id_source"
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="hidden"
                                            required
                                            disabled={form.formState.isSubmitting}
                                        />
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="b_geometry"
                                    render={({ field }) => (
                                        <Input
                                            {...field}
                                            type="hidden"
                                            required
                                            disabled={form.formState.isSubmitting} 
                                        />
                                    )}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
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
