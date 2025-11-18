"use client"

import * as chrono from "chrono-node"
import { CalendarIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Input } from "~/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { Field, FieldError, FieldLabel } from "~/components/ui/field"
import type {
    ControllerFieldState,
    ControllerRenderProps,
    FieldValues,
} from "react-hook-form"
import { nl as calenderLocale } from "react-day-picker/locale"
import { type ChangeEvent, useEffect, useState } from "react"

type DatePickerProps = {
    label: string
    defaultValue?: Date
    field: ControllerRenderProps<FieldValues, string>
    fieldState: ControllerFieldState
    required?: boolean
}

export function DatePicker({
    label,
    defaultValue,
    field,
    fieldState,
    required,
}: DatePickerProps) {
    const [open, setOpen] = useState(false)
    const initialDate =
        (field.value && parseDateText(field.value)) || defaultValue
    const [inputValue, setInputValue] = useState(formatDate(initialDate))
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        field.value ? parseDateText(field.value) || undefined : undefined,
    )
    const [month, setMonth] = useState<Date | undefined>(selectedDate)

    useEffect(() => {
        if (field.value) {
            const date = parseDateText(field.value)
            setSelectedDate(date || undefined)
            setInputValue(date ? formatDate(date) : "")
        } else {
            setInputValue("")
            setSelectedDate(undefined)
        }
    }, [field.value])

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        setInputValue(e.target.value)
    }

    const handleInputBlur = () => {
        const date = parseDateText(inputValue)
        if (date) {
            setSelectedDate(date)
            setMonth(date)
            field.onChange(formatDate(date))
        } else {
            setSelectedDate(undefined)
            field.onChange("")
        }
    }

    const handleDateSelect = (date: Date | undefined) => {
        setSelectedDate(date)
        const formattedDate = formatDate(date)
        setInputValue(formattedDate)
        field.onChange(formattedDate)
        setOpen(false)
    }

    return (
        <Field data-invalid={fieldState.invalid} className="gap-1">
            <FieldLabel>{label}</FieldLabel>
            <div className="flex relative gap-2">
                <Input
                    {...field}
                    value={inputValue}
                    aria-required={required ? "true" : "false"}
                    aria-invalid={fieldState.invalid}
                    placeholder="Kies een datum"
                    className="bg-background pr-10"
                    onChange={handleInputChange}
                    onBlur={handleInputBlur}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault()
                            setOpen(true)
                        }
                    }}
                    required={required}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            id="date-picker"
                            variant="ghost"
                            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                        >
                            <CalendarIcon className="size-3.5" />
                            <span className="sr-only">Kies een datum</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto overflow-hidden p-0"
                        align="end"
                    >
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            captionLayout="dropdown"
                            month={month}
                            onMonthChange={setMonth}
                            onSelect={handleDateSelect}
                            locale={calenderLocale}
                        />
                    </PopoverContent>
                </Popover>
            </div>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
    )
}

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return format(date, "PPP", { locale: nl })
}

function parseDateText(date: string | Date | undefined): Date | undefined {
    if (date instanceof Date) {
        return date
    }
    if (!date || date === "") {
        return undefined
    }
    const referenceDate = new Date()
    const parsedDate = chrono.nl.parseDate(date, referenceDate)
    if (!parsedDate) {
        return undefined
    }

    return parsedDate
}
