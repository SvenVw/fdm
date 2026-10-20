import type { MineralizationUsedInput } from "@nmi-agro/fdm-calculator"
import type { ReactNode } from "react"
import { ArrowRight, ChevronDown } from "lucide-react"
import { NavLink } from "react-router"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible"
import { formatLongDate, formatNumber } from "~/lib/mineralization"

/** Name and unit of a soil parameter. */
export type SoilParameterLabels = Record<string, { name: string; unit: string }>

function Section({
  title,
  editHref,
  editLabel,
  children,
}: {
  title: string
  editHref?: string
  editLabel?: string
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">{title}</h3>
        {editHref ? (
          <Button asChild variant="link" size="sm" className="h-auto p-0 text-xs">
            <NavLink to={editHref}>
              {editLabel}
              <ArrowRight aria-hidden />
            </NavLink>
          </Button>
        ) : null}
      </div>
      {children}
    </section>
  )
}

/**
 * Shows exactly which data was sent to Dyna, with links to where it can be completed.
 */
export function UsedInput({
  usedInput,
  soilLabels,
  fieldHref,
  partial,
}: {
  usedInput: MineralizationUsedInput
  soilLabels: SoilParameterLabels
  /** Base path of the field pages, e.g. `/farm/:id/:calendar/field/:b_id`. */
  fieldHref: string
  partial: boolean
}) {
  const label = (parameter: string) => soilLabels[parameter]?.name ?? parameter
  const unit = (parameter: string) => soilLabels[parameter]?.unit ?? ""

  return (
    <Collapsible id="gebruikte-gegevens">
      <CollapsibleTrigger asChild>
        <Button variant="ghost" size="sm" className="group -ml-2">
          <ChevronDown
            className="transition-transform group-data-[state=open]:rotate-180"
            aria-hidden
          />
          Gebruikte gegevens voor de berekening
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 grid gap-6 rounded-xl border p-4 md:grid-cols-2">
          <Section title="Bodem" editHref={`${fieldHref}/soil`} editLabel="Bodemanalyse toevoegen">
            {usedInput.soil.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {usedInput.soil.map((s) => (
                  <li key={s.parameter} className="flex justify-between gap-3">
                    <span className="text-muted-foreground">{label(s.parameter)}</span>
                    <span className="text-right tabular-nums">
                      {typeof s.value === "number" ? formatNumber(s.value, 2) : s.value}{" "}
                      {unit(s.parameter)}
                      {s.date ? (
                        <span className="text-muted-foreground"> · {formatLongDate(s.date)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Geen bodemanalyse bekend.</p>
            )}
            {usedInput.missingSoilParameters.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                Niet gemeten, Dyna gebruikt een schatting:{" "}
                {usedInput.missingSoilParameters.map(label).join(", ")}.
              </p>
            ) : null}
          </Section>

          <Section
            title="Teelten"
            editHref={`${fieldHref}/cultivation`}
            editLabel="Teelten bekijken"
          >
            <ul className="space-y-1.5 text-sm">
              {usedInput.cultivations.map((c) => (
                <li key={c.b_lu} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    {c.b_lu_name ?? c.b_lu_catalogue}
                    <Badge variant="outline" className="font-normal">
                      {c.role === "main" ? "Hoofdteelt" : "Na hoofdteelt"}
                    </Badge>
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {formatLongDate(c.start)} – {formatLongDate(c.end)}
                  </span>
                </li>
              ))}
            </ul>
            {partial ? (
              <p className="text-muted-foreground text-xs">
                De teelt na de hoofdteelt kon nog niet worden meegerekend.
              </p>
            ) : null}
          </Section>

          <Section
            title="Oogsten"
            editHref={`${fieldHref}/cultivation`}
            editLabel="Oogst aanpassen"
          >
            {usedInput.harvests.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {usedInput.harvests.map((h) => (
                  <li key={`${h.b_lu}-${h.date}`} className="flex justify-between gap-3">
                    <span className="flex items-center gap-2">
                      {formatLongDate(h.date)}
                      <Badge variant={h.planned ? "outline" : "secondary"} className="font-normal">
                        {h.planned ? "Gepland" : "Gemeten"}
                      </Badge>
                    </span>
                    <span className="text-muted-foreground tabular-nums">
                      {h.b_lu_yield !== null
                        ? `${formatNumber(h.b_lu_yield)} kg DS/ha`
                        : "Opbrengst onbekend"}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Geen oogst nodig voor deze teelt.</p>
            )}
          </Section>

          <Section
            title="Bemestingen"
            editHref={`${fieldHref}/fertilizer`}
            editLabel="Bemestingen bekijken"
          >
            {usedInput.fertilizerApplications.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {usedInput.fertilizerApplications.map((a) => (
                  <li key={a.p_app_id} className="flex justify-between gap-3">
                    <span>
                      {formatLongDate(a.date)} · {a.p_name_nl ?? "Meststof"}
                    </span>
                    <span className="text-muted-foreground text-right tabular-nums">
                      {a.amount !== null ? `${formatNumber(a.amount, 1)} ${a.unit}` : "–"}
                      {a.p_n_rt !== null ? ` · ${formatNumber(a.p_n_rt, 1)} g N/kg` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground text-sm">Geen bemestingen in dit jaar.</p>
            )}
            {usedInput.skippedApplications.length > 0 ? (
              <p className="text-muted-foreground text-xs">
                {usedInput.skippedApplications.length} bemesting(en) niet meegenomen: de meststof is
                niet bekend op dit bedrijf.
              </p>
            ) : null}
          </Section>

          <p className="text-muted-foreground text-xs md:col-span-2">
            Locatie: {formatNumber(usedInput.location.a_lat, 4)}° N,{" "}
            {formatNumber(usedInput.location.a_lon, 4)}° O
          </p>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
