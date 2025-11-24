import React from "react"
import type { ColumnDef } from "@tanstack/react-table"
import { NavLink } from "react-router-dom"
import { getCultivationColor } from "~/components/custom/cultivation-colors"
import { Badge } from "~/components/ui/badge"
import { ScrollArea } from "~/components/ui/scroll-area"
import { Button } from "~/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { DataTableColumnHeader } from "./column-header"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import { Checkbox } from "~/components/ui/checkbox"
import { HarvestDatesDisplay } from "./harvest-dates-display"
import { FertilizerDisplay } from "./fertilizer-display"
import { Row } from "@react-email/components"

export type RotationExtended = {
    b_lu_catalogue: string
    b_lu: string[]
    b_lu_name: string
    b_lu_croprotation: string
    b_lu_harvestable: "once" | "multiple" | "none"
    b_lu_start: Date[]
    b_lu_end: Date[]
    calendar: string
    fields: {
        b_id: string
        b_name: string
        b_area: number
        b_isproductive: boolean
        a_som_loi: number
        b_soiltype_agr: string
        b_lu_harvest_date: Date[]
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
    }[]
}

export const columns: ColumnDef<RotationExtended>[] = [
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
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Selecteer deze rij"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "b_lu_name",
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Gewas" />
        },
        cell: ({ row }) => {
            const cultivation = row.original
            return (
                <Badge
                    style={{
                        backgroundColor: getCultivationColor(
                            cultivation.b_lu_croprotation,
                        ),
                    }}
                    className="text-white"
                    variant="default"
                >
                    {cultivation.b_lu_name}
                </Badge>
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
        cell: ({ row }) => {
            const cultivation = row.original

            const formattedDateRange = React.useMemo(() => {
                const b_lu_start = cultivation.b_lu_start

                if (b_lu_start.length === 1) {
                    return format(b_lu_start[0], "PP", { locale: nl })
                }
                const b_lu_start_sorted = [...b_lu_start].sort(
                    (a, b) => a.getTime() - b.getTime(),
                )
                const firstDate = b_lu_start_sorted[0]
                const lastDate = b_lu_start_sorted[b_lu_start_sorted.length - 1]
                return `${format(firstDate, "PP", { locale: nl })} - ${format(lastDate, "PP", { locale: nl })}`
            }, [cultivation.b_lu_start])

            return <p className="text-muted-foreground">{formattedDateRange}</p>
        },
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

            const formattedArea = React.useMemo(() => {
                const b_area = cultivation.fields.reduce(
                    (acc, field) => acc + field.b_area,
                    0,
                )

                return b_area < 0.1 ? "< 0.1 ha" : `${b_area.toFixed(1)} ha`
            }, [cultivation.fields])

            return <p className="text-muted-foreground">{formattedArea}</p>
        },
    },
]
