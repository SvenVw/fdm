import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react"
import { useMemo, useState } from "react"
import { NavLink } from "react-router"
import { computeAdviceProgress } from "~/components/blocks/nutrient-advice/progress-bar"
import { Checkbox } from "~/components/ui/checkbox"
import { Label } from "~/components/ui/label"
import { Skeleton } from "~/components/ui/skeleton"
import { Switch } from "~/components/ui/switch"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { cn } from "~/lib/utils"
import type { FieldImpactRow } from "./aggregate"
import type { BulkNutrient } from "./types"
import { CultivationBadge } from "./cultivation-badge"
import { ComparisonLabel, FieldStatusLabel, formatKg, isDeviation } from "./status"

type SortKey = "name" | "area" | "crop" | "n" | "p" | "k" | "balance" | "status"

const NUTRIENT_HEADERS: Record<BulkNutrient, string> = { n: "N", p: "P₂O₅", k: "K₂O" }

function sortValue(row: FieldImpactRow, key: SortKey): number | string {
  switch (key) {
    case "name":
      return row.b_name.toLocaleLowerCase("nl-NL")
    case "area":
      return row.b_area
    case "crop":
      return (row.mainCultivationName ?? "").toLocaleLowerCase("nl-NL")
    case "n":
    case "p":
    case "k": {
      const dose = row.doseAfter ?? row.dose
      const advice = row.advice?.[key]
      if (!dose || advice === undefined) return Number.NEGATIVE_INFINITY
      return advice > 0 ? dose[key] / advice : dose[key] > 0 ? Number.POSITIVE_INFINITY : 0
    }
    case "balance": {
      const balance = row.balanceAfter ?? row.balance
      return balance ? balance.balance - balance.target : Number.NEGATIVE_INFINITY
    }
    case "status":
      return row.statuses.filter(isDeviation).length
  }
}

function SortableHead({
  label,
  sortKey,
  sort,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  sort: { key: SortKey; desc: boolean }
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = sort.key === sortKey
  const Icon = active ? (sort.desc ? ArrowDown : ArrowUp) : ArrowUpDown
  return (
    <TableHead
      className={className}
      aria-sort={active ? (sort.desc ? "descending" : "ascending") : "none"}
    >
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "hover:text-foreground inline-flex items-center gap-1 whitespace-nowrap",
          active && "text-foreground",
        )}
      >
        {label}
        <Icon className="size-3" aria-hidden="true" />
      </button>
    </TableHead>
  )
}

function NutrientCell({ row, nutrient }: { row: FieldImpactRow; nutrient: BulkNutrient }) {
  const dose = (row.included ? row.doseAfter : undefined) ?? row.dose
  const advice = row.advice?.[nutrient]
  if (!dose || advice === undefined) {
    return <span className="text-muted-foreground">–</span>
  }
  const { status } = computeAdviceProgress(dose[nutrient], advice)
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
      <span>
        <span className={cn(row.included && row.doseAfter && "font-semibold")}>
          {formatKg(dose[nutrient])}
        </span>
        <span className="text-muted-foreground"> / {formatKg(advice)}</span>
      </span>
      <ComparisonLabel status={status} noun="advies" />
    </span>
  )
}

function BalanceCell({ row }: { row: FieldImpactRow }) {
  const balance = (row.included ? row.balanceAfter : undefined) ?? row.balance
  if (!balance) return <span className="text-muted-foreground">–</span>
  const isOver = balance.balance > balance.target
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap tabular-nums">
      <span>
        <span className={cn(row.included && row.balanceAfter && "font-semibold")}>
          {formatKg(balance.balance)}
        </span>
        <span className="text-muted-foreground"> / {formatKg(balance.target)}</span>
      </span>
      <ComparisonLabel status={isOver ? "over" : "on-target"} noun="streefwaarde" />
    </span>
  )
}

/**
 * The per-field breakdown of the bulk fertilizer application page.
 *
 * Each row can be excluded from the application. Excluded fields are also left out of the advice
 * and nitrogen balance aggregation, but stay visible so they can be included again. Values show
 * the dose and balance after the application when a preview is available.
 */
