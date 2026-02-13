import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRightFromSquare, ChevronRight } from "lucide-react"
import { NavLink, useParams } from "react-router-dom"
import { cn } from "@/app/lib/utils"
import { DataTableColumnHeader } from "~/components/blocks/fields/column-header"
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"

export interface FarmExtended {
    type: "farm" | "field"
    b_id_farm: string
    b_name_farm: string | null
    b_area: number
    owner?: {
        displayUserName: string | null
        image: string | null
        initials: string | null
    } | null
    fields?: FarmExtended[]
    fertilizers: { p_name_nl: string; p_type: string }[]
    cultivations: { b_lu_name: string; b_lu_croprotation: string }[]
}

export const columns: ColumnDef<FarmExtended>[] = [
    {
        id: "Children",
        enableHiding: false,
        cell: ({ row }) => {
            return row.getCanExpand() ? (
                <button
                    type="button"
                    onClick={row.getToggleExpandedHandler()}
                    style={{ cursor: "pointer" }}
                >
                    <ChevronRight
                        className={cn(
                            "transition-transform duration-300 text-muted-foreground",
                            row.getIsExpanded()
                                ? "rotate-90"
                                : "transform-none",
                        )}
                    />
                </button>
            ) : (
                ""
            )
        },
    },
    {
        accessorKey: "b_name_farm",
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Naam" />
        },
        cell: ({ row }) => {
            const params = useParams()
            const farm = row.original

            return (
                <NavLink
                    to={
                        row.original.type === "field"
                            ? `/farm/${row.getParentRow()?.original.b_id_farm}/${params.calendar}/field/${row.original.b_id_farm}`
                            : `/farm/${farm.b_id_farm}`
                    }
                    className="group flex items-center hover:underline w-fit"
                >
                    {farm.b_name_farm ?? "Onbekend"}
                    <ArrowUpRightFromSquare className="ml-2 h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
            )
        },
    },
    {
        id: "owner",
        accessorKey: "owner.displayUserName",
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Eigenaar" />
        },
        cell: ({ row }) => {
            const owner = row.original.owner
            if (row.original.type !== "farm") return
            return (
                <div className="flex flex-row items-center text-muted-foreground gap-2">
                    {owner ? (
                        <>
                            <Avatar className="h-6 w-6 rounded-lg">
                                <AvatarImage
                                    src={owner.image ?? undefined}
                                    alt={owner.displayUserName ?? undefined}
                                />
                                <AvatarFallback>
                                    {owner.initials}
                                </AvatarFallback>
                            </Avatar>
                            {owner.displayUserName}
                        </>
                    ) : (
                        <>
                            <div className="h-6 w-6 invisible" />
                            Onbekend
                        </>
                    )}
                </div>
            )
        },
    },
    {
        accessorKey: "b_area",
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Oppervlakte" />
        },
        cell: ({ cell }) => (
            <span className="text-muted-foreground">
                {Math.round(10 * (cell.getValue<number>() ?? 0)) / 10} ha
            </span>
        ),
    },
]
