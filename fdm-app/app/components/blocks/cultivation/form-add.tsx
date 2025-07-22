import { zodResolver } from "@hookform/resolvers/zod"
import { Form, useFetcher } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { z } from "zod"
import { format } from "date-fns/format"
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

export function CultivationAddFormDialog({options}: CultivationsFormProps) {
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

function CultivationAddForm({options}: CultivationsFormProps) {
    const fetcher = useFetcher()
    const form = useRemixForm<z.infer<typeof CultivationAddFormSchema>>({
        mode: "onTouched",
        resolver: zodResolver(CultivationAddFormSchema),
        defaultValues: {
            b_lu_catalogue: "",
            b_lu_start: undefined,
            b_lu_end: undefined,
        },
    })

    const onSubmit = (values: z.infer<typeof CultivationAddFormSchema>) => {
        fetcher.submit(
            {
                ...values,
                b_lu_start: values.b_lu_start ? format(values.b_lu_start, "yyyy-MM-dd") : "",
                b_lu_end: values.b_lu_end ? format(values.b_lu_end, "yyyy-MM-dd") : "",
            },
            { method: "POST", encType: "application/json" },
        )
    }

    return (
        <RemixFormProvider {...form}>
            <fetcher.Form
                id="formCultivation"
                // onSubmit={form.handleSubmit(onSubmit)}
                method="POST"
            >
                <fieldset disabled={fetcher.state === "submitting"}>
                    <div className="grid gap-4">
                        <div className="col-span-1">
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
                                disabled={false}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <DatePicker
                                form={form}
                                name={"b_lu_start"}
                                label={"Zaaidatum"}
                                description={""}
                            />
                            <DatePicker
                                form={form}
                                name={"b_lu_end"}
                                label={"Einddatum"}
                                description={""}
                            />
                        </div>
                        <div className="">
                            <Button type="submit" className="w-full">
                                {fetcher.state === "submitting" ? (
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
            </fetcher.Form>
        </RemixFormProvider>
    )
}
