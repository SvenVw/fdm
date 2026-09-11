import { createColumnHelper, type Row } from "@tanstack/react-table"
import { ChevronRight } from "lucide-react"
import { useMemo } from "react"
import { NavLink } from "react-router"
import { cn } from "@/app/lib/utils"
import { DataTableColumnHeader } from "~/components/blocks/data-table/column-header"
import { getHarvestTerm } from "~/components/blocks/harvest/utils"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger } from "~/components/ui/tooltip"
import { CropResidueCheckbox } from "./crop-residue-checkbox"
import { DateRangeDisplay } from "./date-range-display"
import { TableDateSelector } from "./date-selector"
import { FertilizerDisplay } from "./fertilizer-display"
import { HarvestDatesDisplay } from "./harvest-dates-display"
import { NameCell } from "./name-cell"
import { rotationTableFeatures } from "./table-features"
import { TableVarietySelector } from "./variety-selector"

export type CropRow = {
  type: "crop"
  canModify: boolean
  b_lu_catalogue: string
  b_lu_name: string
  b_lu_eom_residue: number | null
  b_lu_variety_options: { label: string; value: string }[] | null
  b_lu_croprotation: string
  b_lu_harvestable: "once" | "multiple" | "none"
  calendar: string
  fields: FieldRow[]
}

export type FieldRow = {
  type: "field"
  canModify: boolean
  b_id: string
  b_name: string
  b_area: number
  b_bufferstrip: boolean
  a_som_loi: string | number
  b_soiltype_agr: string | number
  m_cropresidue: "all" | "some" | "none"
  b_lu_eom_residue: number | null
  m_cropresidue_ending: [Date, boolean][]
  b_lu_variety: [string, number][]
  b_lu_catalogue: string
  b_lu_croprotation: string
  harvests: {
    b_lu: string
    b_id_harvesting: string
    b_lu_harvest_date: Date | null
  }[]
  b_lu_harvestable: "once" | "multiple" | "none"
  calendar: string
  b_lu_start: Date[]
  b_lu_end: Date[]
  fertilizers: {
    p_name_nl: string | null
    p_id: string
    p_type: string | null
    p_type_rvo?: string | null
  }[]
  fields?: undefined
}

export type RotationExtended = CropRow | FieldRow

export type MemoizedFieldRow = FieldRow & { searchTarget: string }
export type MemoizedCropRow = CropRow & { searchTarget: string; fields: MemoizedFieldRow[] }
export type MemoizedRotationExtended = MemoizedCropRow | MemoizedFieldRow

/**
 * Get the total area of the fields associated with a row.
 *
 * @param row Either a crop row, representing the field rows below it, or a field row.
 * @returns the total field area.
 */
function getRowTotalArea(row: Row<typeof rotationTableFeatures, MemoizedRotationExtended>): number {
  if (row.original.type === "field") {
    return row.original.b_area ?? 0
  }
  return (row.subRows ?? []).reduce(
    (total, fieldRow) => total + (fieldRow.original as FieldRow).b_area,
    0,
  )
}

