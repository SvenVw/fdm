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

type optionType = {
    value: string
    label: string
}

interface ComboboxProps {
    options: { value: string; label: string }[]
    name: string
    label: ReactNode
    defaultValue?: optionType["value"]
    disabled?: boolean
    onChange: (value: string) => void
}

export function Combobox({
    options,
    name,
    label,
    defaultValue,
    disabled,
    onChange
}: ComboboxProps) {
    const [open, setOpen] = useState(false)
    const [currentValue, setCurrentValue] = useState<string | undefined>(
        defaultValue,
    )

    /** Map of option values to their labels for efficient lookup */
    const optionsMap = useMemo(
        () =>
            new Map(
                options.map((option: { value: string; label: string }) => [
                    option.value,
                    option.label,
                ]),
            ),
        [options],
    )

    /** Computed label for the default value if provided */
    const defaultLabel = useMemo(
        () => (defaultValue ? optionsMap.get(defaultValue) : undefined),
        [defaultValue, optionsMap],
    )

    return (
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
                                    (option) => option.value === currentValue,
                                )?.label ||
                                defaultLabel ||
                                "Klik om te begin met typen..."
                            }`}
                            aria-controls="combobox-options"
                            aria-haspopup="listbox"
                        >
                            {options.find(
                                (option) => option.value === currentValue,
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
                                {options.map((option: optionType) => (
                                    <CommandItem
                                        value={option.label}
                                        key={option.value}
                                        disabled={disabled}
                                        onSelect={() => {
                                            setCurrentValue(option.value)
                                            onChange(option.value)
                                            setOpen(false)
                                        }}
                                    >
                                        <p className="text-pretty w-[350px]">
                                            {option.label}
                                        </p>
                                        <Check
                                            className={cn(
                                                "ml-auto",
                                                option.value === currentValue
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
            <input
                type="hidden"
                name={name}
                value={currentValue}
            />
            <FormDescription />
            <FormMessage />
        </FormItem>
    )
}