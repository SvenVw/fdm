/**
 * @file This file defines a highly customizable `MultiSelect` component.
 *
 * This component provides a rich multi-select dropdown experience, allowing users to
 * select multiple items from a list. It is built with `cva` for styling variants and
 * uses `shadcn/ui` components like `Popover`, `Command`, and `Badge`.
 *
 * Features include:
 * - Displaying selected items as dismissible badges.
 * - Summarizing selections when they exceed a `maxCount`.
 * - "Select All" and "Clear All" functionality.
 * - Keyboard navigation and accessibility support.
 * - Optional animations for a more engaging user experience.
 *
 * @see https://github.com/sersavan/shadcn-multi-select-component
 * @packageDocumentation
 */
import { cva, type VariantProps } from "class-variance-authority"
import {
    CheckIcon,
    ChevronDown,
    WandSparkles,
    XCircle,
    XIcon,
} from "lucide-react"
import * as React from "react"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "~/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "~/components/ui/popover"
import { Separator } from "~/components/ui/separator"
import { cn } from "~/lib/utils"

/**
 * Defines the visual variants for the multi-select component's badges.
 * @internal
 */
const multiSelectVariants = cva(
    "m-1 transition ease-in-out delay-150 hover:-translate-y-1 hover:scale-110 duration-300",
    {
        variants: {
            variant: {
                default:
                    "border-foreground/10 text-foreground bg-card hover:bg-card/80",
                secondary:
                    "border-foreground/10 bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive:
                    "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
                inverted: "inverted",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    },
)

interface MultiSelectProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof multiSelectVariants> {
    /** An array of options to be displayed in the dropdown. */
    options: {
        label: string
        value: string
        icon?: React.ComponentType<{ className?: string }>
    }[]

    /** Callback function invoked when the selected values change. */
    onValueChange: (value: string[]) => void

    /** The default selected values. */
    defaultValue?: string[]

    /** Placeholder text to display when no values are selected. */
    placeholder?: string

    /** Animation duration in seconds for badge effects. */
    animation?: number

    /** Maximum number of selected items to display before summarizing. */
    maxCount?: number

    /** If true, the popover will be modal, disabling interaction with other elements. */
    modalPopover?: boolean

    /** Additional class names for custom styling. */
    className?: string

    /** The name attribute for the button element. */
    name?: string
}

/**
 * A versatile multi-select component with a rich user experience.
 *
 * This component allows users to select multiple items from a searchable list in a popover.
 * Selected items are displayed as badges within the component's trigger button.
 */
export const MultiSelect = React.forwardRef<
    HTMLButtonElement,
    MultiSelectProps
>(
    (
        {
            options,
            onValueChange,
            variant,
            defaultValue = [],
            placeholder = "Select opties",
            animation = 0,
            maxCount = 10,
            modalPopover = false,
            className,
            name = "multi-select",
            ...props
        },
        ref,
    ) => {
        const [selectedValues, setSelectedValues] =
            React.useState<string[]>(defaultValue)
        const [isPopoverOpen, setIsPopoverOpen] = React.useState(false)
        const [isAnimating, setIsAnimating] = React.useState(false)

        const handleInputKeyDown = (
            event: React.KeyboardEvent<HTMLInputElement>,
        ) => {
            if (event.key === "Enter") {
                setIsPopoverOpen(true)
            } else if (
                event.key === "Backspace" &&
                !event.currentTarget.value
            ) {
                const newSelectedValues = [...selectedValues]
                newSelectedValues.pop()
                setSelectedValues(newSelectedValues)
                onValueChange(newSelectedValues)
            }
        }

        const toggleOption = (option: string) => {
            const newSelectedValues = selectedValues.includes(option)
                ? selectedValues.filter((value) => value !== option)
                : [...selectedValues, option]
            setSelectedValues(newSelectedValues)
            onValueChange(newSelectedValues)
        }

        const handleClear = () => {
            setSelectedValues([])
            onValueChange([])
        }

        const handleTogglePopover = () => {
            setIsPopoverOpen((prev) => !prev)
        }

        const clearExtraOptions = () => {
            const newSelectedValues = selectedValues.slice(0, maxCount)
            setSelectedValues(newSelectedValues)
            onValueChange(newSelectedValues)
        }

        const toggleAll = () => {
            if (selectedValues.length === options.length) {
                handleClear()
            } else {
                const allValues = options.map((option) => option.value)
                setSelectedValues(allValues)
                onValueChange(allValues)
            }
        }

        return (
            <Popover
                open={isPopoverOpen}
                onOpenChange={setIsPopoverOpen}
                modal={modalPopover}
            >
                <PopoverTrigger asChild>
                    <Button
                        ref={ref}
                        {...props}
                        onClick={handleTogglePopover}
                        className={cn(
                            "flex w-full p-1 rounded-md border min-h-10 h-auto items-center justify-between bg-inherit hover:bg-inherit [&_svg]:pointer-events-auto",
                            className,
                        )}
                        name={name}
                    >
                        {selectedValues.length > 0 ? (
                            <div className="flex justify-between items-center w-full">
                                <div className="flex flex-wrap items-center">
                                    {selectedValues
                                        .slice(0, maxCount)
                                        .map((value) => {
                                            const option = options.find(
                                                (o) => o.value === value,
                                            )
                                            const IconComponent = option?.icon
                                            return (
                                                <Badge
                                                    key={value}
                                                    className={cn(
                                                        isAnimating &&
                                                            "animate-bounce",
                                                        multiSelectVariants({
                                                            variant,
                                                        }),
                                                    )}
                                                    style={{
                                                        animationDuration: `${animation}s`,
                                                    }}
                                                >
                                                    {IconComponent && (
                                                        <IconComponent className="h-4 w-4 mr-2" />
                                                    )}
                                                    {option?.label}
                                                    <XCircle
                                                        className="ml-2 h-4 w-4 cursor-pointer"
                                                        onClick={(event) => {
                                                            event.stopPropagation()
                                                            toggleOption(value)
                                                        }}
                                                    />
                                                </Badge>
                                            )
                                        })}
                                    {selectedValues.length > maxCount && (
                                        <Badge
                                            className={cn(
                                                "bg-transparent text-foreground border-foreground/1 hover:bg-transparent",
                                                isAnimating &&
                                                    "animate-bounce",
                                                multiSelectVariants({
                                                    variant,
                                                }),
                                            )}
                                            style={{
                                                animationDuration: `${animation}s`,
                                            }}
                                        >
                                            {`+ ${selectedValues.length - maxCount} meer`}
                                            <XCircle
                                                className="ml-2 h-4 w-4 cursor-pointer"
                                                onClick={(event) => {
                                                    event.stopPropagation()
                                                    clearExtraOptions()
                                                }}
                                            />
                                        </Badge>
                                    )}
                                </div>
                                <div className="flex items-center justify-between">
                                    <XIcon
                                        className="h-4 mx-2 cursor-pointer text-muted-foreground"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            handleClear()
                                        }}
                                    />
                                    <Separator
                                        orientation="vertical"
                                        className="flex min-h-6 h-full"
                                    />
                                    <ChevronDown className="h-4 mx-2 cursor-pointer text-muted-foreground" />
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between w-full mx-auto">
                                <span className="text-sm text-muted-foreground mx-3">
                                    {placeholder}
                                </span>
                                <ChevronDown className="h-4 cursor-pointer text-muted-foreground mx-2" />
                            </div>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent
                    className="w-auto p-0"
                    align="start"
                    onEscapeKeyDown={() => setIsPopoverOpen(false)}
                >
                    <Command>
                        <CommandInput
                            placeholder="Zoeken..."
                            onKeyDown={handleInputKeyDown}
                        />
                        <CommandList>
                            <CommandEmpty>
                                Geen resultaten gevonden.
                            </CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    key="all"
                                    onSelect={toggleAll}
                                    className="cursor-pointer"
                                >
                                    <div
                                        className={cn(
                                            "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                            selectedValues.length ===
                                                options.length
                                                ? "bg-primary text-primary-foreground"
                                                : "opacity-50 [&_svg]:invisible",
                                        )}
                                    >
                                        <CheckIcon className="h-4 w-4" />
                                    </div>
                                    <span>
                                        <i>Selecteer alles</i>
                                    </span>
                                </CommandItem>
                                {options.map((option) => {
                                    const isSelected = selectedValues.includes(
                                        option.value,
                                    )
                                    return (
                                        <CommandItem
                                            key={option.value}
                                            onSelect={() =>
                                                toggleOption(option.value)
                                            }
                                            className="cursor-pointer"
                                        >
                                            <div
                                                className={cn(
                                                    "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                                                    isSelected
                                                        ? "bg-primary text-primary-foreground"
                                                        : "opacity-50 [&_svg]:invisible",
                                                )}
                                            >
                                                <CheckIcon className="h-4 w-4" />
                                            </div>
                                            {option.icon && (
                                                <option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                            )}
                                            <span>{option.label}</span>
                                        </CommandItem>
                                    )
                                })}
                            </CommandGroup>
                            <CommandSeparator />
                            <CommandGroup>
                                <div className="flex items-center justify-between">
                                    {selectedValues.length > 0 && (
                                        <>
                                            <CommandItem
                                                onSelect={handleClear}
                                                className="flex-1 justify-center cursor-pointer"
                                            >
                                                Wissen
                                            </CommandItem>
                                            <Separator
                                                orientation="vertical"
                                                className="flex min-h-6 h-full"
                                            />
                                        </>
                                    )}
                                    <CommandItem
                                        onSelect={() => setIsPopoverOpen(false)}
                                        className="flex-1 justify-center cursor-pointer max-w-full"
                                    >
                                        Sluiten
                                    </CommandItem>
                                </div>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
                {animation > 0 && selectedValues.length > 0 && (
                    <WandSparkles
                        className={cn(
                            "cursor-pointer my-2 text-foreground bg-background w-3 h-3",
                            isAnimating ? "" : "text-muted-foreground",
                        )}
                        onClick={() => setIsAnimating(!isAnimating)}
                    />
                )}
            </Popover>
        )
    },
)

MultiSelect.displayName = "MultiSelect"