const columnHelper = createColumnHelper<typeof rotationTableFeatures, MemoizedRotationExtended>()
export const columns = columnHelper.columns([
  columnHelper.display({
    id: "Children",
    enableHiding: false,
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <button
          type="button"
          onClick={row.getToggleExpandedHandler()}
          style={{ cursor: "pointer" }}
        >
          <ChevronRight
            className={cn(
              "text-muted-foreground transition-transform duration-300",
              row.getIsExpanded() ? "rotate-90" : "transform-none",
            )}
          />
        </button>
      ) : (
        ""
      )
    },
  }),
  columnHelper.display({
    id: "select",
    header: ({ table }) => {
      return (
        <div className="pe-4">
          <Checkbox
            checked={
              table.getIsAllRowsSelected()
                ? true
                : table.getIsSomeRowsSelected()
                  ? "indeterminate"
                  : false
            }
            onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
            aria-label="Selecteer alle rijen"
          />
        </div>
      )
    },
    cell: ({ row }) => (
      <div className={cn(row.original.type === "field" ? "ps-4" : "pe-4")}>
        <Checkbox
          checked={row.getIsSelected() ? true : row.getIsSomeSelected() ? "indeterminate" : false}
          // Do not use row.getToggleSelectedHandler() here since it doesn't have the exact child-parent selection behavior we want.
          // It selects all children of the last crop row, while we want to only select until the last clicked field row.
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecteer deze rij"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  }),
  columnHelper.accessor((row) => (row.type === "crop" ? row.b_lu_name : row.b_name), {
    id: "name",
    enableSorting: true,
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Gewas" />
    },
    cell: (context) => <NameCell {...context} />,
  }),
  columnHelper.display({
    id: "b_lu_start",
    enableSorting: true,
    sortFn: "datetime",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Zaaidatum" />
    },
    enableHiding: true, // Enable hiding for mobile
    cell: ({ cell, row }) => {
      const dates =
        row.original.type === "field"
          ? row.original.b_lu_start
          : (row.subRows ?? [])
              .flatMap((fieldRow) => (fieldRow.original as FieldRow).b_lu_start)
              .sort((d1, d2) => d1.getTime() - d2.getTime())
      return !row.original.canModify ? (
        <DateRangeDisplay range={dates} emptyContent="Geen" />
      ) : (
        <TableDateSelector name="b_lu_start" row={row} cellId={cell.id} required={true} />
      )
    },
  }),
  columnHelper.display({
    id: "b_lu_end",
    enableSorting: true,
    sortFn: "datetime",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Einddatum" />
    },
    enableHiding: true, // Enable hiding for mobile
    cell: ({ cell, row }) => {
      const dates =
        row.original.type === "field"
          ? row.original.b_lu_end
          : (row.subRows ?? [])
              .flatMap((fieldRow) => (fieldRow.original as FieldRow).b_lu_end)
              .sort((d1, d2) => d1.getTime() - d2.getTime())
      if (!row.original.canModify) {
        return <DateRangeDisplay range={dates} emptyContent="Geen" />
      }
      const cultivation = (row.getParentRow() ?? row).original as CropRow
      const tooltipMessageNumHarvests =
        cultivation.b_lu_harvestable === "multiple"
          ? 0
          : (row.original.type === "crop" ? (row.subRows ?? []) : [row]).reduce(
              (sum, fieldRow) => sum + (fieldRow.original as FieldRow).harvests.length,
              0,
            )
      return cultivation.b_lu_harvestable !== "multiple" ? (
        <span className="whitespace-nowrap">
          <Tooltip>
            <TooltipTrigger>
              <DateRangeDisplay range={dates} emptyContent="Geen" />
            </TooltipTrigger>
            <TooltipContent>
              {tooltipMessageNumHarvests > 1
                ? `U zou in plaats daarvan de huidige ${getHarvestTerm(cultivation.b_lu_croprotation, true, cultivation.b_lu_harvestable)} bijwerken.`
                : tooltipMessageNumHarvests === 1
                  ? `U zou in plaats daarvan de huidige ${getHarvestTerm(cultivation.b_lu_croprotation, false, cultivation.b_lu_harvestable)} bijwerken.`
                  : `U zou in plaats daarvan een ${getHarvestTerm(cultivation.b_lu_croprotation, false, cultivation.b_lu_harvestable)} moeten toevoegen.`}
            </TooltipContent>
          </Tooltip>
        </span>
      ) : (
        <TableDateSelector name="b_lu_end" row={row} cellId={cell.id} required={false} />
      )
    },
  }),
  columnHelper.display({
    id: "b_harvest_date",
    enableSorting: false,
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Oogst/Maaidata" />
    },
    enableHiding: true, // Enable hiding for mobile
    cell: ({ row }) => {
      return <HarvestDatesDisplay row={row} />
    },
  }),
  columnHelper.display({
    id: "b_lu_variety",
    enableSorting: false,
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Variëteit" />
    },
    enableHiding: true, // Enable hiding for mobile
    cell: ({ cell, row }) => (
      <TableVarietySelector
        name="b_lu_variety"
        row={row}
        cellId={cell.id}
        canModify={row.original.canModify}
      />
    ),
  }),
  columnHelper.display({
    id: "m_cropresidue",
    enableSorting: false,
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Gewasresten" />
    },
    enableHiding: true, // Enable hiding for mobile
    cell: (props) =>
      props.row.original.b_lu_croprotation === "cereal" && <CropResidueCheckbox {...props} />,
  }),
  columnHelper.display({
    id: "fertilizers",
    enableSorting: false,
    enableHiding: true, // Enable hiding for mobile
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Bemesting met:" />
    },
    cell: ({ row }) => {
      return <FertilizerDisplay row={row} />
    },
  }),
  columnHelper.display({
    id: "b_name",
    enableSorting: true,
    sortFn: (rowA, rowB, _columnId) => {
      const fieldA = rowA.original.fields?.length ?? 0
      const fieldB = rowB.original.fields?.length ?? 0
      return fieldA - fieldB
    },
    enableHiding: true, // Enable hiding for mobile
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Percelen" />
    },
    cell: ({ row }) => {
      const cultivation = row.original

      const fieldsDisplay = useMemo(() => {
        if (cultivation.type === "field") return null
        const fieldsSorted = (row.subRows ?? [])
          .map((row) => row.original as FieldRow)
          .sort((a, b) => a.b_name.localeCompare(b.b_name))
        return (
          cultivation.type === "crop" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost">
                  <p className="text-muted-foreground">
                    {fieldsSorted.length === 1 ? "1 perceel" : `${fieldsSorted.length} percelen`}
                  </p>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <ScrollArea
                  className={fieldsSorted.length >= 8 ? "h-72 w-48 overflow-y-auto" : "w-48"}
                >
                  <div className="grid grid-cols-1 gap-2">
                    {fieldsSorted.map((field) => (
                      <NavLink
                        to={`../${cultivation.calendar}/field/${field.b_id}`}
                        key={`${field.b_id}`}
                      >
                        <DropdownMenuItem>{field.b_name}</DropdownMenuItem>
                      </NavLink>
                    ))}
                  </div>
                </ScrollArea>
              </DropdownMenuContent>
            </DropdownMenu>
          )
        )
      }, [cultivation.type, cultivation.calendar, row.subRows])

      return fieldsDisplay
    },
  }),
  // This column needs an accessor function to indicate that it is sortable. TanStack Table seems
  // to make false assumptions if we simply give "b_area". We also need a sortFn to make sure we
  // sort based only on the fields that pass the filter.
  columnHelper.accessor(
    (row) =>
      row.type === "field"
        ? row.b_area
        : (row.fields ?? []).reduce((total, fieldRow) => total + (fieldRow as FieldRow).b_area, 0),
    {
      id: "column",
      enableSorting: true,
      sortFn: (rowA, rowB, _columnId) => getRowTotalArea(rowA) - getRowTotalArea(rowB),
      header: ({ column }) => {
        return <DataTableColumnHeader column={column} title="Oppervlakte" />
      },
      enableHiding: true, // Enable hiding for mobile
      cell: ({ row }) => {
        const b_area = getRowTotalArea(row)
        const formattedArea = b_area < 0.1 ? "< 0.1 ha" : `${b_area.toFixed(1)} ha`
        return <p className="text-muted-foreground">{formattedArea}</p>
      },
    },
  ),
])
