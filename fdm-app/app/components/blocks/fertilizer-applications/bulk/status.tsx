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
  not_calculated: "Niet berekend",
}

const FIELD_STATUS_STYLE: Record<FieldImpactStatus, { icon: LucideIcon; className: string }> = {
  ok: { icon: CircleCheck, className: "text-green-700 dark:text-green-400" },
  over_advice: { icon: ArrowUp, className: "text-red-700 dark:text-red-400" },
  over_target: { icon: TriangleAlert, className: "text-red-700 dark:text-red-400" },
  missing_soil_data: { icon: AlertTriangle, className: "text-amber-700 dark:text-amber-400" },
  bufferstrip: { icon: CircleSlash, className: "text-muted-foreground" },
  no_crop: { icon: Sprout, className: "text-muted-foreground" },
  not_calculated: { icon: AlertTriangle, className: "text-amber-700 dark:text-amber-400" },
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
  { icon: LucideIcon; label: string; className: string }
> = {
  under: { icon: ArrowDown, label: "Onder", className: "text-orange-700 dark:text-orange-400" },
  "on-target": {
    icon: CircleCheck,
    label: "Binnen",
    className: "text-green-700 dark:text-green-400",
  },
  over: { icon: ArrowUp, label: "Boven", className: "text-red-700 dark:text-red-400" },
}

/**
 * The status of a value compared with its reference, as an icon with an optional short label.
 *
 * @param noun - The reference, for example "advies" or "norm". Shown after the label.
 * @param compact - Show only the icon, with the label for screen readers.
 */
export function ComparisonLabel({
  status,
  noun,
  compact = false,
}: {
  status: ComparisonStatus
  noun: string
  compact?: boolean
}) {
  const { icon: Icon, label, className } = COMPARISON_STYLE[status]
  const text = `${label} ${noun}`
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0" aria-hidden="true" />
      {compact ? <span className="sr-only">{text}</span> : text}
    </span>
  )
}

/** Formats a number with Dutch notation and no decimals. */
export function formatKg(value: number) {
  const rounded = Math.round(value)
  return (Object.is(rounded, -0) ? 0 : rounded).toLocaleString("nl-NL")
}
