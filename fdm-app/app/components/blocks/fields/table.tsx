import {
    type ColumnDef,
    type ColumnFiltersState,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type SortingState,
    type RowSelectionState,
    useReactTable,
    VisibilityState,
} from "@tanstack/react-table"
import { ChevronDown, Plus } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { NavLink, useParams } from "react-router-dom"
import fuzzysort from "fuzzysort"
import { Button } from "~/components/ui/button"
import { Input } from "~/components/ui/input"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import type { FieldExtended } from "./columns"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { cn } from "@/app/lib/utils"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import { useIsMobile } from "~/hooks/use-mobile"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
}

export function DataTable<TData extends FieldExtended, TValue>({
    columns,
    data,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [globalFilter, setGlobalFilter] = useState("")
    const isMobile = useIsMobile()
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        isMobile
            ? { a_som_loi: false, b_soiltype_agr: false, b_area: false }
            : {},
    )
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const lastSelectedRowIndex = useRef<number | null>(null)

    useEffect(() => {
        setColumnVisibility(
            isMobile
                ? { a_som_loi: false, b_soiltype_agr: false, b_area: false }
                : {},
        )
    }, [isMobile])

    const params = useParams()
    const b_id_farm = params.b_id_farm

    const handleRowClick = (
        row: any,
        event: React.MouseEvent<HTMLTableRowElement>,
    ) => {
        // Check if the clicked element or any of its parents is an anchor tag
        const isLinkClick = (target: EventTarget | null): boolean => {
            if (!target || !(target instanceof HTMLElement)) {
                return false
            }
            if (target.tagName === "A") {
                return true
            }
            return isLinkClick(target.parentElement)
        }

        if (isLinkClick(event.target)) {
            // If a link was clicked, let the default navigation happen
            return
        }

        if (event.shiftKey && lastSelectedRowIndex.current !== null) {
            const currentIndex = row.index
            const start = Math.min(currentIndex, lastSelectedRowIndex.current)
            const end = Math.max(currentIndex, lastSelectedRowIndex.current)

            const rowsToSelect = table
                .getRowModel()
                .rows.slice(start, end + 1)
                .map((r) => r.id)

            const newRowSelection = { ...rowSelection }
            rowsToSelect.forEach((id) => {
                newRowSelection[id] = true
            })
            setRowSelection(newRowSelection)
        } else {
            row.toggleSelected()
        }
        lastSelectedRowIndex.current = row.index
    }

    const fuzzyFilter = (row: any, columnId: string, filterValue: string) => {
        const cultivationNames = row.original.cultivations
            .map((c: { b_lu_name: string }) => c.b_lu_name)
            .join(" ")
        const fertilizerNames = row.original.fertilizerApplications
            .map((f: { p_name_nl: string }) => f.p_name_nl)
            .join(" ")
        const target = `${row.getValue("b_name")} ${cultivationNames} ${fertilizerNames} ${row.getValue("b_soiltype_agr")}`
        const result = fuzzysort.go(filterValue, [target])
        return result.length > 0
    }

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: setRowSelection,
        globalFilterFn: fuzzyFilter,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
            rowSelection,
        },
    })

    const selectedFields = useMemo(() => {
        return table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)
    }, [table, rowSelection])

    const canAddHarvest = useMemo(() => {
        if (selectedFields.length === 0) return false
        const firstCultivation = selectedFields[0]?.cultivations[0]?.b_lu_name
        return selectedFields.every(
            (field) =>
                field.cultivations.length > 0 &&
                field.cultivations[0]?.b_lu_name === firstCultivation,
        )
    }, [selectedFields])

    const selectedFieldIds = selectedFields.map((field) => field.b_id)

    const isFertilizerButtonDisabled = selectedFields.length === 0
    const fertilizerTooltipContent = isFertilizerButtonDisabled
        ? "Selecteer één of meerdere percelen om bemesting toe te voegen"
        : "Bemesting toevoegen aan geselecteerde percelen"

    return (
        <div className="w-full flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background py-4 flex flex-col sm:flex-row gap-2 items-center">
                <Input
                    placeholder="Zoek op naam, gewas of meststof"
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="w-full sm:w-auto sm:flex-grow"
                />
                <div className="flex w-full items-center justify-start sm:justify-end gap-2 sm:w-auto flex-wrap">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline">
                                Bekijk
                                <ChevronDown className="ml-2 h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    const columnNames: Record<string, string> = {
                                        b_name: "Naam",
                                        cultivations: "Gewassen",
                                        fertilizerApplications: "Bemesting met:",
                                        a_som_loi: "OS",
                                        b_soiltype_agr: "Bodemtype",
                                        b_area: "Oppervlakte",
                                    }
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {columnNames[column.id] ?? column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div>
                                    {isFertilizerButtonDisabled ? (
                                        <Button
                                            disabled={
                                                isFertilizerButtonDisabled
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Bemesting
                                        </Button>
                                    ) : (
                                        <NavLink
                                            to={`/farm/${b_id_farm}/add/fertilizer?fieldIds=${selectedFieldIds.join(",")}`}
                                        >
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Bemesting
                                            </Button>
                                        </NavLink>
                                    )}
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>{fertilizerTooltipContent}</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <NavLink to={"./new"}>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Nieuw perceel
                                    </Button>
                                </NavLink>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>Voeg een nieuw perceel toe</p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
            </div>
            <div className="rounded-md border flex-grow relative overflow-x-auto">
                <Table>
                    <TableHeader className="sticky top-0 z-10 bg-background">
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead
                                            key={header.id}
                                            className={cn({
                                                "sticky left-0 bg-background":
                                                    header.column.id ===
                                                    "select",
                                                "sticky right-0 bg-background":
                                                    header.column.id ===
                                                    "actions",
                                            })}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    )
                                })}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
                                    }
                                    onClick={(event) =>
                                        handleRowClick(row, event)
                                    }
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell
                                            key={cell.id}
                                            className={cn({
                                                "sticky left-0 bg-background":
                                                    cell.column.id === "select",
                                                "sticky right-0 bg-background":
                                                    cell.column.id ===
                                                    "actions",
                                            })}
                                        >
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext(),
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-24 text-center"
                                >
                                    Geen resultaten.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
