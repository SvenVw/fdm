import { cn } from "~/lib/utils"

export type ImpactBarTone = "ok" | "under" | "over"

const TONE_CLASSES: Record<ImpactBarTone, string> = {
  ok: "bg-green-500",
  under: "bg-orange-500",
  over: "bg-red-500",
}

/**
 * A horizontal bar that shows a current value, the part added by a new application, and the
 * remaining room up to a reference (norm or advice).
 *
 * The added part uses the same hue as the current part with a hatched fill, so the two can be
 * told apart without relying on colour. The bar is decorative: the values must also be shown as
 * text next to it.
 *
 * @param current - The current value.
 * @param after - The value after the application. Omit when there is no preview.
 * @param reference - The norm or advice. When 0, any value fills the bar.
 * @param tone - The status of the value that is shown (after, or current without preview).
 */
export function ImpactBar({
  current,
  after,
  reference,
  tone,
  className,
}: {
  current: number
  after?: number
  reference: number
  tone: ImpactBarTone
  className?: string
}) {
  const scale = Math.max(reference, current, after ?? 0)
  const toPercent = (value: number) => (scale > 0 ? Math.min((value / scale) * 100, 100) : 0)
  const currentPercent = toPercent(Math.max(current, 0))
  const addedPercent =
    after !== undefined ? Math.max(toPercent(Math.max(after, 0)) - currentPercent, 0) : 0
  const referencePercent = toPercent(reference)

  return (
    <div
      aria-hidden="true"
      className={cn("bg-muted relative h-2 w-full overflow-hidden rounded-full", className)}
    >
      <div className="flex h-full">
        <div
          className={cn(
            "h-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
            TONE_CLASSES[tone],
          )}
          style={{ width: `${currentPercent}%` }}
        />
        {addedPercent > 0 && (
          <div
            className={cn(
              "h-full bg-[repeating-linear-gradient(135deg,transparent_0_3px,rgb(255_255_255/0.55)_3px_6px)] transition-[width] duration-300 ease-out motion-reduce:transition-none",
              TONE_CLASSES[tone],
            )}
            style={{ width: `${addedPercent}%` }}
          />
        )}
      </div>
      {reference > 0 && referencePercent < 100 && (
        <div
          className="bg-foreground/60 absolute inset-y-0 w-px"
          style={{ left: `${referencePercent}%` }}
        />
      )}
    </div>
  )
}
