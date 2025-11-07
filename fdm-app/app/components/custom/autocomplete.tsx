/**
 * @file This file defines a reusable `AutoComplete` component.
 *
 * The `AutoComplete` component provides a flexible, API-driven search input with
 * features like debounced fetching, dynamic item rendering with icons, and seamless
 * integration with `remix-hook-form`. It is built using `cmdk` for command menu
 * functionality and `shadcn/ui` components for styling.
 *
 * @packageDocumentation
 */
import { Command as CommandPrimitive } from "cmdk"
import { Check, User, Users } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useFetcher } from "react-router-dom"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandList,
} from "~/components/ui/command"
import { Input } from "~/components/ui/input"
import { Popover, PopoverAnchor, PopoverContent } from "~/components/ui/popover"
import { cn } from "~/lib/utils"
import { LoadingSpinner } from "./loadingspinner"

/**
 * Represents the expected shape of an item returned by the lookup API.
 */
type LookupItem<T extends string> = {
    /** The unique value of the item. */
    value: T
    /** The human-readable label to display. */
    label: string
    /** An optional string identifier for an icon to be displayed next to the item. */
    icon?: string
}

/**
 * A map of icon identifiers to their corresponding React components.
 */
type IconMap = Record<string, React.ComponentType<{ className?: string }>>

type Props<T extends string> = {
    /** The currently selected value. */
    selectedValue: T
    /** Callback function invoked when the selected value changes. */
    onSelectedValueChange: (value: T) => void
    /** The API endpoint URL to fetch lookup items from. */
    lookupUrl: string
    /** The name of the query parameter for the search term (defaults to 'identifier'). */
    searchParamName?: string
    /** An optional array of values to filter out from the results. */
    excludeValues?: T[]
    /** An optional map of icon identifiers to React components. */
    iconMap?: IconMap
    /** The message to display when no items are found. */
    emptyMessage?: string
    /** The placeholder text for the input field. */
    placeholder?: string
    /** The form instance from `remix-hook-form` for integration. */
    // biome-ignore lint/suspicious/noExplicitAny: Using 'any' for compatibility with remix-hook-form.
    form?: any
    /** The name to register the component with `remix-hook-form`. */
    name?: string
    /** Optional CSS class name for custom styling. */
    className?: string
}

/**
 * A flexible, API-driven autocomplete component.
 *
 * This component provides a search input that fetches suggestions from a specified
 * API endpoint as the user types. It features debouncing to limit API requests,
 * support for custom icons, and integration with `remix-hook-form`.
 */
export function AutoComplete<T extends string>({
    selectedValue,
    onSelectedValueChange,
    lookupUrl,
    searchParamName = "identifier",
    excludeValues = [],
    iconMap = { user: User, organization: Users },
    emptyMessage = "No items.",
    placeholder = "Search...",
    form,
    name,
    className,
}: Props<T>) {
    const fetcher = useFetcher<LookupItem<T>[]>()
    const [open, setOpen] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [items, setItems] = useState<LookupItem<T>[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
    const prevInputValue = useRef<string | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const selectedLabel = useMemo(() => {
        const selectedItem = items.find((item) => item.value === selectedValue)
        return selectedItem?.label ?? ""
    }, [selectedValue, items])

    // Debounced effect to fetch data as the user types.
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current)
        }

        if (inputValue.length >= 1 && prevInputValue.current !== inputValue) {
            debounceTimeout.current = setTimeout(() => {
                prevInputValue.current = inputValue
                setIsLoading(true)
                const url = `${lookupUrl}?${searchParamName}=${encodeURIComponent(inputValue)}`
                fetcher.load(url)
            }, 300)
        } else if (inputValue.length < 1) {
            setItems([])
            setIsLoading(false)
        }

        return () => {
            if (debounceTimeout.current) {
                clearTimeout(debounceTimeout.current)
            }
        }
    }, [inputValue, lookupUrl, searchParamName, fetcher])

    // Process fetched data from the API.
    useEffect(() => {
        if (fetcher.data) {
            const filteredItems = fetcher.data.filter(
                (item) => !excludeValues.includes(item.value),
            )
            setItems(filteredItems)
        }
        if (fetcher.state === "idle") {
            setIsLoading(false)
            if (open && inputRef.current) {
                setTimeout(() => {
                    inputRef.current?.focus()
                }, 0)
            }
        }
    }, [fetcher.data, fetcher.state, excludeValues, open])

    // Sync input field when selectedValue is changed externally (e.g., form reset).
    useEffect(() => {
        if (selectedValue && selectedLabel) {
            setInputValue(selectedLabel)
        } else if (!selectedValue) {
            setInputValue("")
        }
    }, [selectedValue, selectedLabel])

    const handleInputChange = (value: string) => {
        setInputValue(value)
        if (selectedValue && value !== selectedLabel) {
            onSelectedValueChange("" as T)
            if (form && name) {
                form.setValue(name, "")
            }
        }
    }

    const handleSelectItem = (itemValue: string) => {
        const selectedItem = items.find((item) => item.value === itemValue)
        if (selectedItem) {
            onSelectedValueChange(selectedItem.value as T)
            setInputValue(selectedItem.label)
            if (form && name) {
                form.setValue(name, selectedItem.value)
            }
        }
        setOpen(false)
    }

    const handleInputBlur = () => {
        setTimeout(() => {
            if (!open) {
                if (inputValue !== selectedLabel && !selectedValue) {
                    setInputValue("")
                } else if (inputValue !== selectedLabel && selectedValue) {
                    setInputValue(selectedLabel)
                }
            }
        }, 100)
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
                                ref={inputRef}
                                placeholder={placeholder}
                                className="w-full"
                                autoComplete="off"
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
                        className="w-(--radix-popover-trigger-width) p-0"
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
                                        const IconComponent = option.icon
                                            ? (iconMap[option.icon] ?? Check)
                                            : Check
                                        return (
                                            <CommandItem
                                                key={option.value}
                                                value={option.value}
                                                onMouseDown={(e) =>
                                                    e.preventDefault()
                                                }
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
                            {!isLoading && !items.length && inputValue ? (
                                <CommandEmpty>
                                    {emptyMessage ?? "No items."}
                                </CommandEmpty>
                            ) : null}
                        </CommandList>
                    </PopoverContent>
                </Command>
            </Popover>
            {form && name && (
                <input
                    type="hidden"
                    {...form.register(name)}
                    defaultValue={selectedValue}
                />
            )}
        </div>
    )
}
