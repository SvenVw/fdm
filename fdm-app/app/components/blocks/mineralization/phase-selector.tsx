import type { SeasonPhase } from "@nmi-agro/fdm-calculator"
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group"
import { PHASE_LABELS } from "~/lib/mineralization"

const PHASES: SeasonPhase[] = ["planning", "growing", "evaluation"]

/**
 * Switches between the three moments of the season. The phase that matches today is marked.
 */
export function PhaseSelector({
  value,
  defaultPhase,
  onChange,
}: {
  value: SeasonPhase
  defaultPhase: SeasonPhase
  onChange: (phase: SeasonPhase) => void
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      onValueChange={(next) => {
        if (next) onChange(next as SeasonPhase)
      }}
      aria-label="Moment in het seizoen"
    >
      {PHASES.map((phase) => (
        <ToggleGroupItem key={phase} value={phase} className="px-3">
          {PHASE_LABELS[phase]}
          {phase === defaultPhase ? (
            <span className="text-muted-foreground ml-1 text-xs font-normal">(nu)</span>
          ) : null}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
