import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect } from "react"
import { Form } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import type { z } from "zod"
import { Combobox } from "~/components/custom/combobox"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import { FormSchema } from "./schema"
import type { CultivationsFormProps } from "./types"
import { DatePicker } from "~/components/custom/date-picker"

export function CultivationForm({
    b_lu_catalogue,
    b_lu_start,
    b_lu_end,
    options,
    action,
}: CultivationsFormProps) {
    const form = useRemixForm<z.infer<typeof FormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(FormSchema),
        defaultValues: {
            b_lu_catalogue: b_lu_catalogue,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
        },
    })

    useEffect(() => {
        form.reset({
            b_lu_catalogue: b_lu_catalogue,
            b_lu_start: b_lu_start,
            b_lu_end: b_lu_end,
        })
    }, [form.reset, b_lu_catalogue, b_lu_start, b_lu_end])

    return (
        <RemixFormProvider {...form}>
            <Form
                id="formCultivation"
                action={action}
                onSubmit={form.handleSubmit}
                method="POST"
            >
                <fieldset disabled={form.formState.isSubmitting}>
                    <div className="grid grid-cols-5 items-end gap-x-3 justify-between">
                        <div className="col-span-2">
                            <Combobox
                                options={options}
                                form={form}
                                name="b_lu_catalogue"
                                label={
                                    <span>
                                        Gewas
                                        <span className="text-red-500">*</span>
                                    </span>
                                }
                                disabled={!!b_lu_catalogue}
                            />
                        </div>
                        <div>
                            <DatePicker
                                form={form}
                                name={"b_lu_start"}
                                label={"Zaaidatum"}
                                description={""}
                            />
                        </div>
                        <div>
                            <DatePicker
                                form={form}
                                name={"b_lu_end"}
                                label={"Einddatum"}
                                description={""}
                            />
                        </div>
                        <div className="justify-self-end">
                            <Button type="submit">
                                {form.formState.isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                        <span>Opslaan...</span>
                                    </div>
                                ) : b_lu_catalogue ? (
                                    "Bijwerken"
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
