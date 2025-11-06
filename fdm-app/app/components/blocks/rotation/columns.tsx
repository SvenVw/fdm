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
import { Circle, Diamond, Square, Triangle } from "lucide-react"
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "~/components/ui/tooltip"

export type RotationExtended = {
    b_lu_catalogue: string
    b_lu: string[]
    b_lu_name: string
    b_lu_croprotation: string
    b_lu_start: Date[]
    b_lu_end: Date[]
    fields: {
        b_id: string
        b_name: string
        b_area: number
        b_isproductive: boolean
        a_som_loi: number
        b_soiltype_agr: string
        harvests: any
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
        sortingFn: "alphanumeric",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Zaaidatum" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => {
            const cultivation = row.original

            const b_lu_start = cultivation.b_lu_start

            if (b_lu_start.length === 1) {
                return (
                    <p className="text-muted-foreground">
                        {format(b_lu_start[0], "PP", { locale: nl })}
                    </p>
                )
            }
            const firstDate = b_lu_start[0]
            const lastDate = b_lu_start[b_lu_start.length - 1]
            return (
                <p className="text-muted-foreground">
                    {`${format(firstDate, "PP", { locale: nl })} - ${format(lastDate, "PP", { locale: nl })}`}
                </p>
            )
        },
    },
    {
        accessorKey: "b_harvest_date",
        enableSorting: true,
        sortingFn: "alphanumeric",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Oogstdata" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => {
            const cultivation = row.original

            const b_lu_start = cultivation.field.harvests

            if (b_lu_start.length === 1) {
                return (
                    <p className="text-muted-foreground">
                        {format(b_lu_start[0], "PP", { locale: nl })}
                    </p>
                )
            }
            const firstDate = b_lu_start[0]
            const lastDate = b_lu_start[b_lu_start.length - 1]
            return (
                <p className="text-muted-foreground">
                    {`${format(firstDate, "PP", { locale: nl })} - ${format(lastDate, "PP", { locale: nl })}`}
                </p>
            )
        },
    },
    {
        accessorKey: "fertilizerApplications",
        enableSorting: false,
        enableHiding: true, // Enable hiding for mobile
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Bemesting met:" />
            )
        },
        cell: ({ row }) => {
            const fields = row.original.fields
            const fertilizers = fields.flatMap((field) => field.fertilizers)
            const uniqueFertilizers = Array.from(
                new Map(fertilizers.map((f) => [f.p_id, f])).values(),
            )

            return (
                <div className="flex items-start flex-col space-y-2">
                    {uniqueFertilizers.map((fertilizer) => {
                        const isFertilizerUsedOnAllFieldsForThisCultivation =
                            fields.every((field) =>
                                field.fertilizers.some(
                                    (f) => f.p_id === fertilizer.p_id,
                                ),
                            )
                        const fertilizerIconFillShade =
                            isFertilizerUsedOnAllFieldsForThisCultivation
                                ? "600"
                                : "300"

                        return (
                            <Tooltip key={fertilizer.p_id}>
                                <TooltipTrigger>
                                    <Badge
                                        variant="outline"
                                        className="gap-1 text-muted-foreground"
                                    >
                                        <span>
                                            {fertilizer.p_type === "manure" ? (
                                                <Square
                                                    className={`size-3 text-yellow-600 fill-yellow-${
                                                        fertilizerIconFillShade
                                                    }`}
                                                />
                                            ) : fertilizer.p_type ===
                                              "mineral" ? (
                                                <Circle
                                                    className={`size-3 text-sky-600 fill-sky-${
                                                        fertilizerIconFillShade
                                                    }`}
                                                />
                                            ) : fertilizer.p_type ===
                                              "compost" ? (
                                                <Triangle
                                                    className={`size-3 text-green-600 fill-green-${
                                                        fertilizerIconFillShade
                                                    }`}
                                                />
                                            ) : (
                                                <Diamond
                                                    className={`size-3 text-gray-600 fill-gray-${
                                                        fertilizerIconFillShade
                                                    }`}
                                                />
                                            )}
                                        </span>
                                        {fertilizer.p_name_nl}
                                    </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {isFertilizerUsedOnAllFieldsForThisCultivation
                                        ? "Deze meststof is toegepast op alle percelen met dit gewas"
                                        : "Deze meststof is op sommige percelen met dit gewas toegepast"}
                                </TooltipContent>
                            </Tooltip>
                        )
                    })}
                </div>
            )
        },
    },
    {
        accessorKey: "b_name",
        enableSorting: true,
        enableHiding: true, // Enable hiding for mobile
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Percelen" />
        },
        cell: ({ row }) => {
            const cultivation = row.original

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
                        <ScrollArea className="h-72 overflow-y-auto w-48">
                            <div className="grid grid-cols-1 gap-2">
                                {fieldsSorted.map((field, idx) => (
                                    <NavLink
                                        to={`../field/${field.b_id}`}
                                        key={`${field.b_name}-${idx}`}
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
        },
    },
    {
        accessorKey: "b_area",
        enableSorting: true,
        sortingFn: "alphanumeric",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Oppervlakte" />
        },
        enableHiding: true, // Enable hiding for mobile
        cell: ({ row }) => {
            const cultivation = row.original

            const b_area = cultivation.fields.reduce(
                (acc, field) => acc + field.b_area,
                0,
            )

            return (
                <p className="text-muted-foreground">
                    {b_area < 0.1 ? "< 0.1 ha" : `${b_area.toFixed(1)} ha`}
                </p>
            )
        },
    },

    // {
    //     accessorKey: "a_som_loi",
    //     enableSorting: true,
    //     sortingFn: "alphanumeric",
    //     header: ({ column }) => {
    //         return <DataTableColumnHeader column={column} title="OS" />
    //     },
    //     enableHiding: true, // Enable hiding for mobile
    //     cell: ({ row }) => {
    //         const field = row.original
    //         return (
    //             <p className="text-muted-foreground">
    //                 {`${field.a_som_loi.toFixed(2)} %`}
    //             </p>
    //         )
    //     },
    // },
    // {
    //     accessorKey: "b_soiltype_agr",
    //     enableSorting: true,
    //     sortingFn: "alphanumeric",
    //     header: ({ column }) => {
    //         return <DataTableColumnHeader column={column} title="Bodemtype" />
    //     },
    //     enableHiding: true, // Enable hiding for mobile
    //     cell: ({ row }) => {
    //         const field = row.original
    //         return (
    //             <p className="text-muted-foreground">{field.b_soiltype_agr}</p>
    //         )
    //     },
    // },
    // {
    //     accessorKey: "b_area",
    //     enableSorting: true,
    //     sortingFn: "alphanumeric",
    //     header: ({ column }) => {
    //         return <DataTableColumnHeader column={column} title="Oppervlakte" />
    //     },
    //     enableHiding: true, // Enable hiding for mobile
    //     cell: ({ row }) => {
    //         const field = row.original
    //         return (
    //             <p className="text-muted-foreground">
    //                 {field.b_area < 0.1
    //                     ? "< 0.1 ha"
    //                     : `${field.b_area.toFixed(1)} ha`}
    //             </p>
    //         )
    //     },
    // },
    // {
    //     id: "actions",
    //     enableHiding: false,
    //     cell: ({ row }) => {
    //         const field = row.original

    //         return (
    //             <DropdownMenu>
    //                 <DropdownMenuTrigger asChild>
    //                     <Button variant="ghost" className="h-8 w-8 p-0">
    //                         <span className="sr-only">Open menu</span>
    //                         <MoreHorizontal />
    //                     </Button>
    //                 </DropdownMenuTrigger>
    //                 <DropdownMenuContent align="end">
    //                     {/* <DropdownMenuLabel>Acties</DropdownMenuLabel>
    //                     <DropdownMenuItem
    //                         onClick={() =>
    //                             navigator.clipboard.writeText(field.b_id)
    //                         }
    //                     >
    //                         Kopieer perceel id
    //                     </DropdownMenuItem>
    //                     <DropdownMenuSeparator /> */}
    //                     <DropdownMenuLabel>Gegevens</DropdownMenuLabel>
    //                     <DropdownMenuItem>
    //                         <NavLink to={`./${field.b_id}`}>Overzicht</NavLink>
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem>
    //                         <NavLink to={`./${field.b_id}/cultivation`}>
    //                             Gewassen
    //                         </NavLink>
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem>
    //                         <NavLink to={`./${field.b_id}/fertilizer`}>
    //                             Bemesting
    //                         </NavLink>
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem>
    //                         <NavLink to={`./${field.b_id}/soil`}>Bodem</NavLink>
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem>
    //                         <NavLink to={`./${field.b_id}/atlas`}>
    //                             Kaart
    //                         </NavLink>
    //                     </DropdownMenuItem>
    //                     <DropdownMenuItem>
    //                         <NavLink to={`./${field.b_id}/delete`}>
    //                             Verwijderen
    //                         </NavLink>
    //                     </DropdownMenuItem>
    //                 </DropdownMenuContent>
    //             </DropdownMenu>
    //         )
    //     },
    // },
]
