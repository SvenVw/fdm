import { getCultivationColor } from "~/components/custom/cultivation-colors"
import { Badge } from "~/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"

/** A cultivation as a badge in its crop rotation colour, as in the rotation table. */
export function CultivationBadge({
  name,
  cropRotation,
}: {
  name: string
  cropRotation: string | null | undefined
}) {
  return (
    <Badge
      style={{ backgroundColor: getCultivationColor(cropRotation ?? undefined) }}
      className="max-w-full truncate text-white"
      variant="default"
    >
      {name}
    </Badge>
  )
}

/**
 * A cultivation as a dot in its crop rotation colour, with the name in a tooltip. For tight
 * places such as the header of a block.
 *
 * @param label - The text in the tooltip, for example "Advies voor Grasland".
 */
export function CultivationDot({
  label,
  cropRotation,
}: {
  label: string
  cropRotation: string | null | undefined
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          role="img"
          aria-label={label}
          tabIndex={0}
          className="inline-block size-3 shrink-0 rounded-full outline-offset-2"
          style={{ backgroundColor: getCultivationColor(cropRotation ?? undefined) }}
        />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}
