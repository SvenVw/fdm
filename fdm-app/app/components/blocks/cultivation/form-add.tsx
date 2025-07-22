import { zodResolver } from "@hookform/resolvers/zod"
import { Form} from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { Combobox } from "~/components/custom/combobox"
import { DatePicker } from "~/components/custom/date-picker"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import { CultivationAddFormSchema } from "./schema"
import type { CultivationsFormProps } from "./types"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "~/components/ui/dialog"

export function CultivationAddFormDialog({ options }: CultivationsFormProps) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>Gewas toevoegen</Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gewas toevoegen</DialogTitle>
                </DialogHeader>
                <CultivationAddForm options={options} />
            </DialogContent>
        </Dialog>
    )
}

function CultivationAddForm({ options }: CultivationsFormProps) {
    const form = useRemixForm<z.infer<typeof CultivationAddFormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(CultivationAddFormSchema),
        defaultValues: {
            b_lu_catalogue: "",
            b_lu_start: new Date(), // Initialize with a Date object
            b_lu_end: undefined,
        },
    })

    return (
        <RemixFormProvider {...form}>
            <Form
                id="formCultivation"
                onSubmit={form.handleSubmit}
                method="post"
            >
                <fieldset disabled={form.formState.isSubmitting}>
                    <div className="grid gap-4">
                        <div className="col-span-1">
                            <Combobox
                                options={options}
                                form={form as any}
                                name="b_lu_catalogue"
                                label={
                                    <span>
                                        Gewas
                                        <span className="text-red-500">*</span>
                                    </span>
                                }
                                disabled={false}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <DatePicker
                                form={form as any}
                                name={"b_lu_start"}
                                label={"Zaaidatum"}
                                description={""}
                            />
                            <DatePicker
                                form={form as any}
                                name={"b_lu_end"}
                                label={"Einddatum"}
                                description={"Datum waarop het gewas wordt beëindigd"}
                            />
                        </div>
                        <div className="">
                            <Button type="submit" className="w-full">
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
