import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { ssrSafeSessionJSONStorage } from "./storage"

interface FieldFilterState {
    showProductiveOnly: boolean
    searchTerms: string
    toggleShowProductiveOnly: () => void
    setSearchTerms: (value: string) => void
}

export const useFieldFilterStore = create<FieldFilterState>()(
    persist(
        (set) => ({
            showProductiveOnly: false, // Default to showing all fields
            searchTerms: "",
            toggleShowProductiveOnly: () =>
                set((state) => ({
                    showProductiveOnly: !state.showProductiveOnly,
                })),
            setSearchTerms: (value) => {
                set({
                    searchTerms: value,
                })
            },
        }),
        {
            name: "field-filter-storage", // unique name
            storage: createJSONStorage(() => ssrSafeSessionJSONStorage), // Use SSR-safe storage
        },
    ),
)
