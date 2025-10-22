import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight } from "lucide-react"
import { NavLink } from "react-router-dom"
import { Badge } from "~/components/ui/badge"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "~/components/ui/tooltip"
import { DataTableColumnHeader } from "./column-header"

export type Fertilizer = {
    p_id: string
    p_name_nl: string
    p_n_rt?: number | null
    p_p_rt?: number | null
    p_k_rt?: number | null
    p_type_rvo?: string | null
    p_type_rvo_label?: string | null
    p_type?: "manure" | "compost" | "mineral" | null
    p_eoc?: number | null
    p_source?: string
    p_n_wc?: number | null
    p_om?: number | null
    p_s_rt?: number | null
    p_ca_rt?: number | null
    p_mg_rt?: number | null
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
        accessorKey: "p_type_rvo",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Mestcode (RVO)" />
            )
        },
        cell: ({ row }) => {
            const fertilizer = row.original
            if (!fertilizer.p_type_rvo) {
                return null
            }
            const p_type = fertilizer.p_type
            const rawLabel = fertilizer.p_type_rvo_label?.trim() ?? ""
            const displayLabel = rawLabel || fertilizer.p_type_rvo || "Onbekend"
            const MAX_LABEL_LEN = 48
            const isTruncated = displayLabel.length > MAX_LABEL_LEN
            const truncatedLabel = isTruncated
                ? `${displayLabel.substring(0, MAX_LABEL_LEN)}...`
                : displayLabel

            const badge = (
                <Badge
                    className={
                        p_type === "manure"
                            ? "bg-amber-600 text-white hover:bg-amber-700"
                            : p_type === "compost"
                              ? "bg-green-600 text-white hover:bg-green-700"
                              : p_type === "mineral"
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-gray-600 text-white hover:bg-gray-700"
                    }
                    variant="outline"
                >
                    <p>{truncatedLabel}</p>
                </Badge>
            )

            return (
                <span className="flex items-center gap-2">
                    {isTruncated ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                <TooltipContent>
                                    <p>{displayLabel}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        badge
                    )}
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
