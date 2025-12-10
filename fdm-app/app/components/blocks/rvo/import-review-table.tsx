import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import type { RvoImportReviewItem } from "@svenvw/fdm-rvo/types"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import { Badge } from "~/components/ui/badge"
import { Check, Plus, Trash2, ArrowLeftRight, X } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"

export type ImportReviewAction =
    | "ADD_REMOTE"
    | "UPDATE_FROM_REMOTE"
    | "KEEP_LOCAL"
    | "REMOVE_LOCAL"
    | "IGNORE"
    | "NO_ACTION"

export type UserChoiceMap = Record<string, ImportReviewAction>

interface RvoImportReviewTableProps {
    data: RvoImportReviewItem<any>[]
    userChoices: UserChoiceMap
    onChoiceChange: (id: string, action: ImportReviewAction) => void
}

// Helper to derive a stable ID for the row
export function getItemId(item: RvoImportReviewItem<any>): string {
    return (
        item.localField?.b_id ||
        item.rvoField?.properties.CropFieldID ||
        "unknown"
    )
}

export const columns: ColumnDef<RvoImportReviewItem<any>>[] = [
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            switch (status) {
                case "MATCH":
                    return (
                        <Badge
                            variant="outline"
                            className="bg-green-50 text-green-700 border-green-200"
                        >
                            Gelijk
                        </Badge>
                    )
                case "NEW_REMOTE":
                    return (
                        <Badge
                            variant="outline"
                            className="bg-blue-50 text-blue-700 border-blue-200"
                        >
                            Nieuw (RVO)
                        </Badge>
                    )
                case "NEW_LOCAL":
                    return (
                        <Badge
                            variant="outline"
                            className="bg-yellow-50 text-yellow-700 border-yellow-200"
                        >
                            Nieuw (Lokaal)
                        </Badge>
                    )
                case "CONFLICT":
                    return (
                        <Badge
                            variant="destructive"
                            className="bg-red-50 text-red-700 border-red-200"
                        >
                            Conflict
                        </Badge>
                    )
                default:
                    return <Badge variant="secondary">{status}</Badge>
            }
        },
    },
    {
        header: "Lokaal Perceel",
        cell: ({ row }) => {
            const local = row.original.localField
            if (!local)
                return (
                    <span className="text-muted-foreground italic text-sm">
                        Geen
                    </span>
                )
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">{local.b_name}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {local.b_id_source || "Geen Bron ID"}
                    </span>
                </div>
            )
        },
    },
    {
        header: "RVO Perceel",
        cell: ({ row }) => {
            const remote = row.original.rvoField
            if (!remote)
                return (
                    <span className="text-muted-foreground italic text-sm">
                        Geen
                    </span>
                )
            return (
                <div className="flex flex-col">
                    <span className="font-medium text-sm">
                        {remote.properties.CropFieldDesignator || "Naamloos"}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                        {remote.properties.CropFieldID}
                    </span>
                </div>
            )
        },
    },
    {
        header: "Verschillen",
        cell: ({ row }) => {
            const diffs = row.original.diffs
            if (!diffs || diffs.length === 0)
                return <span className="text-muted-foreground text-sm">-</span>
            return (
                <div className="flex flex-wrap gap-1">
                    {diffs.map((diff) => (
                        <Badge
                            key={diff}
                            variant="secondary"
                            className="text-[10px] px-1 py-0 h-5"
                        >
                            {diff}
                        </Badge>
                    ))}
                </div>
            )
        },
    },
    {
        id: "actions",
        header: "Actie",
        cell: ({ row, table }) => {
            const item = row.original
            const id = getItemId(item)
            // @ts-ignore - meta is not strictly typed in React Table basic usage but useful here
            const { userChoices, onChoiceChange } = table.options.meta as any
            const currentChoice = userChoices[id] as ImportReviewAction

            if (item.status === "MATCH") {
                return (
                    <div className="flex items-center gap-2 text-green-600 text-sm">
                        <Check className="h-4 w-4" />
                        <span>Geimporteerd</span>
                    </div>
                )
            }

            return (
                <Select
                    value={currentChoice}
                    onValueChange={(val) =>
                        onChoiceChange(id, val as ImportReviewAction)
                    }
                >
                    <SelectTrigger className="w-[180px] h-8 text-xs">
                        <SelectValue placeholder="Kies actie" />
                    </SelectTrigger>
                    <SelectContent>
                        {item.status === "NEW_REMOTE" && (
                            <>
                                <SelectItem value="ADD_REMOTE">
                                    <div className="flex items-center gap-2">
                                        <Plus className="h-3 w-3" /> Toevoegen
                                    </div>
                                </SelectItem>
                                <SelectItem value="IGNORE">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <X className="h-3 w-3" /> Negeren
                                    </div>
                                </SelectItem>
                            </>
                        )}
                        {item.status === "NEW_LOCAL" && (
                            <>
                                <SelectItem value="KEEP_LOCAL">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-3 w-3" /> Behouden
                                    </div>
                                </SelectItem>
                                <SelectItem value="REMOVE_LOCAL">
                                    <div className="flex items-center gap-2 text-destructive">
                                        <Trash2 className="h-3 w-3" />{" "}
                                        Verwijderen
                                    </div>
                                </SelectItem>
                            </>
                        )}
                        {item.status === "CONFLICT" && (
                            <>
                                <SelectItem value="UPDATE_FROM_REMOTE">
                                    <div className="flex items-center gap-2">
                                        <ArrowLeftRight className="h-3 w-3" />{" "}
                                        Gebruik RVO
                                    </div>
                                </SelectItem>
                                <SelectItem value="KEEP_LOCAL">
                                    <div className="flex items-center gap-2">
                                        <Check className="h-3 w-3" /> Gebruik
                                        Lokaal
                                    </div>
                                </SelectItem>
                            </>
                        )}
                    </SelectContent>
                </Select>
            )
        },
    },
]

export function RvoImportReviewTable({
    data,
    userChoices,
    onChoiceChange,
}: RvoImportReviewTableProps) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        meta: {
            userChoices,
            onChoiceChange,
        },
    })

    return (
        <div className="rounded-md border bg-white">
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
                                data-state={row.getIsSelected() && "selected"}
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
    )
}
