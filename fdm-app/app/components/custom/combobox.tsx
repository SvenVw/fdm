import { useState } from "react"

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
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type optionType = {
    value: string
    label: string
}

interface ComboboxProps {
    options: { value: string, label: string }[]
    value?: string
    defaultValue?: string
    onChange?: (value: string) => void
    onOpenChange?: (open: boolean) => void
}

export function Combobox({
    options,
    value: controlledValue,
    defaultValue,
    onChange,
    onOpenChange
}: ComboboxProps) {
    const [open, setOpen] = useState(false)
    const [internalValue, setInternalValue] = useState(defaultValue ?? "")
    
    const value = controlledValue ?? internalValue
    const handleValueChange = (newValue: string) => {
        setInternalValue(newValue)
        onChange?.(newValue)
    }
    const name = "combobox"

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    name={name}
                    className="w-full justify-between opacity-50"
                >
                    {value || "Begin met typen..."}
                    <ChevronsUpDown className="opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
                <Command>
                    <CommandInput placeholder="Begin met typen..." className="h-9" />
                    <CommandList>
                        <CommandEmpty>Niks gevonden</CommandEmpty>
                        <CommandGroup>
                            {options.map((option: optionType) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={(currentValue) => {
                                        setInternalValue(currentValue === value ? "" : currentValue)
                                        setOpen(false)
                                    }}
                                >
                                    <p className="text-pretty w-[350px]">{option.label}</p>                                    
                                    <Check
                                        className={cn(
                                            "ml-auto",
                                            value === option.label ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}