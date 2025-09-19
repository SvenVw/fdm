import type { ColumnDef } from "@tanstack/react-table"
import { ArrowRight, MoreHorizontal } from "lucide-react"
import { NavLink } from "react-router-dom"
import { Badge } from "~/components/ui/badge"
import { DataTableColumnHeader } from "./column-header"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../../ui/dropdown-menu"
import { Button } from "../../ui/button"
import { getCultivationColor } from "../../custom/cultivation-colors"

export type FieldExtended = {
    b_id: string
    b_name: string
    cultivations: {
        b_lu_name: string
        b_lu_croprotation: string
        b_lu_start: Date
    }[]
    fertilizerApplications: {
        p_name_nl: string
    }[]
    b_area: number
}

export const columns: ColumnDef<FieldExtended>[] = [
    // {
    //     accessorKey: "p_id",
    //     header: "ID",
    // },
    {
        accessorKey: "b_name",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Naam" />
        },
        cell: ({ row }) => {
            const field = row.original

            return (
                <NavLink
                    to={`./${field.b_id}`}
                    className="flex items-center hover:underline"
                >
                    {field.b_name}
                </NavLink>
            )
        },
    },
    {
        accessorKey: "cultivations",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Gewassen" />
        },
        cell: ({ row }) => {
            const field = row.original

            const cultivationsSorted = field.cultivations.sort((a, b) => {
                if (a.b_lu_start.getTime() < b.b_lu_start.getTime()) {
                    return -1
                }
                if (a.b_lu_start.getTime() > b.b_lu_start.getTime()) {
                    return 1
                }
                return 0
            })

            return (
                <div className="flex items-start flex-col space-y-2">
                    {cultivationsSorted.map((cultivation) => (
                        <Badge
                            key={cultivation.b_lu_name}
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
                    ))}
                </div>
            )
        },
    },
    {
        accessorKey: "fertilizerApplications",
        header: ({ column }) => {
            return (
                <DataTableColumnHeader column={column} title="Bemesting met:" />
            )
        },
        cell: ({ row }) => {
            const field = row.original

            const uniqueFertilizerNames = field.fertilizerApplications
                .map((app) => app.p_name_nl)
                .filter((name, index, self) => self.indexOf(name) === index)

            return (
                <div className="flex items-start flex-col space-y-2">
                    {uniqueFertilizerNames.map((fertilizer) => (
                        <Badge key={fertilizer} variant="outline">
                            {fertilizer}
                        </Badge>
                    ))}
                </div>
            )
        },
    },
    {
        accessorKey: "b_area",
        header: ({ column }) => {
            return <DataTableColumnHeader column={column} title="Oppervlakte" />
        },
    },
    {
        id: "actions",
        enableHiding: false,
        cell: ({ row }) => {
            const field = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        {/* <DropdownMenuLabel>Acties</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() =>
                                navigator.clipboard.writeText(field.b_id)
                            }
                        >
                            Kopieer perceel id
                        </DropdownMenuItem>
                        <DropdownMenuSeparator /> */}
                        <DropdownMenuLabel>Gegevens</DropdownMenuLabel>
                        <DropdownMenuItem>
                            <NavLink to={`./${field.b_id}`}>Overzicht</NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <NavLink to={`./${field.b_id}/cultivation`}>
                                Gewassen
                            </NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <NavLink to={`./${field.b_id}/fertilizer`}>
                                Bemesting
                            </NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <NavLink to={`./${field.b_id}/soil`}>Bodem</NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <NavLink to={`./${field.b_id}/atlas`}>
                                Kaart
                            </NavLink>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                            <NavLink to={`./${field.b_id}/delete`}>
                                Verwijderen
                            </NavLink>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