export function FieldImpactTable({
  rows,
  loading,
  b_id_farm,
  calendar,
  onSetIncluded,
  disabled,
  selectable = true,
}: {
  rows: FieldImpactRow[]
  loading: boolean
  b_id_farm: string
  calendar: string
  /** Includes or excludes the given fields. Not used when `selectable` is `false`. */
  onSetIncluded?: (b_ids: string[], included: boolean) => void
  disabled?: boolean
  /** Show a checkbox per field to include or exclude it. */
  selectable?: boolean
}) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "name", desc: false })
  const [deviationsOnly, setDeviationsOnly] = useState(false)

  const handleSort = (key: SortKey) =>
    setSort((prev) => ({ key, desc: prev.key === key ? !prev.desc : key !== "name" }))

  const visibleRows = useMemo(() => {
    const filtered = deviationsOnly
      ? rows.filter((row) => !row.hasSelectedCrop || row.statuses.some(isDeviation))
      : rows
    return [...filtered].sort((a, b) => {
      const va = sortValue(a, sort.key)
      const vb = sortValue(b, sort.key)
      const order =
        typeof va === "string" && typeof vb === "string"
          ? va.localeCompare(vb, "nl-NL")
          : Number(va) - Number(vb)
      return (sort.desc ? -order : order) || a.b_name.localeCompare(b.b_name, "nl-NL")
    })
  }, [rows, sort, deviationsOnly])

  const allIncluded = rows.length > 0 && rows.every((row) => row.included)
  const someIncluded = rows.some((row) => row.included)
  const deviationCount = rows.filter(
    (row) => !row.hasSelectedCrop || row.statuses.some(isDeviation),
  ).length

  return (
    <section aria-label="Percelen" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Percelen</h3>
          <p className="text-muted-foreground text-xs">
            {selectable
              ? "Waarden na deze gift, in kg per ha. Vink een perceel uit om het over te slaan."
              : "Waarden na de wijziging, in kg per ha."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            id="bulk-deviations-only"
            checked={deviationsOnly}
            onCheckedChange={setDeviationsOnly}
          />
          <Label htmlFor="bulk-deviations-only" className="text-sm font-normal">
            Alleen afwijkingen
            {!loading && <span className="text-muted-foreground"> ({deviationCount})</span>}
          </Label>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    aria-label="Alle percelen meenemen"
                    checked={allIncluded ? true : someIncluded ? "indeterminate" : false}
                    disabled={disabled}
                    onCheckedChange={(checked) =>
                      onSetIncluded?.(
                        rows.map((row) => row.b_id),
                        checked === true,
                      )
                    }
                  />
                </TableHead>
              )}
              <SortableHead label="Perceel" sortKey="name" sort={sort} onSort={handleSort} />
              <SortableHead
                label="Oppervlakte"
                sortKey="area"
                sort={sort}
                onSort={handleSort}
                className="text-right"
              />
              <SortableHead label="Gewas" sortKey="crop" sort={sort} onSort={handleSort} />
              {(["n", "p", "k"] as const).map((nutrient) => (
                <SortableHead
                  key={nutrient}
                  label={NUTRIENT_HEADERS[nutrient]}
                  sortKey={nutrient}
                  sort={sort}
                  onSort={handleSort}
                />
              ))}
              <SortableHead label="N-balans" sortKey="balance" sort={sort} onSort={handleSort} />
              <SortableHead label="Status" sortKey="status" sort={sort} onSort={handleSort} />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRows.map((row) => (
              <TableRow
                key={row.b_id}
                // Excluded fields are dimmed; included fields keep the normal background for contrast
                className={cn(!row.included && "text-muted-foreground")}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      aria-label={`${row.b_name} meenemen`}
                      checked={row.included}
                      disabled={disabled}
                      onCheckedChange={(checked) => onSetIncluded?.([row.b_id], checked === true)}
                    />
                  </TableCell>
                )}
                <TableCell className="max-w-48">
                  <span className="flex items-center gap-1.5">
                    <NavLink
                      to={`/farm/${b_id_farm}/${calendar}/field/${row.b_id}/fertilizer`}
                      className="truncate font-medium underline-offset-4 hover:underline"
                    >
                      {row.b_name}
                    </NavLink>
                    {!row.hasSelectedCrop && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <AlertTriangle
                            className="size-4 shrink-0 text-amber-600"
                            aria-label="Dit perceel heeft het geselecteerde gewas niet"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          Dit perceel heeft het geselecteerde gewas niet
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </span>
                </TableCell>
                <TableCell className="text-right whitespace-nowrap tabular-nums">
                  {row.b_area.toLocaleString("nl-NL")} ha
                </TableCell>
                <TableCell className="max-w-40">
                  {row.mainCultivationName ? (
                    <CultivationBadge
                      name={row.mainCultivationName}
                      cropRotation={row.mainCultivationCropRotation}
                    />
                  ) : (
                    <span className="text-muted-foreground">–</span>
                  )}
                </TableCell>
                {(["n", "p", "k"] as const).map((nutrient) => (
                  <TableCell key={nutrient}>
                    {loading ? (
                      <Skeleton className="h-4 w-16" />
                    ) : (
                      <NutrientCell row={row} nutrient={nutrient} />
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  {loading ? <Skeleton className="h-4 w-16" /> : <BalanceCell row={row} />}
                </TableCell>
                <TableCell>
                  {loading ? (
                    <Skeleton className="h-4 w-20" />
                  ) : (
                    <span className="flex flex-wrap gap-x-2 gap-y-0.5">
                      {row.statuses.map((status) =>
                        row.messages.length > 0 &&
                        (status === "missing_soil_data" ||
                          status === "no_advice" ||
                          status === "no_balance") ? (
                          <Tooltip key={status}>
                            <TooltipTrigger asChild>
                              <button type="button">
                                <FieldStatusLabel status={status} />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs">
                              {row.messages.join(" ")}
                            </TooltipContent>
                          </Tooltip>
                        ) : (
                          <FieldStatusLabel key={status} status={status} />
                        ),
                      )}
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={selectable ? 9 : 8}
                  className="text-muted-foreground h-16 text-center"
                >
                  {deviationsOnly ? "Geen afwijkende percelen." : "Geen percelen geselecteerd."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </section>
  )
}
