import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CircleCheck,
  CircleSlash,
  type LucideIcon,
  Sprout,
  TriangleAlert,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import type { FieldImpactStatus } from "./aggregate"

/** Dutch labels for the field statuses. */
export const FIELD_STATUS_LABELS: Record<FieldImpactStatus, string> = {
  ok: "OK",
  over_advice: "Boven advies",
  over_target: "Boven streefwaarde",
  missing_soil_data: "Bodemdata ontbreekt",
  bufferstrip: "Bufferstrook",
  no_crop: "Geen gewas",
  no_advice: "Geen advies",
  no_balance: "Geen balans",
}

const FIELD_STATUS_STYLE: Record<FieldImpactStatus, { icon: LucideIcon; className: string }> = {
  // OK is the normal case and stays neutral, so colour is left for deviations
  ok: { icon: CircleCheck, className: "text-muted-foreground" },
  over_advice: { icon: ArrowUp, className: "text-red-700 dark:text-red-400" },
  over_target: { icon: TriangleAlert, className: "text-red-700 dark:text-red-400" },
  missing_soil_data: { icon: AlertTriangle, className: "text-amber-700 dark:text-amber-400" },
  bufferstrip: { icon: CircleSlash, className: "text-muted-foreground" },
  no_crop: { icon: Sprout, className: "text-muted-foreground" },
  no_advice: { icon: AlertTriangle, className: "text-amber-700 dark:text-amber-400" },
  no_balance: { icon: AlertTriangle, className: "text-amber-700 dark:text-amber-400" },
}

/** Returns whether a status means the field deviates and deserves attention. */
export function isDeviation(status: FieldImpactStatus) {
  return status !== "ok"
}

/** A field status with an icon and text, so it never relies on colour alone. */
export function FieldStatusLabel({ status }: { status: FieldImpactStatus }) {
  const { icon: Icon, className } = FIELD_STATUS_STYLE[status]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {FIELD_STATUS_LABELS[status]}
    </span>
  )
}

export type ComparisonStatus = "under" | "on-target" | "over"

const COMPARISON_STYLE: Record<
  ComparisonStatus,
  { icon?: LucideIcon; label: string; className: string }
> = {
  under: { icon: ArrowDown, label: "Onder", className: "text-orange-700 dark:text-orange-400" },
  // Within the reference is the normal case: no icon and no colour, so deviations stand out
  "on-target": { label: "Binnen", className: "text-muted-foreground" },
  over: { icon: ArrowUp, label: "Boven", className: "text-red-700 dark:text-red-400" },
}

/**
 * The status of a value compared with its reference, as a small icon with the full text in a
 * tooltip; the colour of the bar already shows the status. Within the reference nothing is shown,
 * only the text for screen readers.
 *
 * @param noun - The reference, for example "advies" or "norm".
 */
export function ComparisonLabel({ status, noun }: { status: ComparisonStatus; noun: string }) {
  const { icon: Icon, label, className } = COMPARISON_STYLE[status]
  const text = `${label} ${noun}`
  if (!Icon) return <span className="sr-only">{text}</span>
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={text}
          tabIndex={0}
          className={cn("inline-flex shrink-0 rounded-sm outline-offset-2", className)}
        >
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
      </TooltipTrigger>
      <TooltipContent>{text}</TooltipContent>
    </Tooltip>
  )
}

/** Formats a number with Dutch notation and no decimals. */
export function formatKg(value: number) {
  const rounded = Math.round(value)
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("nl-NL")
}
