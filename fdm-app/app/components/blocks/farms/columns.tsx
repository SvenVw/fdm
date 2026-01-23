import type { ColumnDef } from "@tanstack/react-table"
import { ArrowUpRightFromSquare } from "lucide-react"
import { NavLink } from "react-router-dom"
import { DataTableColumnHeader } from "~/components/blocks/fields/column-header"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"

export interface FarmExtended {
    b_id_farm: string
    b_name_farm: string | null
    b_area: number
    owner?: {
        displayUserName: string | null
        image: string | null
        initials: string | null
    } | null
    fields: number
    fertilizers: { p_name_nl: string; p_type: string }[]
    cultivations: { b_lu_name: string; b_lu_croprotation: string }[]
}

export const columns: ColumnDef<FarmExtended>[] = [
    {
        accessorKey: "b_name_farm",
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Naam" />
        },
        cell: ({ row }) => {
            const farm = row.original

            return (
                <NavLink
                    to={`/farm/${farm.b_id_farm}`}
                    className="group flex items-center hover:underline w-fit"
                >
                    {farm.b_name_farm ?? "Onbekend"}
                    <ArrowUpRightFromSquare className="ml-2 h-4 w-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
            )
        },
    },
    {
        accessorKey: "owner.displayUserName",
        enableSorting: true,
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Eigenaar" />
        },
        cell: ({ row }) => {
            const owner = row.original.owner
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
