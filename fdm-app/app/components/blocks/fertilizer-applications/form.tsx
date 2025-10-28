import { zodResolver } from "@hookform/resolvers/zod"
import type { FertilizerApplication } from "@svenvw/fdm-core"
import { Plus } from "lucide-react"
import type { MouseEvent } from "react"
import { useEffect } from "react"
import type { Navigation } from "react-router"
import { Form, useNavigate, useSearchParams } from "react-router"
import { RemixFormProvider, useRemixForm } from "remix-hook-form"
import { useFieldFertilizerFormStore } from "@/app/store/field-fertilizer-form"
import { Combobox } from "~/components/custom/combobox"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import {
    type FieldFertilizerFormValues,
    FormSchema,
    PatchFormSchema,
} from "./formschema"
import type { FertilizerOption } from "./types.d"

export function FertilizerApplicationForm({
    options,
    action,
    navigation,
    b_id_farm,
    b_id_or_b_lu_catalogue,
    fertilizerApplication,
}: {
    options: FertilizerOption[]
    action: string
    navigation: Navigation
    b_id_farm: string
    b_id_or_b_lu_catalogue: string
    fertilizerApplication: FertilizerApplication
}) {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const form = useRemixForm<FieldFertilizerFormValues>({
        mode: "onTouched",
        resolver: zodResolver(
            fertilizerApplication ? PatchFormSchema : FormSchema,
        ),
        defaultValues: {
            p_app_id: fertilizerApplication?.p_app_ids
                ? fertilizerApplication.p_app_ids.join(",")
                : fertilizerApplication?.p_app_id,
            p_id: fertilizerApplication?.p_id,
            p_app_method: fertilizerApplication?.p_app_method,
            p_app_amount: undefined, // Handled through an effect due to blank behavior
            p_app_date: fertilizerApplication?.p_app_date ?? new Date(),
        },
        submitConfig: {
            method: fertilizerApplication ? "PUT" : "POST",
        },
    })
    const p_id = form.watch("p_id")
    const selectedFertilizer = options.find((option) => option.value === p_id)
    const isSubmitting = navigation.state === "submitting"

    useEffect(() => {
        if (
            p_id &&
            (!fertilizerApplication || fertilizerApplication.p_id !== p_id)
        ) {
            form.setValue("p_app_method", "")
        }
    }, [p_id, fertilizerApplication, form.setValue])

    const fieldFertilizerFormStore = useFieldFertilizerFormStore()

    useEffect(() => {
        if (b_id_farm && b_id_or_b_lu_catalogue) {
            const savedFormValues = fieldFertilizerFormStore.load(
                b_id_farm,
                b_id_or_b_lu_catalogue,
            )
            if (savedFormValues) {
                for (const [k, v] of Object.entries(savedFormValues)) {
                    if (typeof v === "undefined" || v === null) continue
                    const hydrated =
                        k === "p_app_date" && v
                            ? new Date(v as any)
                            : (v as any)
                    form.setValue(k as any, hydrated)
                }
            }
        }
    }, [
        b_id_farm,
        b_id_or_b_lu_catalogue,
        form.setValue,
        fieldFertilizerFormStore.load,
    ])

    useEffect(() => {
        if (fertilizerApplication) {
            form.setValue("p_app_amount", fertilizerApplication.p_app_amount)
        }
    }, [fertilizerApplication, form.setValue])

    // Change fertilizer selection if the user has added a new fertilizer
    const new_p_id = searchParams.get("p_id")
    useEffect(() => {
        if (new_p_id) {
            form.setValue("p_id", new_p_id)
        }
    }, [new_p_id, form.setValue])

    useEffect(() => {
        if (form.formState.isSubmitSuccessful) {
            fieldFertilizerFormStore.delete(b_id_farm, b_id_or_b_lu_catalogue)
        }
    }, [
        form.formState.isSubmitSuccessful,
        b_id_farm,
        b_id_or_b_lu_catalogue,
        fieldFertilizerFormStore.delete,
    ])

    function handleManageFertilizers(_e: MouseEvent<HTMLButtonElement>) {
        if (b_id_farm && b_id_or_b_lu_catalogue) {
            fieldFertilizerFormStore.save(
                b_id_farm,
                b_id_or_b_lu_catalogue,
                form.getValues(),
            )
        }
        navigate(
            searchParams.has("fieldIds")
                ? `./manage/new?fieldIds=${searchParams.get("fieldIds")}`
                : "./manage/new",
        )
    }

    return (
        <RemixFormProvider {...form}>
            <Form
                id="formAddFertilizerApplication"
                action={action}
                onSubmit={form.handleSubmit}
                method="post"
            >
                <fieldset disabled={isSubmitting}>
                    <div className="grid md:grid-cols-2 items-end gap-x-8 gap-y-4 justify-between">
                        {/* <Label htmlFor="b_name_farm">Meststof</Label> */}
                        <div className="flex flex-row items-baseline [&>*]:grow">
                            <Combobox
                                options={options}
                                form={form}
                                name="p_id"
                                label={
                                    <span>
                                        Meststof
                                        <span className="text-red-500">*</span>
                                    </span>
                                }
                            />
                            <div className="py-2 [&.py-2]:grow-0">
                                <p className="invisible">&nbsp;</p>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            className="ml-2"
                                            onClick={handleManageFertilizers}
                                        >
                                            <Plus />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        Voeg een nieuwe meststof toe aan de
                                        keuzelijst
                                    </TooltipContent>
                                </Tooltip>
                            </div>
                        </div>
                        <FormField
                            control={form.control}
                            name="p_app_method"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Toedieningsmethode</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        value={field.value ?? ""}
                                        disabled={!selectedFertilizer}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecteer een methode" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {selectedFertilizer?.applicationMethodOptions?.map(
                                                (option) => (
                                                    <SelectItem
                                                        key={option.value}
                                                        value={option.value}
                                                    >
                                                        {option.label}
                                                    </SelectItem>
                                                ),
                                            )}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription />
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div>
                            <FormField
                                control={form.control}
                                name="p_app_amount"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Hoeveelheid</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                value={
                                                    field.value === undefined ||
                                                    field.value === null ||
                                                    Number.isNaN(
                                                        Number.parseFloat(
                                                            String(field.value),
                                                        ),
                                                    )
                                                        ? ""
                                                        : field.value
                                                }
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    if (val === "") {
                                                        field.onChange(
                                                            undefined,
                                                        )
                                                    } else {
                                                        field.onChange(
                                                            Number.parseFloat(
                                                                val,
                                                            ),
                                                        )
                                                    }
                                                }}
                                                type="number"
                                                placeholder="12500 kg/ha"
                                                required
                                            />
                                        </FormControl>
                                        <FormDescription />
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <div>
                            <DatePicker
                                form={form}
                                name={"p_app_date"}
                                label={"Datum"}
                                description={""}
                            />
                        </div>
                        <div className="invisible" />
                        <div className="ml-auto">
                            <Button type="submit">
                                {isSubmitting ? (
                                    <div className="flex items-center space-x-2">
                                        <LoadingSpinner />
                                        <span>Opslaan...</span>
                                    </div>
                                ) : fertilizerApplication ? (
                                    "Opslaan"
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
