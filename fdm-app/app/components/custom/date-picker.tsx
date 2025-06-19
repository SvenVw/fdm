import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "~/components/ui/button"
import { Calendar } from "~/components/ui/calendar"
import { Input } from "~/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import { format } from "date-fns"
import { nl } from "date-fns/locale"

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
                year += 2000 // Assume 21st century
            } else {
                year += 1900 // Assume 20st century
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

interface DatePickerProps {
    form: any
    name: string
    label: string
    description: string
}

export function DatePicker({
    form,
    name,
    label,
    description,
}: DatePickerProps) {
    const [open, setOpen] = React.useState(false)
    const [date, setDate] = React.useState<Date | undefined>(
        form.getValues(name),
    )
    const [month, setMonth] = React.useState<Date | undefined>(date)
    const [value, setValue] = React.useState(formatDate(date))
    const [isInputValid, setIsInputValid] = React.useState(true)

    React.useEffect(() => {
        const formDate = form.getValues(name)
        if (formDate && formDate.getTime() !== date?.getTime()) {
            setDate(formDate)
            setMonth(formDate)
            setValue(formatDate(formDate))
            setIsInputValid(true)
        }
    }, [form, name, date])

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-col gap-3 w-[240px]">
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
                                    setValue(e.target.value)
                                    if (newDate && isValidDate(newDate)) {
                                        // Check if newDate is defined and valid
                                        setDate(newDate)
                                        setMonth(newDate)
                                        field.onChange(newDate)
                                        setIsInputValid(true) // Set valid
                                    } else {
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
                                    <span className="sr-only">Select date</span>
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
                                    disabled={(date) =>
                                        date < new Date("1970-01-01")
                                    }
                                    locale={nl}
                                    className="rounded-lg border shadow-sm"
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <FormDescription>{description}</FormDescription>
                    {!isInputValid && (
                        <FormMessage>Ongeldige datum</FormMessage>
                    )}
                </FormItem>
            )}
        />
    )
}
