import type { ColumnDef } from "@tanstack/react-table"

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
        header: "N",
    },
    {
        accessorKey: "p_p_rt",
        header: "P",
    },
]
