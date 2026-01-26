import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { ssrSafeSessionJSONStorage } from "./storage"

interface FieldFilterState {
    fieldIds: string[]
    setFieldIds: (fieldIds: string[]) => void
}

export const useFieldSelectionStore = create<FieldFilterState>()(
    persist(
        (set) => ({
            fieldIds: [],
            setFieldIds(fieldIds: string[]) {
                set({ fieldIds })
            },
        }),
        {
            name: "field-selection-storage", // unique name
            storage: createJSONStorage(() => ssrSafeSessionJSONStorage), // Use SSR-safe storage
        },
    ),
)
