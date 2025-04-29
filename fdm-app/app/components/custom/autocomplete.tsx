import { cn } from "~/lib/utils"
import { Command as CommandPrimitive } from "cmdk"
import { Check, User, Users } from "lucide-react"
import { useFetcher } from "react-router-dom"
import { useEffect, useMemo, useState, useRef } from "react"
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

// Expected shape of items returned by the lookup API
type LookupItem<T extends string> = {
    value: T
    label: string
    icon?: string // Icon identifier string (key for iconMap)
}

type IconMap = Record<string, React.ComponentType<{ className?: string }>>

type Props<T extends string> = {
    selectedValue: T
    onSelectedValueChange: (value: T) => void
    lookupUrl: string // API endpoint for lookup
    searchParamName?: string // Query parameter name for search term (default: 'identifier')
    excludeValues?: T[] // Optional array of values to filter out
    iconMap?: IconMap // Optional map of icon identifiers to components
    emptyMessage?: string
    placeholder?: string
    // biome-ignore lint/suspicious/noExplicitAny: Using any temporarily due to potential type conflicts with remix-hook-form
    form?: any
    name?: string // Name for remix-hook-form registration
    className?: string
}

export function AutoComplete<T extends string>({
    selectedValue,
    onSelectedValueChange,
    lookupUrl,
    searchParamName = "identifier", // Default search param name
    excludeValues = [],
    iconMap = { user: User, organization: Users }, // Default icon map
    emptyMessage = "No items.",
    placeholder = "Search...",
    form,
    name,
    className,
}: Props<T>) {
    const fetcher = useFetcher<LookupItem<T>[]>()
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("") // Internal input state
    const [items, setItems] = useState<LookupItem<T>[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null)
    const prevInputValue = useRef<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null) // Ref for the input element

    // Derive display label for the currently selected value
    const selectedLabel = useMemo(() => {
        // Find the label from fetched items or potentially passed initial state if needed
        // For now, assume we fetch it or it's cleared if not found
        const selectedItem = items.find((item) => item.value === selectedValue)
        return selectedItem?.label ?? ""
    }, [selectedValue, items])

    // Effect to fetch data when input value changes (debounced)
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }

        // Only fetch if input has changed and is not empty
        if (inputValue.length >= 1 && prevInputValue.current !== inputValue) {
            debounceTimeout.current = setTimeout(() => {
                prevInputValue.current = inputValue
                setIsLoading(true)
                const url = `${lookupUrl}?${searchParamName}=${encodeURIComponent(inputValue)}`
                fetcher.load(url) // Use GET request via fetcher.load
            }, 300)
        } else if (inputValue.length < 1) {
            setItems([]) // Clear items if input is empty
            setIsLoading(false)
        }

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current)
            }
        }
    }, [inputValue, lookupUrl, searchParamName, fetcher])

    // Effect to process fetched data
    useEffect(() => {
        if (fetcher.data) {
            const filteredItems = fetcher.data.filter(
                (item) => !excludeValues.includes(item.value),
            )
            setItems(filteredItems)
        }
        // Stop loading regardless of data presence, but only if fetcher is idle
        if (fetcher.state === "idle") {
            setIsLoading(false)
            // Refocus the input if it's still open after loading suggestions
            // Use setTimeout to ensure focus happens after potential DOM updates
            if (open && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus()
                }, 0)
            }
        }
    }, [fetcher.data, fetcher.state, excludeValues, open])

    // Effect to sync input field when selectedValue changes externally
    useEffect(() => {
        // If a value is selected externally, update the input field to its label
        // This handles cases where the form is reset or pre-populated
        if (selectedValue && selectedLabel) {
            setInputValue(selectedLabel)
        } else if (!selectedValue) {
            // If selectedValue is cleared externally, clear the input
            setInputValue("")
        }
        // We only want this effect to run when selectedValue changes externally,
        // not when selectedLabel changes due to items loading.
    }, [selectedValue, selectedLabel])

    const handleInputChange = (value: string) => {
        setInputValue(value)
        // If user types something different than the selected label, clear the selection
        if (selectedValue && value !== selectedLabel) {
            onSelectedValueChange("" as T) // Clear parent state
            if (form && name) {
                form.setValue(name, "") // Clear form state if applicable
            }
        }
    }

    const handleSelectItem = (itemValue: string) => {
        const selectedItem = items.find((item) => item.value === itemValue)
        if (selectedItem) {
            onSelectedValueChange(selectedItem.value as T)
            setInputValue(selectedItem.label) // Update input to reflect selection
            if (form && name) {
                form.setValue(name, selectedItem.value) // Update form state
            }
        }
        setOpen(false)
    }

    // Keep input if it matches a valid item, otherwise clear if no selection
    const handleInputBlur = () => {
        // Timeout to allow click selection to register first
        setTimeout(() => {
            if (!open) {
                // If input doesn't match the selected label, and no value is selected, clear input
                if (inputValue !== selectedLabel && !selectedValue) {
                    setInputValue("")
                }
                // If input matches selected label, keep it.
                // If input doesn't match, but a value IS selected, revert input to selected label
                else if (inputValue !== selectedLabel && selectedValue) {
                    setInputValue(selectedLabel)
                }
            }
        }, 100) // Small delay
    }

    return (
        <div className={cn("flex items-center", className)}>
            <Popover open={open} onOpenChange={setOpen}>
                <Command shouldFilter={false} className="w-full">
                    <PopoverAnchor asChild>
                        <CommandPrimitive.Input
                            asChild
                            value={inputValue}
                            onValueChange={handleInputChange}
                            onKeyDown={(e) => setOpen(e.key !== "Escape")}
                            onMouseDown={() =>
                                setOpen((open) => !!inputValue || !open)
                            }
                            onFocus={() => setOpen(true)}
                            onBlur={handleInputBlur}
                        >
                            <Input
                                ref={inputRef} // Assign ref to the input
                                placeholder={placeholder}
                                className="w-full"
                                autoComplete="off" // Prevent browser autocomplete
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
                                        // Use iconMap to get the component, default to Check
                                        const IconComponent = option.icon
                                            ? iconMap[option.icon] ?? Check
                                            : Check
                                        return (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value} // Use value for selection logic
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                } // Prevent blur on click
                                                onSelect={() =>
                                                    handleSelectItem(
                                                        option.value,
                                                    )
                                                }
                                            >
                                                <IconComponent
                                                    className={"mr-2 h-4 w-4"}
                                                />
                                                {option.label}
                                            </CommandItem>
                                        )
                                    })}
                                </CommandGroup>
                            ) : null}
                            {!isLoading && !items.length && inputValue ? ( // Show empty only if not loading and user typed something
                                <CommandEmpty>
                                    {emptyMessage ?? "No items."}
                                </CommandEmpty>
                            ) : null}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
            {/* Hidden input for react-hook-form integration */}
            {form && name && (
                <input
                    type="hidden"
                    {...form.register(name)}
                    value={selectedValue}
                />
            )}
        </div>
    )
}
