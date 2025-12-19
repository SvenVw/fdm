import type { Row } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { useFetcher } from "react-router"
import { RemixFormProvider } from "remix-hook-form"
import { Button } from "~/components/ui/button"
import { DatePicker } from "../../custom/date-picker-v2"
import { LoadingSpinner } from "../../custom/loadingspinner"
import type { RotationTableFormSchemaType } from "./schema"
import type { CropRow, RotationExtended } from "./columns"
import { DateRangeDisplay } from "./date-range-display"
import { useActiveTableFormStore } from "@/app/store/active-table-form"
import { cn } from "@/app/lib/utils"

type AllowedFormSchemaType = Pick<
    RotationTableFormSchemaType,
    "b_lu_start" | "b_lu_end"
>
function TableDateSelectorForm({
    name,
    row,
    onHide,
}: {
    name: keyof AllowedFormSchemaType
    row: Row<RotationExtended>
    onHide?: () => unknown
}) {
    const fetcher = useFetcher()
    const value = row.original[name]
    const form = useForm({
        defaultValues: {
            [name]: value ? value[0]?.toISOString() : undefined,
        },
    })
    return (
        <div className="flex flex-row items-center">
            <RemixFormProvider {...form}>
                <Controller
                    name={name as string}
                    disabled={fetcher.state !== "idle"}
                    render={({ field, fieldState }) => (
                        <DatePicker
                            label={undefined}
                            field={{
                                ...field,
                                onChange: (value) => {
                                    const formValues = form.getValues()
                                    if (formValues[name as string] !== value) {
                                        const fieldIds = (
                                            row.original.type === "crop"
                                                ? row.original.fields
                                                : [row.original]
                                        )
                                            .map((field) =>
                                                encodeURIComponent(field.b_id),
                                            )
                                            .join(",")
                                        const cultivationIds =
                                            encodeURIComponent(
                                                (
                                                    (row.getParentRow()
                                                        ?.original ??
                                                        row.original) as CropRow
                                                ).b_lu_catalogue,
                                            )
                                        fetcher
                                            .submit(
                                                { [name]: value },
                                                {
                                                    method: "POST",
                                                    action: `?cultivationIds=${cultivationIds}&fieldIds=${fieldIds}`,
                                                },
                                            )
                                            .then(onHide)
                                    }
                                    field.onChange(value)
                                },
                            }}
                            fieldState={fieldState}
                        />
                    )}
                />
            </RemixFormProvider>
            <LoadingSpinner
                className={cn(
                    "inline-block",
                    fetcher.state === "idle" && "invisible",
                )}
            />
        </div>
    )
}

export function TableDateSelector({
    name,
    row,
    cellId,
}: {
    name: keyof AllowedFormSchemaType
    row: Row<RotationExtended>
    cellId: string
}) {
    const activeTableFormStore = useActiveTableFormStore()
    const value = row.original[name]
    if (activeTableFormStore.activeForm === cellId) {
        return (
            <TableDateSelectorForm
                name={name}
                row={row}
                onHide={() => activeTableFormStore.clearActiveForm()}
            />
        )
    }

    return (
        <Button
            variant="link"
            className="px-0"
            onClick={(e) => {
                e.stopPropagation()
                activeTableFormStore.setActiveForm(cellId)
            }}
        >
            <DateRangeDisplay range={value} emptyContent="Geen" />
        </Button>
    )
}
