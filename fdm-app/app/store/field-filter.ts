import { create } from "zustand"
import { persist, createJSONStorage } from "zustand/middleware"

interface FieldFilterState {
    showProductiveOnly: boolean
    toggleShowProductiveOnly: () => void
}

export const useFieldFilterStore = create<FieldFilterState>()(
    persist(
        (set) => ({
            showProductiveOnly: false, // Default to showing all fields
            toggleShowProductiveOnly: () =>
                set((state) => ({
                    showProductiveOnly: !state.showProductiveOnly,
                })),
        }),
        {
            name: "field-filter-storage", // unique name
            storage: createJSONStorage(() => localStorage), // Use localStorage
        },
    ),
)
