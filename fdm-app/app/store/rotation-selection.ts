import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import { ssrSafeSessionJSONStorage } from "./storage"

interface FieldSelectionState {
    farmId: string | null
    selection: Record<string, Record<string, boolean>>
    setSelection: (selection: Record<string, Record<string, boolean>>) => void
    syncFarm: (farmId: string) => void
}

export const useRotationSelectionStore = create<FieldSelectionState>()(
    persist(
        (set, get) => ({
            farmId: null,
            selection: {},
            setSelection(selection: Record<string, Record<string, boolean>>) {
                set({ selection })
            },
            syncFarm(farmId: string) {
                if (get().farmId !== farmId) {
                    set({ farmId, selection: {} })
                }
            },
        }),
        {
            name: "rotation-selection-storage", // unique name
            storage: createJSONStorage(() => ssrSafeSessionJSONStorage), // Use SSR-safe storage
        },
    ),
)
