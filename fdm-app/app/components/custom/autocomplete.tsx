import { cn } from "~/lib/utils"
import { Command as CommandPrimitive } from "cmdk"
import { Check } from "lucide-react"
import { useMemo, useState } from "react"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import { Input } from "~/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover"
import { LoadingSpinner } from "./loadingspinner"
import type { UseFormReturn } from "remix-hook-form"
import type { z } from "zod"

type Props<T extends string> = {
    selectedValue: T
    onSelectedValueChange: (value: T) => void
    searchValue: string
    onSearchValueChange: (value: string) => void
    items: {
        value: T
        label: string
        icon?: React.ComponentType<{ className?: string }>
    }[]
    isLoading?: boolean
    emptyMessage?: string
    placeholder?: string
    form?: UseFormReturn<z.infer<any>>
    name?: string
    className?: string
}

export function AutoComplete<T extends string>({
    selectedValue,
    onSelectedValueChange,
    searchValue,
    onSearchValueChange,
    items,
    isLoading,
    emptyMessage = "No items.",
    placeholder = "Search...",
    form,
    name,
    className,
}: Props<T>) {
    const [open, setOpen] = useState(false)

    const labels = useMemo(
        () =>
            items.reduce(
                (acc, item) => {
                    acc[item.value] = item.label
                    return acc
                },
                {} as Record<string, string>,
            ),
        [items],
    )

    const reset = () => {
        onSelectedValueChange("" as T)
        onSearchValueChange("")
    }

    const onInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
        if (
            !e.relatedTarget?.hasAttribute("cmdk-list") &&
            labels[selectedValue] !== searchValue
        ) {
            reset()
        }
    }

    const onSelectItem = (inputValue: string) => {
        if (inputValue === selectedValue) {
            reset()
        } else {
            onSelectedValueChange(inputValue as T)
            onSearchValueChange(labels[inputValue] ?? "")
            form?.setValue(name, inputValue)
        }
        setOpen(false)
    }

    return (
        <div className={cn("flex items-center", className)}> 
            <Popover open={open} onOpenChange={setOpen}>
                <Command shouldFilter={false} className="w-full"> 
                    <PopoverAnchor asChild>
                        <CommandPrimitive.Input
                            asChild
                            value={searchValue}
                            onValueChange={onSearchValueChange}
                            onKeyDown={(e) => setOpen(e.key !== "Escape")}
                            onMouseDown={() =>
                                setOpen((open) => !!searchValue || !open)
                            }
                            onFocus={() => setOpen(true)}
                            onBlur={onInputBlur}
                        >
                            <Input
                                placeholder={placeholder}
                                className="w-full"
                            />
                        </CommandPrimitive.Input>
                    </PopoverAnchor>
                    {!open && (
                        <CommandList aria-hidden="true" className="hidden" />
                    )}
                    <PopoverContent
                        asChild
                        onOpenAutoFocus={(e) => e.preventDefault()}
                        onInteractOutside={(e) => {
                            if (
                                e.target instanceof Element &&
                                e.target.hasAttribute("cmdk-input")
                            ) {
                                e.preventDefault()
                            }
                        }}
                        className="w-[--radix-popover-trigger-width] p-0"
                    >
                        <CommandList>
                            {isLoading && (
                                <CommandPrimitive.Loading>
                                    <div className="p-1">
                                        <LoadingSpinner className="h-6 w-full" />
                                    </div>
                                </CommandPrimitive.Loading>
                            )}
                            {items.length > 0 && !isLoading ? (
                                <CommandGroup>
                                    {items.map((option) => {
                                        const Icon = option.icon || Check
                                        return (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
                                                onSelect={onSelectItem}
                                            >
                                                <Icon // Icon is rendered as a component
                                                    className={"mr-2 h-4 w-4"}
                                                />
                                                {option.label}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            ) : null}
                            {!isLoading ? (
                                <CommandEmpty>
                                    {emptyMessage ?? "No items."}
                                </CommandEmpty>
                            ) : null}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
            <input
                type="hidden"
                {...form?.register(name)}
                value={selectedValue}
            />
        </div>
    )
}
