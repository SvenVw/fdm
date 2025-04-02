import { type ReactNode, useMemo, useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { Check, ChevronsUpDown } from "lucide-react"

type optionType = {
    value: string
    label: string
}

interface ComboboxProps {
    options: { value: string; label: string }[]
    form: any
    name: string
    label: ReactNode
    defaultValue?: optionType["value"]
    disabled?: boolean
}

export function Combobox({
    options,
    form,
    name,
    label,
    defaultValue,
    disabled,
}: ComboboxProps) {
    const [open, setOpen] = useState(false)
    const listboxRef = useRef<HTMLDivElement>(null)

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

    useEffect(() => {
         if (open) {
            const activeElement = listboxRef.current?.querySelector('[data-active]') as HTMLElement | null
            if (activeElement) {
                activeElement.focus()
            }
        }
    }, [open]);

    return (
        <FormField
            control={form.control}
            name={name}
            disabled={disabled}
            render={({ field }) => (
                <FormItem>
                    <FormLabel id={`${name}-label`}>{label}</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    id={`${name}-button`}
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    aria-autocomplete="list"
                                    aria-labelledby={`${name}-label`}
                                    name={name}
                                    disabled={disabled}
                                    className="w-full justify-between truncate focus-visible:ring-2"
                                    aria-controls="combobox-options"
                                    aria-haspopup="listbox"
                                    aria-label={`Selecteer ${options.find((option) => option.value === field.value)?.label || defaultLabel || "Klik om te begin met typen..."}`}
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
                                <CommandList role="listbox" ref={listboxRef}>
                                    <CommandEmpty>Niks gevonden</CommandEmpty>
                                    <CommandGroup>
                                        {options.map((option: optionType) => (
                                            <CommandItem
                                                value={option.label}
                                                key={option.value}
                                                role="option"
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
                    <FormControl>
                        <Input type="hidden" {...field} />
                    </FormControl>
                </FormItem>
            )}
        />
    )
}
