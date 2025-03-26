import type { ColumnDef } from "@tanstack/react-table"
import {
    SquareArrowOutUpRight,
} from "lucide-react"
import { DataTableColumnHeader } from "./column-header"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { NavLink } from "react-router"

export type Fertilizer = {
    p_id: string
    p_name_nl: string
    p_n_rt: number | null
    p_p_rt: number | null
    p_k_rt: number | null
}

export const columns: ColumnDef<Fertilizer>[] = [
    {
        accessorKey: "p_id",
        header: "ID",
    },
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
            return <DataTableColumnHeader column={column} title="P" />
        },
    },
    {
        accessorKey: "Opties",
        cell: ({ row }) => {
            const fertilizer = row.original

            return (
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger className=" text-sm text-muted-foreground/70">
                            <NavLink to={`./${fertilizer.p_id}`}>
                                <SquareArrowOutUpRight />
                            </NavLink>
                        </TooltipTrigger>
                        <TooltipContent>{`Bekijk details over ${fertilizer.p_name_nl}`}</TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            )
        },
    },
]
