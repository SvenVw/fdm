import type { Row } from "@tanstack/react-table"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type {
    CropRow,
    FieldRow,
    RotationExtended,
} from "~/components/blocks/rotation/columns"
import { ssrSafeSessionJSONStorage } from "./storage"

interface FieldFilterState {
    selection: Record<string, Record<string, boolean>>
    clear(): void
    getSelectionFor(rows: Row<RotationExtended>[]): Record<string, boolean>
    setSelectionFrom(
        rows: Row<RotationExtended>[],
        selection: Record<string, boolean>,
    ): void
}

export const useRotationSelectionStore = create<FieldFilterState>()(
    persist(
        (set, get) => ({
            selection: {},
            clear() {
                set({ selection: {} })
            },
            setSelectionFrom(rows, selection) {
                console.log(rows, selection)
                const finalSelection: Record<
                    string,
                    Record<string, boolean>
                > = {}

                for (const row of rows) {
                    const subSelection: Record<string, boolean> = {}
                    for (const fieldRow of row.subRows) {
                        subSelection[(fieldRow.original as FieldRow).b_id] =
                            selection[fieldRow.id]
                    }
                    finalSelection[(row.original as CropRow).b_lu_catalogue] =
                        subSelection
                }

                console.log(finalSelection)
                set({ selection: finalSelection })
            },

            getSelectionFor(rows) {
                const rowSelection: Record<string, boolean> = {}
                const selection = get().selection
                for (const row of rows) {
                    const b_lu_catalogue = (row.original as CropRow)
                        .b_lu_catalogue

                    const subSelection = selection[b_lu_catalogue] ?? {}
                    let allSelected = row.subRows.length > 0
                    for (const fieldRow of row.subRows) {
                        const b_id = (fieldRow.original as FieldRow).b_id
                        const val = !!subSelection[b_id]
                        rowSelection[fieldRow.id] = val
                        allSelected &&= val
                    }
                    if (allSelected) rowSelection[row.id] = allSelected
                }
                return rowSelection
            },
        }),
        {
            name: "field-filter-storage", // unique name
            storage: createJSONStorage(() => ssrSafeSessionJSONStorage), // Use SSR-safe storage
        },
    ),
)
