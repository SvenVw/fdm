/**
 * @file This file defines a reusable `DatePicker` component and its associated helper functions.
 *
 * The `DatePicker` is a form input that allows users to select a date either by typing
 * into an input field or by choosing from a calendar popover. It is designed for seamless
 * integration with `remix-hook-form` and uses `shadcn/ui` components for styling and
 * `date-fns` for date manipulation.
 *
 * @packageDocumentation
 */
import { format } from "date-fns"
import { nl } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import React from "react"
import type { FieldValues, Path, UseFormReturn } from "react-hook-form"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"

/**
 * Parses a date string from various common formats (e.g., "dd-mm-yyyy", "dd/mm/yy").
 * @param dateString - The string to parse.
 * @returns A `Date` object if parsing is successful, otherwise `undefined`.
 * @internal
 */
function parseDateString(dateString: string): Date | undefined {
    const parts = dateString.split(/[-./]/)
    if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10)
        const month = Number.parseInt(parts[1], 10)
        let year = Number.parseInt(parts[2], 10)

        if (year < 100) {
            year += 2000
        }

        const date = new Date(year, month - 1, day)
        if (
            isValidDate(date) &&
            date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year
        ) {
            return date
        }
    }
    const defaultDate = new Date(dateString)
    return isValidDate(defaultDate) ? defaultDate : undefined
}

/**
 * Formats a `Date` object into a human-readable string using the Dutch locale.
 * @param date - The date to format.
 * @returns The formatted date string (e.g., "1 januari 2025"), or an empty string if the date is undefined.
 * @internal
 */
function formatDate(date: Date | undefined): string {
    if (!date) {
        return ""
    }
    return format(date, "d MMMM yyyy", { locale: nl })
}

/**
 * Checks if a given value is a valid `Date` object.
 * @param date - The value to check.
 * @returns `true` if the value is a valid date, otherwise `false`.
 * @internal
 */
function isValidDate(date: Date | undefined): boolean {
    return date instanceof Date && !Number.isNaN(date.getTime())
}

interface DatePickerProps<TFieldValues extends FieldValues> {
    /** The form instance from `react-hook-form`. */
    form: UseFormReturn<TFieldValues>
    /** The name of the form field. */
    name: Path<TFieldValues>
    /** The label to display for the form field. */
    label: string
    /** A description or hint to display below the input. */
    description: string
}

/**
 * A date picker component for forms, with both text input and a calendar popover.
 *
 * This component integrates with `react-hook-form` via a `FormField` wrapper. It allows
 * users to either type a date directly (with flexible parsing) or select one from a
 * pop-up calendar. The component manages its internal state for the input value and
 * calendar month, and syncs with the parent form's state.
 */
export function DatePicker<TFieldValues extends FieldValues>({
    form,
    name,
    label,
    description,
}: DatePickerProps<TFieldValues>) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        form.getValues(name),
    )
    const [month, setMonth] = React.useState<Date>(date || new Date())
    const [value, setValue] = React.useState(formatDate(date))
    const [isInputValid, setIsInputValid] = React.useState(true)

    // Effect to sync the component's state with the form's state.
    React.useEffect(() => {
        const formDate: unknown = form.getValues(name)
        if (formDate instanceof Date && isValidDate(formDate)) {
            if (formDate.getTime() !== date?.getTime()) {
                setDate(formDate)
                setMonth(formDate)
                setValue(formatDate(formDate))
                setIsInputValid(true)
            }
        } else if (date !== undefined) {
            setDate(undefined)
            setMonth(new Date())
            setValue("")
            setIsInputValid(true)
        }
    }, [form, name, date])

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>{label}</FormLabel>
                    <div className="relative flex gap-2">
                        <FormControl>
                            <Input
                                id={field.name}
                                value={value}
                                placeholder="Kies een datum"
                                className="bg-background pr-10"
                                onChange={(e) => {
                                    const newDate = parseDateString(
                                        e.target.value,
                                    )
                                    if (newDate && isValidDate(newDate)) {
                                        setDate(newDate)
                                        setMonth(newDate)
                                        setValue(formatDate(newDate))
                                        field.onChange(newDate)
                                        setIsInputValid(true)
                                    } else {
                                        setValue(e.target.value)
                                        field.onChange(undefined)
                                        setIsInputValid(false)
                                    }
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === "ArrowDown") {
                                        e.preventDefault()
                                        setOpen(true)
                                    }
                                }}
                            />
                        </FormControl>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    id={`${field.name}-picker`}
                                    variant="ghost"
                                    className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                                >
                                    <CalendarIcon className="size-3.5" />
                                    <span className="sr-only">
                                        Kies een datum
                                    </span>
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent
                                className="w-auto overflow-hidden p-0"
                                align="end"
                                alignOffset={-8}
                                sideOffset={10}
                            >
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    captionLayout="dropdown"
                                    month={month}
                                    onMonthChange={setMonth}
                                    onSelect={(selectedDate) => {
                                        setDate(selectedDate)
                                        setValue(formatDate(selectedDate))
                                        field.onChange(selectedDate)
                                        setOpen(false)
                                        setIsInputValid(true)
                                    }}
                                    startMonth={new Date(1970, 0)}
                                    endMonth={new Date(2030, 11)}
                                    locale={nl}
                                    className="rounded-lg border shadow-sm"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <FormDescription>{description}</FormDescription>
                    <FormMessage>
                        {!isInputValid ? "Ongeldige datum" : null}
                    </FormMessage>
                </FormItem>
            )}
        />
    )
}
