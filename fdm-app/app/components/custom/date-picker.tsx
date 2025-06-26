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

function parseDateString(dateString: string): Date | undefined {
    const parts = dateString.split(/[-./]/) // Split by -, ., or /
    if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10)
        const month = Number.parseInt(parts[1], 10)
        let year = Number.parseInt(parts[2], 10)

        // Handle two-digit year (e.g., 24 for 2024)
        if (year < 100) {
            const currentYear = new Date().getFullYear()
            if (year < currentYear + 20) {
                // Assume 21st century if within 20 years of current year
                year += 2000
            } else {
                // Otherwise assume 20th century
                year += 1900
            }
        }

        const date = new Date(year, month - 1, day) // Month is 0-indexed
        if (
            isValidDate(date) &&
            date.getDate() === day &&
            date.getMonth() === month - 1 &&
            date.getFullYear() === year
        ) {
            return date
        }
    }
    // Fallback to default Date parsing for other formats
    const defaultDate = new Date(dateString)
    return isValidDate(defaultDate) ? defaultDate : undefined
}

function formatDate(date: Date | undefined) {
    if (!date) {
        return ""
    }

    return format(date, "d MMMM yyyy", { locale: nl })
}

function isValidDate(date: Date | undefined) {
    if (!date) {
        return false
    }
    return !Number.isNaN(date.getTime())
}

interface DatePickerProps<TFieldValues extends FieldValues> {
    form: UseFormReturn<TFieldValues>
    name: Path<TFieldValues> // Use Path for better type inference with react-hook-form
    label: string
    description: string
}

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
    const [month, setMonth] = React.useState<Date>(date || new Date()) // Initialize month to current date if 'date' is undefined
    const [value, setValue] = React.useState(formatDate(date))
    const [isInputValid, setIsInputValid] = React.useState(true)

    React.useEffect(() => {
        const formDate: unknown = form.getValues(name) // Explicitly type as unknown
        // Check if formDate is a valid Date object before using it
        if (formDate instanceof Date && isValidDate(formDate)) {
            if (formDate.getTime() !== date?.getTime()) {
                setDate(formDate)
                setMonth(formDate) // Set month to the selected date
                setValue(formatDate(formDate))
                setIsInputValid(true)
            }
        } else if (date !== undefined) {
            // If formDate is undefined or invalid, and date was previously defined
            setDate(undefined)
            setMonth(new Date()) // Reset month to current month
            setValue("") // Clear input value
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
                                    ) // Use parseDateString
                                    if (newDate && isValidDate(newDate)) {
                                        // Check if newDate is defined and valid
                                        setDate(newDate)
                                        setMonth(newDate)
                                        setValue(formatDate(newDate)) // Set value to formatted date
                                        field.onChange(newDate)
                                        setIsInputValid(true) // Set valid
                                    } else {
                                        setValue(e.target.value) // Keep invalid text for a moment
                                        field.onChange(undefined)
                                        setIsInputValid(false) // Set invalid
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
                                        setIsInputValid(true) // Set valid on calendar select
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
