import { create } from "zustand"
import { persist } from "zustand/middleware"

interface CacheStore<T> {
    db: Record<string, T>
    get: (id: string) => T | undefined
    set: (id: string, val: T) => void
}

function createCache<T>(name: string) {
    return create(
        persist<CacheStore<T>>(
            (_set, _get) => ({
                db: {},
                get: (id) => _get().db[id],
                set: (id, val) => _set({ db: { ..._get().db, [id]: val } }),
            }),
            { name },
        ),
    )
}

export const useFarmNormsCache = createCache("farm-norms-cache")
