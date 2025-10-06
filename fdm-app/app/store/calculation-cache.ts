import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface DataWithInputHash {
    inputHash?: string | undefined
}

export interface CacheStore<T extends DataWithInputHash> {
    db: Record<string, T>
    get: (id: string) => T | undefined
    set: (id: string, val: T) => void
}

function createCache<T extends DataWithInputHash>(name: string) {
    return create(
        persist<CacheStore<T>>(
            (_set, _get) => ({
                db: {},
                get: (id) => _get().db[id],
                set: (id, val) => _set({ db: { ..._get().db, [id]: val } }),
            }),
            {
                name,
                version: `fdm-calculator:${PUBLIC_FDM_CALCULATOR_VERSION}`,
            },
        ),
    )
}

export const useFarmNormsCache = createCache("farm-norms-cache")
export const useFarmNitrogenBalanceCache = createCache(
    "farm-nitrogen-balance-cache",
)
export const useFieldNitrogenBalanceCache = createCache(
    "field-nitrogen-balance-cache",
)
export const useFieldNutrientAdviceCache = createCache("field-norms-cache")
