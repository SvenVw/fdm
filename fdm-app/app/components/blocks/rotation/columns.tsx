import type { ColumnDef } from "@tanstack/react-table"
import React from "react"
import { NavLink } from "react-router-dom"
import { getCultivationColor } from "~/components/custom/cultivation-colors"
import { Badge } from "~/components/ui/badge"
import { Button } from "~/components/ui/button"
import { Checkbox } from "~/components/ui/checkbox"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { ScrollArea } from "~/components/ui/scroll-area"
import { DataTableColumnHeader } from "./column-header"
import { FertilizerDisplay } from "./fertilizer-display"
import { HarvestDatesDisplay } from "./harvest-dates-display"
import { DateRangeDisplay } from "./date-range-display"
import { ChevronRight } from "lucide-react"
import { cn } from "@/app/lib/utils"

export type CropRow = {
    type: "crop"
    b_lu_catalogue: string
    b_lu: string[]
    b_lu_name: string
    m_cropresidue: string
    b_lu_variety: string
    b_lu_variety_options: string
    b_lu_croprotation: string
    b_lu_harvestable: "once" | "multiple" | "none"
    calendar: string
    b_lu_start: Date[]
    b_lu_end: Date[]
    fields: FieldRow[]
}

export type FieldRow = {
    type: "field"
    b_id: string
    b_name: string
    b_area: number
    b_isproductive: boolean
    a_som_loi: number
    b_soiltype_agr: string
    m_cropresidue: string
    b_lu_variety: string
    b_lu_harvest_date: Date[]
    b_lu_croprotation: string
    b_lu_harvestable: "once" | "multiple" | "none"
    calendar: string
    b_lu_start: Date[]
    b_lu_end: Date[]
    fertilizerApplications: {
        p_name_nl: string
        p_id: string
        p_type: string
    }[]
    fertilizers: {
        p_name_nl: string
        p_id: string
        p_type: string
    }[]
    fields: FieldRow[]
}

export type RotationExtended = CropRow | FieldRow

export const columns: ColumnDef<RotationExtended>[] = [
    {
        id: "Children",
        cell: ({ row }) => {
            return row.getCanExpand() ? (
                <button
                    type="button"
                    onClick={row.getToggleExpandedHandler()}
                    style={{ cursor: "pointer" }}
                >
                    <ChevronRight
                        className={cn(
                            "transition-transform duration-300",
                            row.getIsExpanded()
                                ? "rotate-90"
                                : "transform-none",
                        )}
                    />
                </button>
            ) : (
                ""
            )
        },
    },
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) =>
                    table.toggleAllPageRowsSelected(!!value)
                }
                aria-label="Selecteer alle rijen"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={
                    row.getIsSelected()
                        ? true
                        : row.getIsSomeSelected()
                          ? "indeterminate"
                          : false
                }
                onCheckedChange={(value) => {
                    row.toggleSelected(!!value)
                    const parentRow = row.getParentRow()
                    if (parentRow) {
                        const wantedValue = parentRow.subRows.every(
                            (childRow) =>
                                childRow.id === row.id
                                    ? value
                                    : childRow.getIsSelected(),
                        )
                        if (parentRow.getIsSelected() !== wantedValue) {
                            parentRow.toggleSelected(wantedValue, {
                                selectChildren: false,
                            })
                        }
                    }
                }}
                aria-label="Selecteer deze rij"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        id: "name",
        accessorFn: (row) => {
            row.type === "crop" ? row.b_lu_name : row.b_name
        },
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Gewas" />
        },
        cell: ({ row }) => {
            const original = row.original
            return original.type === "crop" ? (
                <Badge
                    style={{
                        backgroundColor: getCultivationColor(
                            original.b_lu_croprotation,
                        ),
                    }}
                    className={"text-white"}
                    variant="default"
                >
                    {original.b_lu_name}
                </Badge>
            ) : (
                original.b_name
            )
        },
    },
    {
        accessorKey: "b_lu_start",
        enableSorting: true,
        sortingFn: "datetime",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Zaaidatum" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => <DateRangeDisplay range={row.original.b_lu_start} />,
    },
    {
        accessorKey: "b_lu_end",
        enableSorting: true,
        sortingFn: "datetime",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Einddatum" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => <DateRangeDisplay range={row.original.b_lu_end} />,
    },
    {
        accessorKey: "b_harvest_date",
        enableSorting: false,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Oogstdata" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => {
            const cultivation = row.original
            return <HarvestDatesDisplay cultivation={cultivation} />
        },
    },
    {
        accessorKey: "fertilizers",
        enableSorting: false,
        enableHiding: true, // Enable hiding for mobile
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Bemesting met:" />
            )
        },
        cell: ({ row }) => {
            const cultivation = row.original
            return <FertilizerDisplay cultivation={cultivation} />
        },
    },
    {
        accessorKey: "b_name",
        enableSorting: true,
        sortingFn: (rowA, rowB, _columnId) => {
            const fieldA = rowA.original.fields.length
            const fieldB = rowB.original.fields.length
            return fieldA - fieldB
        },
        enableHiding: true, // Enable hiding for mobile
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Percelen" />
        },
        cell: ({ row }) => {
            const cultivation = row.original

            const fieldsDisplay = React.useMemo(() => {
                const fieldsSorted = [...cultivation.fields].sort((a, b) =>
                    a.b_name.localeCompare(b.b_name),
                )
                return (
                    cultivation.type === "crop" && (
                        <DropdownMenu>
                            <DropdownMenuTrigger>
                                <Button variant="ghost">
                                    <p className="text-muted-foreground">
                                        {fieldsSorted.length === 1
                                            ? "1 perceel"
                                            : `${fieldsSorted.length} percelen`}
                                    </p>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <ScrollArea
                                    className={
                                        fieldsSorted.length >= 8
                                            ? "h-72 overflow-y-auto w-48"
                                            : "w-48"
                                    }
                                >
                                    <div className="grid grid-cols-1 gap-2">
                                        {fieldsSorted.map((field) => (
                                            <NavLink
                                                to={`../${cultivation.calendar}/field/${field.b_id}`}
                                                key={`${field.b_id}`}
                                            >
                                                <DropdownMenuItem>
                                                    {field.b_name}
                                                </DropdownMenuItem>
                                            </NavLink>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )
                )
            }, [cultivation.calendar, cultivation.fields])

            return fieldsDisplay
        },
    },
    {
        accessorKey: "b_area",
        enableSorting: true,
        sortingFn: (rowA, rowB, _columnId) => {
            const areaA = rowA.original.fields.reduce(
                (acc, field) => acc + field.b_area,
                0,
            )
            const areaB = rowB.original.fields.reduce(
                (acc, field) => acc + field.b_area,
                0,
            )
            return areaA - areaB
        },
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Oppervlakte" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => {
            const cultivation = row.original

            const provided_b_area =
                cultivation.type === "field" ? cultivation.b_area : null
            const formattedArea = React.useMemo(() => {
                const b_area =
                    provided_b_area ??
                    cultivation.fields.reduce(
                        (acc, field) => acc + field.b_area,
                        0,
                    )

                return b_area < 0.1 ? "< 0.1 ha" : `${b_area.toFixed(1)} ha`
            }, [provided_b_area, cultivation.fields])

            return <p className="text-muted-foreground">{formattedArea}</p>
        },
    },
]
