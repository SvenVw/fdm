/**
 * @file This file defines the `FieldFilterToggle` component, a UI control for
 * toggling the visibility of non-productive fields (e.g., buffer strips).
 *
 * @packageDocumentation
 */
import { PanelsRightBottom, Square } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { useFieldFilterStore } from "~/store/field-filter"

/**
 * A toggle button component for filtering fields.
 *
 * This component provides a user interface for toggling a filter that controls
 * whether non-productive fields, such as buffer strips (`bufferstroken`), are
 * visible. It integrates with the `useFieldFilterStore` (Zustand) to manage
 * the global filter state.
 *
 * The button's icon and tooltip dynamically update to reflect the current
 * filter state:
 * - When `showProductiveOnly` is true, it displays a solid square, indicating
 *   that some fields are hidden.
 * - When `showProductiveOnly` is false, it displays a different icon, indicating
 *   that all fields are shown.
 */
export function FieldFilterToggle() {
    const { showProductiveOnly, toggleShowProductiveOnly } =
        useFieldFilterStore()

    const tooltipContent = showProductiveOnly
        ? "Bufferstroken zijn verborgen"
        : "Alle percelen (incl. bufferstroken) zijn weergegeven"

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleShowProductiveOnly}
                        className="border hover:bg-accent hover:text-accent-foreground"
                        aria-label={tooltipContent}
                        aria-pressed={showProductiveOnly}
                    >
                        {showProductiveOnly ? (
                            <Square className="h-4 w-4 text-primary" />
                        ) : (
                            <PanelsRightBottom className="h-4 w-4" />
                        )}
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipContent}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}
