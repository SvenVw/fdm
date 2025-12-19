import type { Row } from "@tanstack/react-table"
import { Controller, useForm } from "react-hook-form"
import { useFetcher } from "react-router"
import { RemixFormProvider } from "remix-hook-form"
import { cn } from "@/app/lib/utils"
import { useActiveTableFormStore } from "@/app/store/active-table-form"
import { LoadingSpinner } from "~/components/custom/loadingspinner"
import { Button } from "~/components/ui/button"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import type { CropRow, RotationExtended } from "./columns"
import type { RotationTableFormSchemaType } from "./schema"

type AllowedFormSchemaType = Pick<RotationTableFormSchemaType, "b_lu_variety">
function TableVarietySelectorForm({
    name,
    row,
    b_lu_variety_options,
    onHide,
}: {
    name: keyof AllowedFormSchemaType
    row: Row<RotationExtended>
    b_lu_variety_options: { label: string; value: string }[]
    onHide?: () => unknown
}) {
    const fetcher = useFetcher()
    const currentSortedValues = Object.keys(row.original[name])
    const value = currentSortedValues?.length ? currentSortedValues[0] : null
    const form = useForm({
        defaultValues: {
            [name]: value,
        },
    })

    return (
        <div className="flex flex-row items-center">
            <RemixFormProvider {...form}>
                <Controller
                    name={name as string}
                    disabled={fetcher.state !== "idle"}
                    render={({ field }) => (
                        <Select
                            defaultOpen={true}
                            onValueChange={(value) => {
                                const formValues = form.getValues()
                                if (formValues[name] !== value) {
                                    const fieldIds = (
                                        row.original.type === "crop"
                                            ? row.original.fields
                                            : [row.original]
                                    )
                                        .map((field) =>
                                            encodeURIComponent(field.b_id),
                                        )
                                        .join(",")
                                    const cultivationIds = encodeURIComponent(
                                        (
                                            (row.getParentRow()?.original ??
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
                            }}
                            value={field.value ?? undefined}
                            disabled={b_lu_variety_options.length === 0}
                        >
                            <SelectTrigger>
                                <SelectValue
                                    placeholder={
                                        b_lu_variety_options.length === 0
                                            ? "Geen varieteiten beschikbaar"
                                            : "Selecteer een variëteit"
                                    }
                                />
                            </SelectTrigger>
                            <SelectContent>
                                {b_lu_variety_options.map((option) => (
                                    <SelectItem
                                        key={option.value}
                                        value={option.value}
                                    >
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
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

export function TableVarietySelector({
    name,
    row,
    cellId,
}: {
    name: keyof AllowedFormSchemaType
    row: Row<RotationExtended>
    cellId: string
}) {
    const activeTableFormStore = useActiveTableFormStore()
    const value = row.original[name] ? Object.keys(row.original[name]) : null
    const b_lu_variety_options = (
        (row.getParentRow() ?? row).original as CropRow
    ).b_lu_variety_options

    function renderText() {
        return !b_lu_variety_options?.length
            ? ""
            : !value?.length
              ? "niet aangegeven"
              : value.length <= 5
                ? value.join(", ")
                : `${value.slice(0, 5).join(", ")} en meer`
    }

    if (row.original.type === "crop" || !b_lu_variety_options?.length) {
        return renderText()
    }

    if (activeTableFormStore.activeForm === cellId) {
        return (
            <TableVarietySelectorForm
                name={name}
                row={row}
                b_lu_variety_options={b_lu_variety_options}
                onHide={() => {
                    const currentState = useActiveTableFormStore.getState()
                    if (currentState.activeForm === cellId)
                        currentState.clearActiveForm()
                }}
            />
        )
    }

    return (
        <Button
            variant="link"
            className={cn(
                "block px-0 max-w-2xs h-auto whitespace-break-spaces",
                !value?.length && "text-muted-foreground",
            )}
            onClick={(e) => {
                e.stopPropagation()
                activeTableFormStore.setActiveForm(cellId)
            }}
        >
            {renderText()}
        </Button>
    )
}
