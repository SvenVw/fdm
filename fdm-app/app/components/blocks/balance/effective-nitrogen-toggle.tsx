import { useSearchParams } from "react-router"
import { Label } from "~/components/ui/label"
import { Switch } from "~/components/ui/switch"

/** Search parameter that selects the nitrogen balance with effective nitrogen. */
const EFFECTIVE_NITROGEN_PARAM = "stikstof"
const EFFECTIVE_NITROGEN_VALUE = "werkzaam"

/**
 * Returns whether the nitrogen balance should be calculated with effective nitrogen,
 * based on the search parameters of the request URL.
 *
 * @param request - The request of the loader.
 * @returns `true` when the URL contains `?stikstof=werkzaam`.
 */
export function isEffectiveNitrogenRequested(request: Request): boolean {
  return (
    new URL(request.url).searchParams.get(EFFECTIVE_NITROGEN_PARAM) === EFFECTIVE_NITROGEN_VALUE
  )
}

/**
 * Toggle between the nitrogen balance with total nitrogen and with effective nitrogen
 * (total N × N-werkingscoëfficiënt of the fertilizer). The choice is stored in the URL,
 * so the loaders recalculate the balance and the choice is kept when the page is shared.
 */
export function EffectiveNitrogenToggle() {
  const [searchParams, setSearchParams] = useSearchParams()
  const checked = searchParams.get(EFFECTIVE_NITROGEN_PARAM) === EFFECTIVE_NITROGEN_VALUE

  const onCheckedChange = (value: boolean) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) {
          next.set(EFFECTIVE_NITROGEN_PARAM, EFFECTIVE_NITROGEN_VALUE)
        } else {
          next.delete(EFFECTIVE_NITROGEN_PARAM)
        }
        return next
      },
      { preventScrollReset: true },
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Switch id="effective-nitrogen-toggle" checked={checked} onCheckedChange={onCheckedChange} />
      <Label htmlFor="effective-nitrogen-toggle" className="cursor-pointer text-sm select-none">
        {checked ? "Werkzame stikstof" : "Totale stikstof"}
      </Label>
    </div>
  )
}
