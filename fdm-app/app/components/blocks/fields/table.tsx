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
import { useMemo, useState } from "react"
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
import { type FieldExtended } from "./columns"
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

    const params = useParams()
    const b_id_farm = params.b_id_farm

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
        return table.getFilteredSelectedRowModel().rows.map((row) => row.original)
    }, [table.getFilteredSelectedRowModel().rows])

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
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div>
                                {isFertilizerButtonDisabled ? (
                                    <Button disabled={isFertilizerButtonDisabled}>
                                        <Plus />
                                        Bemesting toevoegen
                                    </Button>
                                ) : (
                                    <NavLink
                                        to={`/farm/${b_id_farm}/add/fertilizer?fieldIds=${selectedFieldIds.join(",")}`}
                                    >
                                        <Button>
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
                                    <Button disabled={isHarvestButtonDisabled}>
                                        <Plus />
                                        Oogst toevoegen
                                    </Button>
                                ) : (
                                    <NavLink
                                        to={`/farm/${b_id_farm}/add/harvest?fieldIds=${selectedFieldIds.join(",")}`}
                                    >
                                        <Button>
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
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected() && "selected"
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
