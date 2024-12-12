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
import {
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { ChevronsUpDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

type optionType = {
    value: string
    label: string
}

interface ComboboxProps {
    options: { value: string, label: string }[]
    form: any
    name: string
    label: any
}

export function Combobox({
    options,
    form,
    name,
    label
}: ComboboxProps) {
    const [open, setOpen] = useState(false)

    return (
        <FormField
            control={form.control}
            name={name}
            render={({ field }) => (
                <FormItem className="flex flex-col">
                    <FormLabel>{label}</FormLabel>
                    <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={open}
                                    name={name}
                                    className="w-full justify-between"
                                >
                                    {options.find(option => option.value === field.value)?.label || "Begin met typen..."}
                                    <ChevronsUpDown className="opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0">
                            <Command>
                                <CommandInput placeholder="Begin met typen..." className="h-9" />
                                <CommandList>
                                    <CommandEmpty>Niks gevonden</CommandEmpty>
                                    <CommandGroup>
                                        {options.map((option: optionType) => (
                                            <CommandItem
                                                value={option.value}
                                                key={option.value}
                                                onSelect={() => {
                                                    form.setValue(name, option.value)
                                                    setOpen(false)
                                                }}
                                            >
                                                <p className="text-pretty w-[350px]">{option.label}</p>
                                                <Check
                                                    className={cn(
                                                        "ml-auto",
                                                        option.value === field.value
                                                            ? "opacity-100"
                                                            : "opacity-0"
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