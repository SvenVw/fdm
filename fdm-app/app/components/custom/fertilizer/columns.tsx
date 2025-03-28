import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, Pencil, SquareArrowOutUpRight } from "lucide-react"
import { DataTableColumnHeader } from "./column-header"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { NavLink } from "react-router"
import { Badge } from "@/components/ui/badge"

export type Fertilizer = {
    p_id: string
    p_name_nl: string
    p_n_rt: number | null
    p_p_rt: number | null
    p_k_rt: number | null
}

export const columns: ColumnDef<Fertilizer>[] = [
    // {
    //     accessorKey: "p_id",
    //     header: "ID",
    // },
    {
        accessorKey: "p_name_nl",
        header: "Naam",
    },
    {
        accessorKey: "p_n_rt",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="N" />
        },
    },
    {
        accessorKey: "p_p_rt",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="P2O5" />
        },
    },
    {
        accessorKey: "p_k_rt",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="K2O" />
        },
    },
    {
        accessorKey: "p_eoc",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="EOC" />
        },
    },
    {
        accessorKey: "Type",
        cell: ({ row }) => {
            const fertilizer = row.original

            return (
                <span className="flex items-center gap-2">
                    {fertilizer.p_type_manure ? (
                        <Badge className="bg-amber-600 text-white hover:bg-amber-700" variant="default">Mest</Badge>
                    ) : null}
                    {fertilizer.p_type_compost ? (
                        <Badge className="bg-green-600 text-white hover:bg-green-700" variant="default">Compost</Badge>
                    ) : null}
                    {fertilizer.p_type_mineral ? (
                        <Badge className="bg-blue-600 text-white hover:bg-blue-700" variant="default">Kunstmest</Badge>
                    ) : null}
                </span>
            )
        },
    },
    {
        accessorKey: "Details",
        cell: ({ row }) => {
            const fertilizer = row.original

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className=" text-sm text-muted-foreground/70">
                            <NavLink to={`./${fertilizer.p_id}`}>
                                <ArrowRight className="text-sm" />
                            </NavLink>
                        </TooltipTrigger>
                        <TooltipContent>{`Bekijk details over ${fertilizer.p_name_nl}`}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
    },
]
