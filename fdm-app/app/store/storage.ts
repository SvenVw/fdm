import type { StateStorage } from "zustand/middleware"

const createSSRStorage = (): StateStorage => {
    if (typeof window !== "undefined") {
        return localStorage
    }

    // Return a no-op storage for SSR
    return {
        getItem: (_name: string) => null,
        setItem: (_name: string, _value: string) => {},
        removeItem: (_name: string) => {},
    }
}

export const ssrSafeJSONStorage = createSSRStorage()
