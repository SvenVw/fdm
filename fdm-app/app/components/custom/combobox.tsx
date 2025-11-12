/**
 * @file This file defines a reusable `Combobox` component.
 *
 * The `Combobox` is a form input that combines a text input with a popover list,
 * allowing users to either type to filter a list or select an option from the dropdown.
 * It is designed to integrate seamlessly with `remix-hook-form` and is built using
 * `shadcn/ui` components.
 *
 * @packageDocumentation
 */
import { Check, ChevronsUpDown } from "lucide-react"
import { type ReactNode, useMemo, useState } from "react"
import { Button } from "~/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "~/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { cn } from "~/lib/utils"

type OptionType = {
    value: string
    label: string
}

interface ComboboxProps {
    /** An array of options to display in the dropdown. */
    options: OptionType[]
    /** The name of the form field. */
    name: string
    /** The label to display for the form field. */
    label: ReactNode
    /** The form instance from `remix-hook-form`. */
    // biome-ignore lint/suspicious/noExplicitAny: Using 'any' for compatibility with react-hook-form.
    form: any
    /** The default value for the combobox. */
    defaultValue?: OptionType["value"]
    /** A flag to disable the combobox. */
    disabled?: boolean
}

/**
 * A searchable dropdown component designed for use within a `remix-hook-form`.
 *
 * This component renders a button that, when clicked, opens a popover containing a
 * searchable list of options. It's wrapped in a `FormField` to automatically handle
 * form state, validation, and error messages.
 */
export function Combobox({
    options,
    name,
    label,
    form,
    defaultValue,
    disabled,
}: ComboboxProps) {
    const [open, setOpen] = useState(false)

    const optionsMap = useMemo(
        () => new Map(options.map((option) => [option.value, option.label])),
        [options],
    )

    const defaultLabel = useMemo(
        () => (defaultValue ? optionsMap.get(defaultValue) : undefined),
        [defaultValue, optionsMap],
    )

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem>
                    <FormLabel>{label}</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    name={name}
                                    disabled={disabled}
                                    className="w-full justify-between truncate focus-visible:ring-2"
                                    aria-label={`Selecteer ${
                                        options.find(
                                            (option) =>
                                                option.value === field.value,
                                        )?.label ||
                                        defaultLabel ||
                                        "Klik om te begin met typen..."
                                    }`}
                                    aria-controls="combobox-options"
                                    aria-haspopup="listbox"
                                >
                                    {options.find(
                                        (option) =>
                                            option.value === field.value,
                                    )?.label ||
                                        defaultLabel ||
                                        "Begin met typen..."}
                                    <ChevronsUpDown className="opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent
                            id="combobox-options"
                            className="w-full p-0"
                        >
                            <Command>
                                <CommandInput
                                    placeholder="Begin met typen..."
                                    className="h-9"
                                />
                                <CommandList>
                                    <CommandEmpty>Niks gevonden</CommandEmpty>
                                    <CommandGroup>
                                        {options.map((option: OptionType) => (
                                            <CommandItem
                                                value={option.label}
                                                key={option.value}
                                                disabled={disabled}
                                                onSelect={() => {
                                                    form.setValue(
                                                        name,
                                                        option.value,
                                                    )
                                                    setOpen(false)
                                                }}
                                            >
                                                <p className="text-pretty w-[350px]">
                                                    {option.label}
                                                </p>
                                                <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        option.value ===
                                                            field.value
                                                            ? "opacity-100"
                                                            : "opacity-0",
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormDescription />
                    <FormMessage />
                </FormItem>
            )}
        />
    )
}
