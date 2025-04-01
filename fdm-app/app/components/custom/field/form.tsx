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

interface FieldDetailsDialogProps {
    open: boolean
    setOpen: (value: boolean) => void
    field: any
    onFieldAdded: () => void
}

export default function FieldDetailsDialog({
    open,
    setOpen,
    field,
    onFieldAdded,
}: FieldDetailsDialogProps) {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_name: `Perceel`,
            b_area: field.properties.b_area,
        },
    })

    useEffect(() => {
        form.reset({
            b_name: `Perceel`,
            b_area: field.properties.b_area,
        })
    }, [form, field])

    const handleSubmit = async (values: any) => {
        //todo: add the field to database with b_id_source, b_geometry and other props
        console.log(values, field)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <RemixFormProvider {...form}>
                    <Form
                        id="formField"
                        // onSubmit={form.handleSubmit(handleSubmit)}
                        method="post"
                    >
                        <DialogHeader>
                            <DialogTitle>Perceel</DialogTitle>
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
                                            />
                                        </FormControl>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="b_area"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Oppervlak (ha)</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="text"
                                                required
                                            />
                                        </FormControl>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="submit" onClick={onFieldAdded}>
                                Opslaan
                            </Button>
                        </DialogFooter>
                    </Form>
                </RemixFormProvider>
            </DialogContent>
        </Dialog>
    )
}
