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
import { getFertilizerParametersDescription } from "@svenvw/fdm-core"

export type Fertilizer = {
    p_id: string
    p_name_nl: string
    p_n_rt?: number | null
    p_p_rt?: number | null
    p_k_rt?: number | null
    p_type_rvo?: string | null
    p_type?: "manure" | "compost" | "mineral" | null
    p_eoc?: number | null
    p_source?: string
    p_n_wc?: number | null
    p_om?: number | null
    p_s_rt?: number | null
    p_ca_rt?: number | null
    p_mg_rt?: number | null
}

const fertilizerParameterDescription = getFertilizerParametersDescription()

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
            return <DataTableColumnHeader column={column} title="Mestcode (RVO)" />
        },
        cell: ({ row }) => {
            const fertilizer = row.original
            if (!fertilizer.p_type_rvo) {
                return null
            }
            const p_type_rvo = fertilizer.p_type_rvo
            const p_type = fertilizer.p_type
            const rvoTypeName = fertilizerParameterDescription
                .find((x) => x.parameter === "p_type_rvo")
                ?.options?.find((x) => x.value === p_type_rvo)?.label

            const maxLength = "Rundvee - Drijfmest behalve van vleeskalveren".length
            const isTruncated = rvoTypeName && rvoTypeName.length > maxLength
            const truncatedRvoTypeName = isTruncated
                ? `${rvoTypeName.substring(0, maxLength)}...`
                : rvoTypeName

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
                    <p>{truncatedRvoTypeName}</p>
                </Badge>
            )

            return (
                <span className="flex items-center gap-2">
                    {isTruncated ? (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>{badge}</TooltipTrigger>
                                <TooltipContent>
                                    <p>{rvoTypeName}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ) : (
                        badge
                    )}
                </span>

                // <span className="flex items-center gap-2">
                //     {fertilizer.p_type_manure ? (
                //         <Badge
                //             className="bg-amber-600 text-white hover:bg-amber-700"
                //             variant="default"
                //         >
                //             Mest
                //         </Badge>
                //     ) : null}
                //     {fertilizer.p_type_compost ? (
                //         <Badge
                //             className="bg-green-600 text-white hover:bg-green-700"
                //             variant="default"
                //         >
                //             Compost
                //         </Badge>
                //     ) : null}
                //     {fertilizer.p_type_mineral ? (
                //         <Badge
                //             className="bg-blue-600 text-white hover:bg-blue-700"
                //             variant="default"
                //         >
                //             Kunstmest
                //         </Badge>
                //     ) : null}
                // </span>
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
