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
import { useMemo, useRef, useState } from "react"
import { NavLink, useParams } from "react-router"
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
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import { useIsMobile } from "~/hooks/use-mobile"
import { Collapsible, CollapsibleContent } from "~/components/ui/collapsible"
import { Badge } from "~/components/ui/badge"
import { getCultivationColor } from "../../custom/cultivation-colors"

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
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
        {},
    )
    const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>(
        {},
    )
    const lastSelectedRowIndex = useRef<number | null>(null)

    const params = useParams()
    const b_id_farm = params.b_id_farm
    const isMobile = useIsMobile()

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

        if (isMobile) {
            setExpandedRows((prev) => ({
                ...prev,
                [row.id]: !prev[row.id],
            }))
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
            columnVisibility: isMobile
                ? {
                      b_name: true,
                      select: true,
                      actions: true,
                      cultivations: false,
                      fertilizerApplications: false,
                      a_som_loi: false,
                      b_soiltype_agr: false,
                      b_area: false,
                  }
                : columnVisibility,
            globalFilter,
            rowSelection,
        },
    })

    const selectedFields = useMemo(() => {
        return table
            .getFilteredSelectedRowModel()
            .rows.map((row) => row.original)
    }, [table])

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

    const isHarvestButtonDisabled = !canAddHarvest
    const harvestTooltipContent = isHarvestButtonDisabled
        ? "Selecteer één of meerdere percelen met hetzelfde gewas om oogst toe te voegen"
        : "Oogst toevoegen aan geselecteerde percelen"

    return (
        <div className="w-full">
            <div className="flex py-4 space-x-2">
                <Input
                    placeholder="Zoek op naam, gewas of meststof"
                    value={globalFilter ?? ""}
                    onChange={(event) => setGlobalFilter(event.target.value)}
                    className="max-w-sm"
                />
                {!isMobile && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="ml-auto">
                                Kolommen
                                <ChevronDown />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {table
                                .getAllColumns()
                                .filter((column) => column.getCanHide())
                                .map((column) => {
                                    return (
                                        <DropdownMenuCheckboxItem
                                            key={column.id}
                                            className="capitalize"
                                            checked={column.getIsVisible()}
                                            onCheckedChange={(value) =>
                                                column.toggleVisibility(!!value)
                                            }
                                        >
                                            {column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                {isFertilizerButtonDisabled ? (
                                    <Button
                                        disabled={isFertilizerButtonDisabled}
                                        className="rounded-3xl"
                                    >
                                        <Plus />
                                        Bemesting toevoegen
                                    </Button>
                                ) : (
                                    <NavLink
                                        to={`/farm/${b_id_farm}/add/fertilizer?fieldIds=${selectedFieldIds.join(",")}`}
                                    >
                                        <Button className="rounded-3xl">
                                            <Plus />
                                            Bemesting toevoegen
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
                            <div>
                                {isHarvestButtonDisabled ? (
                                    <Button
                                        disabled={isHarvestButtonDisabled}
                                        className="rounded-3xl"
                                    >
                                        <Plus />
                                        Oogst toevoegen
                                    </Button>
                                ) : (
                                    <NavLink
                                        to={`/farm/${b_id_farm}/add/harvest?fieldIds=${selectedFieldIds.join(",")}`}
                                    >
                                        <Button className="rounded-3xl">
                                            <Plus />
                                            Oogst toevoegen
                                        </Button>
                                    </NavLink>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{harvestTooltipContent}</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <div className="ml-auto">
                    <NavLink to={"./new"}>
                        <Button>
                            <Plus />
                            Perceel toevoegen
                        </Button>
                    </NavLink>
                </div>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => {
                                    return (
                                        <TableHead key={header.id}>
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
                                <>
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
                                            <TableCell key={cell.id}>
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                    {isMobile && expandedRows[row.id] && (
                                        <TableRow>
                                            <TableCell
                                                colSpan={
                                                    row.getVisibleCells().length
                                                }
                                                className="p-0"
                                            >
                                                <Collapsible
                                                    open={expandedRows[row.id]}
                                                >
                                                    <CollapsibleContent className="space-y-2 p-4">
                                                        <div className="flex flex-col space-y-2">
                                                            <p className="text-sm font-medium">
                                                                Gewassen:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {row.original.cultivations.map(
                                                                    (
                                                                        cultivation: any,
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                cultivation.b_lu_name
                                                                            }
                                                                            style={{
                                                                                backgroundColor:
                                                                                    getCultivationColor(
                                                                                        cultivation.b_lu_croprotation,
                                                                                    ),
                                                                            }}
                                                                            className="text-white"
                                                                            variant="default"
                                                                        >
                                                                            {
                                                                                cultivation.b_lu_name
                                                                            }
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col space-y-2">
                                                            <p className="text-sm font-medium">
                                                                Bemesting met:
                                                            </p>
                                                            <div className="flex flex-wrap gap-2">
                                                                {row.original.fertilizerApplications.map(
                                                                    (
                                                                        fertilizer: any,
                                                                    ) => (
                                                                        <Badge
                                                                            key={
                                                                                fertilizer.p_name_nl
                                                                            }
                                                                            variant="outline"
                                                                        >
                                                                            {
                                                                                fertilizer.p_name_nl
                                                                            }
                                                                        </Badge>
                                                                    ),
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col space-y-2">
                                                            <p className="text-sm font-medium">
                                                                OS (%):
                                                            </p>
                                                            <p className="text-sm">
                                                                {
                                                                    row.original
                                                                        .a_som_loi
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col space-y-2">
                                                            <p className="text-sm font-medium">
                                                                Bodemtype:
                                                            </p>
                                                            <p className="text-sm">
                                                                {
                                                                    row.original
                                                                        .b_soiltype_agr
                                                                }
                                                            </p>
                                                        </div>
                                                        <div className="flex flex-col space-y-2">
                                                            <p className="text-sm font-medium">
                                                                Oppervlakte
                                                                (ha):
                                                            </p>
                                                            <p className="text-sm">
                                                                {
                                                                    row.original
                                                                        .b_area
                                                                }
                                                            </p>
                                                        </div>
                                                    </CollapsibleContent>
                                                </Collapsible>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </>
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
