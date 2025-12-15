import {
    type ColumnDef,
    type ColumnFiltersState,
    type FilterFn,
    flexRender,
    getCoreRowModel,
    getExpandedRowModel,
    getFacetedRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    type Row,
    type RowSelectionState,
    type SortingState,
    useReactTable,
    type VisibilityState,
} from "@tanstack/react-table"
import { format } from "date-fns"
import { nl } from "date-fns/locale/nl"
import fuzzysort from "fuzzysort"
import { ChevronDown, Plus } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { NavLink, useParams } from "react-router-dom"
import { toast as notify } from "sonner"
import { useFieldFilterStore } from "@/app/store/field-filter"
import { Button } from "~/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu"
import { Input } from "~/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { useIsMobile } from "~/hooks/use-mobile"
import { cn } from "~/lib/utils"
import { FieldFilterToggle } from "../../custom/field-filter-toggle"
import type { CropRow, FieldRow, RotationExtended } from "./columns"

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    canAddItem: boolean
}

export function DataTable<TData extends RotationExtended, TValue>({
    columns,
    data,
    canAddItem,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([])
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
    const [searchTerms, setSearchTerms] = useState("")
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
    const calendar = params.calendar

    const handleRowClick = (
        row: Row<TData>,
        event: React.MouseEvent<HTMLTableRowElement>,
    ) => {
        // Ignore clicks on interactive elements inside the row
        const isInteractive = (target: EventTarget | null): boolean => {
            if (!(target instanceof Element)) return false
            return !!target.closest(
                'a,button,input,label,select,textarea,[role="button"],[role="link"],[role="checkbox"],[data-prevent-row-click="true"]',
            )
        }

        if (isInteractive(event.target)) {
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

    const memoizedData = useMemo(() => {
        return data.map((item) => {
            const commonTerms = item.b_lu_name
            const crop_b_lu_start = new Set<string>()
            const crop_b_lu_end = new Set<string>()
            const crop_b_lu_harvest_date = new Set<string>()

            const formatDate = (date: Date) =>
                format(date, "d MMMM yyy", { locale: nl })
            const dateTermsArr = (dates: Date[]) =>
                [...new Set(dates.map(formatDate))].join(" ")

            const fields = item.fields.map((field) => {
                field.b_lu_start.map((v) => crop_b_lu_start.add(formatDate(v)))
                field.b_lu_end.map((v) => crop_b_lu_end.add(formatDate(v)))
                field.b_lu_harvest_date.map((v) =>
                    crop_b_lu_harvest_date.add(formatDate(v)),
                )

                return {
                    ...field,
                    searchTarget: `${field.b_name} ${commonTerms} ${dateTermsArr(field.b_lu_start)} ${dateTermsArr(field.b_lu_end)} ${dateTermsArr(field.b_lu_harvest_date)}`,
                }
            })

            return {
                ...item,
                fields: fields,
                searchTarget: `${commonTerms} ${[...crop_b_lu_start].join(" ")} ${[...crop_b_lu_end].join(" ")} ${[...crop_b_lu_harvest_date].join(" ")}`,
            }
        })
    }, [data])

    const fuzzySearchAndProductivityFilter: FilterFn<TData> = (
        row,
        _columnId,
        { searchTerms, showProductiveOnly },
    ) => {
        if (
            showProductiveOnly &&
            !row.original.fields.some((field) => field.b_isproductive)
        ) {
            return false
        }

        return (
            searchTerms === "" ||
            fuzzysort.go(searchTerms, [(row.original as any).searchTarget])
                .length > 0
        )
    }

    const showProductiveOnly = useFieldFilterStore((s) => s.showProductiveOnly)
    const globalFilter = useMemo(
        () => ({ searchTerms, showProductiveOnly }),
        [searchTerms, showProductiveOnly],
    )
    const table = useReactTable({
        data: memoizedData,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getExpandedRowModel: getExpandedRowModel(),
        getSubRows: (row) =>
            row.type === "crop" ? (row.fields as TData[]) : undefined,
        onColumnVisibilityChange: setColumnVisibility,
        onGlobalFilterChange: (globalFilter) => {
            if (globalFilter?.searchTerms ?? "" !== searchTerms)
                setSearchTerms(globalFilter?.searchTerms ?? "")
        },
        onRowSelectionChange: setRowSelection,
        globalFilterFn: fuzzySearchAndProductivityFilter,
        // There are nulls in the columns which can cause false assumptions if this is not provided
        // The global filter checks the searchTarget field anyways
        // Filter only one of the columns to gain performance
        getColumnCanGlobalFilter: (column) => column.id === "name",
        filterFromLeafRows: true,
        state: {
            sorting,
            columnFilters,
            columnVisibility,
            globalFilter,
            rowSelection,
        },
    })

    // biome-ignore lint/correctness/useExhaustiveDependencies: rowSelection is needed for Oogst button activation
    const selectedCultivations = useMemo(() => {
        return (
            table
                .getFilteredRowModel()
                .rows.filter(
                    (row) =>
                        row.original.type === "crop" &&
                        (row.getIsSelected() || row.getIsSomeSelected()),
                ) as Row<CropRow>[]
        ).map((row) => row.original)
    }, [table, rowSelection])

    // biome-ignore lint/correctness/useExhaustiveDependencies: rowSelection is needed for Bemesting button activation
    const selectedFields = useMemo(() => {
        return (
            table
                .getFilteredSelectedRowModel()
                .flatRows.filter(
                    (row) => row.original.type === "field",
                ) as Row<FieldRow>[]
        ).map((row) => row.original)
    }, [table, rowSelection])

    const selectedCultivationIds = selectedCultivations.map(
        (cultivation) => cultivation.b_lu_catalogue,
    )
    const selectedFieldIds = selectedFields.map((field) => field.b_id)

    const isFertilizerButtonDisabled = selectedFieldIds.length === 0
    const fertilizerTooltipContent = isFertilizerButtonDisabled
        ? "Selecteer één of meerdere gewassen om bemesting toe te voegen"
        : "Bemesting toevoegen aan geselecteerd gewas"

    const isHarvestButtonDisabled =
        selectedCultivationIds.length !== 1 ||
        selectedCultivations[0].b_lu_harvestable === "none"
    const harvestErrorMessage =
        selectedCultivations.length > 0
            ? selectedCultivations[0].b_lu_harvestable === "none"
                ? "Dit gewas is niet oogstbaar."
                : null
            : null
    const harvestTooltipContent =
        selectedCultivationIds.length !== 1
            ? "Selecteer één gewas om oogst toe te voegen"
            : harvestErrorMessage
              ? harvestErrorMessage
              : "Oogst toevoegen aan geselecteerd gewas"

    return (
        <div className="w-full flex flex-col h-full">
            <div className="sticky top-0 z-10 bg-background py-4 flex flex-col sm:flex-row gap-2 items-center">
                <Input
                    placeholder="Zoek op gewas, meststof of datum"
                    value={globalFilter?.searchTerms ?? ""}
                    onChange={(event) => setSearchTerms(event.target.value)}
                    className="w-full sm:w-auto sm:grow"
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
                                    const columnNames: Record<string, string> =
                                        {
                                            b_lu_name: "Gewas",
                                            b_lu_start: "Zaaidatum",
                                            b_harvest_date: "Oogstdata",
                                            fertilizers: "Bemesting",
                                            b_name: "Percelen",
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
                                            {columnNames[column.id] ??
                                                column.id}
                                        </DropdownMenuCheckboxItem>
                                    )
                                })}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <FieldFilterToggle />
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <div
                                    className={cn(!canAddItem ? "hidden" : "")}
                                >
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
                                            to={`/farm/${b_id_farm}/${calendar}/rotation/fertilizer?cultivationIds=${selectedCultivationIds.map(encodeURIComponent).join(",")}&fieldIds=${selectedFieldIds.join(",")}`}
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
                                <div
                                    className={cn(!canAddItem ? "hidden" : "")}
                                >
                                    {isHarvestButtonDisabled ? (
                                        <Button
                                            disabled={isHarvestButtonDisabled}
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Oogst toevoegen
                                        </Button>
                                    ) : harvestErrorMessage ? (
                                        <Button
                                            onClick={() =>
                                                notify.error(
                                                    harvestErrorMessage,
                                                )
                                            }
                                        >
                                            <Plus className="mr-2 h-4 w-4" />
                                            Oogst toevoegen
                                        </Button>
                                    ) : (
                                        <NavLink
                                            to={`/farm/${b_id_farm}/${calendar}/rotation/harvest?cultivationIds=${selectedCultivationIds.map(encodeURIComponent).join(",")}&fieldIds=${selectedFieldIds.join(",")}`}
                                        >
                                            <Button>
                                                <Plus className="mr-2 h-4 w-4" />
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
                </div>
            </div>
            <div className="rounded-md border grow relative overflow-x-auto">
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
