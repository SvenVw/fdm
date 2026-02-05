import { useState } from "react"
import {
    type ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from "@tanstack/react-table"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "~/components/ui/table"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "~/components/ui/select"
import { Button } from "~/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import { Check, AlertTriangle, Save, X, Microscope } from "lucide-react"
import type { SoilParameterDescription } from "@svenvw/fdm-core"
import { format } from "date-fns/format"
import { nl } from "date-fns/locale/nl"

export type ProcessedAnalysis = {
    id: string
    filename: string
    b_sampling_date: string
    a_som_loi?: number
    a_p_al?: number
    a_p_cc?: number
    a_nmin_cc?: number
    a_source: string
    matchedFieldId?: string
    data: any // Raw parsed data
}

type Field = {
    b_id: string
    b_name: string
}

export function BulkSoilAnalysisReview({
    analyses,
    fields,
    soilParameterDescription,
    onSave,
    onCancel,
}: {
    analyses: ProcessedAnalysis[]
    fields: Field[]
    soilParameterDescription: SoilParameterDescription
    onSave: (matches: { analysisId: string; fieldId: string }[]) => void
    onCancel: () => void
}) {
    const [matches, setMatches] = useState<Record<string, string>>(
        Object.fromEntries(analyses.map((a) => [a.id, a.matchedFieldId || ""])),
    )

    const handleFieldChange = (analysisId: string, fieldId: string) => {
        setMatches((prev) => ({ ...prev, [analysisId]: fieldId }))
    }

    const columns: ColumnDef<ProcessedAnalysis>[] = [
        {
            accessorKey: "filename",
            header: "Bestand / Lab",
            cell: ({ row }) => {
                const sourceParam = soilParameterDescription.find(
                    (x: { parameter: string }) => x.parameter === "a_source",
                )
                const sourceOption = sourceParam?.options?.find(
                    (x: { value: string }) => x.value === row.original.a_source,
                )
                const sourceLabel =
                    sourceOption?.label || row.original.a_source || "Onbekend"

                return (
                    <div className="flex flex-col">
                        <span className="font-medium">
                            {row.original.filename}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Microscope className="h-3 w-3 mr-1" />
                            <span>{sourceLabel}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "b_sampling_date",
            header: "Datum",
            cell: ({ row }) =>
                row.original.b_sampling_date
                    ? format(new Date(row.original.b_sampling_date), "P", {
                          locale: nl,
                      })
                    : "-",
        },
        {
            id: "parameters",
            header: "Parameters",
            cell: ({ row }) => (
                <div className="flex flex-wrap gap-1">
                    {row.original.a_som_loi !== undefined && (
                        <Badge variant="secondary">
                            OS: {row.original.a_som_loi}%
                        </Badge>
                    )}
                    {row.original.a_p_al !== undefined && (
                        <Badge variant="secondary">
                            P-AL: {row.original.a_p_al}
                        </Badge>
                    )}
                    {row.original.a_p_cc !== undefined && (
                        <Badge variant="secondary">
                            P-CaCl₂: {row.original.a_p_cc}
                        </Badge>
                    )}
                    {row.original.a_nmin_cc !== undefined && (
                        <Badge variant="secondary">
                            Nmin: {row.original.a_nmin_cc}
                        </Badge>
                    )}
                </div>
            ),
        },
        {
            id: "match",
            header: "Perceel",
            cell: ({ row }) => (
                <Select
                    value={matches[row.original.id]}
                    onValueChange={(value) =>
                        handleFieldChange(row.original.id, value)
                    }
                >
                    <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Selecteer perceel..." />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">-- Geen perceel --</SelectItem>
                        {fields.map((field) => (
                            <SelectItem key={field.b_id} value={field.b_id}>
                                {field.b_name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            ),
        },
        {
            id: "status",
            header: "Status",
            cell: ({ row }) => {
                const match = matches[row.original.id]
                const isMatched = match && match !== "none"
                const isValid =
                    row.original.b_sampling_date &&
                    !Number.isNaN(new Date(row.original.b_sampling_date).getTime())

                if (!isValid) {
                    return (
                        <div className="flex items-center text-destructive">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            <span className="text-xs">Ongeldige pdf</span>
                        </div>
                    )
                }

                return isMatched ? (
                    <div className="flex items-center text-green-600">
                        <Check className="h-4 w-4 mr-1" />
                        <span className="text-xs">Gekoppeld</span>
                    </div>
                ) : (
                    <div className="flex items-center text-amber-600">
                        <AlertTriangle className="h-4 w-4 mr-1" />
                        <span className="text-xs">Niet gekoppeld</span>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: analyses,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    const handleSave = () => {
        const result = Object.entries(matches)
            .filter(([analysisId, fieldId]) => {
                if (fieldId === "" || fieldId === "none") return false
                const analysis = analyses.find((a) => a.id === analysisId)
                const isValid =
                    analysis?.b_sampling_date &&
                    !Number.isNaN(new Date(analysis.b_sampling_date).getTime())
                return isValid
            })
            .map(([analysisId, fieldId]) => ({ analysisId, fieldId }))
        onSave(result)
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Controleer en koppel</CardTitle>
                <CardDescription>
                    Controleer de gegevens uit de pdf's en koppel ze aan het
                    juiste perceel. Analyses met ontbrekende datum of zonder
                    gekoppeld perceel worden overgeslagen.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <TableHead key={header.id}>
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                      header.column.columnDef
                                                          .header,
                                                      header.getContext(),
                                                  )}
                                        </TableHead>
                                    ))}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ? (
                                table.getRowModel().rows.map((row) => {
                                    const isValid =
                                        row.original.b_sampling_date &&
                                        !Number.isNaN(
                                            new Date(
                                                row.original.b_sampling_date,
                                            ).getTime(),
                                        )

                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={
                                                row.getIsSelected() &&
                                                "selected"
                                            }
                                            className={
                                                !isValid
                                                    ? "bg-destructive/5"
                                                    : ""
                                            }
                                        >
                                            {row.getVisibleCells().map(
                                                (cell) => (
                                                    <TableCell key={cell.id}>
                                                        {cell.column.id ===
                                                            "match" &&
                                                        !isValid ? (
                                                            <div className="text-xs text-muted-foreground italic px-3">
                                                                Niet koppelbaar
                                                            </div>
                                                        ) : (
                                                            flexRender(
                                                                cell.column
                                                                    .columnDef
                                                                    .cell,
                                                                cell.getContext(),
                                                            )
                                                        )}
                                                    </TableCell>
                                                ),
                                            )}
                                        </TableRow>
                                    )
                                })
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
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
                <Button variant="outline" onClick={onCancel}>
                    <X className="mr-2 h-4 w-4" />
                    Annuleren
                </Button>
                <Button
                    onClick={handleSave}
                    disabled={
                        !Object.entries(matches).some(([analysisId, fieldId]) => {
                            if (fieldId === "" || fieldId === "none") return false
                            const analysis = analyses.find((a) => a.id === analysisId)
                            return (
                                analysis?.b_sampling_date &&
                                !Number.isNaN(new Date(analysis.b_sampling_date).getTime())
                            )
                        })
                    }
                >
                    <Save className="mr-2 h-4 w-4" />
                    Opslaan & Koppelen
                </Button>
            </CardFooter>
        </Card>
    )
}
