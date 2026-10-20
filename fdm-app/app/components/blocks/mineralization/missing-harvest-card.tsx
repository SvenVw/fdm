import { CalendarX2 } from "lucide-react"
import { useFetcher } from "react-router"
import type { MineralizationMainCultivation } from "~/lib/mineralization"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Input } from "~/components/ui/input"
import { Label } from "~/components/ui/label"
import { Spinner } from "~/components/ui/spinner"

/**
 * Asks for the measured or planned harvest of the main cultivation; Dyna needs it to calculate.
 */
export function MissingHarvestCard({
  mainCultivation,
  defaultHarvestDate,
  year,
}: {
  mainCultivation: MineralizationMainCultivation
  defaultHarvestDate: string | null
  year: number
}) {
  const fetcher = useFetcher()
  const busy = fetcher.state !== "idle"
  const cropName = mainCultivation.b_lu_name ?? mainCultivation.b_lu_catalogue

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarX2 className="size-5" aria-hidden />
          Oogst ontbreekt
        </CardTitle>
        <CardDescription>
          Vul de gemeten of geplande oogst van {cropName} in om de mineralisatie te berekenen. Een
          datum in de toekomst geldt als geplande oogst; die kun je later aanpassen.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <fetcher.Form method="post" className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <input type="hidden" name="intent" value="save_harvest" />
          <input type="hidden" name="b_lu" value={mainCultivation.b_lu} />
          <div className="grid gap-1.5">
            <Label htmlFor="b_lu_harvest_date">Oogstdatum</Label>
            <Input
              id="b_lu_harvest_date"
              name="b_lu_harvest_date"
              type="date"
              required
              min={`${year}-01-01`}
              max={`${year}-12-31`}
              defaultValue={defaultHarvestDate ?? ""}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="b_lu_yield">
              Opbrengst{" "}
              <span className="text-muted-foreground font-normal">(kg DS/ha, optioneel)</span>
            </Label>
            <Input
              id="b_lu_yield"
              name="b_lu_yield"
              type="number"
              min={0}
              step={100}
              inputMode="numeric"
            />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : null}
            Oogst opslaan
          </Button>
        </fetcher.Form>
      </CardContent>
    </Card>
  )
}
