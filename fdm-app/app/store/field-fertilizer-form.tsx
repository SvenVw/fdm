import type z from "zod"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { FormSchema } from "../components/blocks/fertilizer-applications/formschema"

type FieldFertilizerFormValues = z.infer<typeof FormSchema>
interface FieldFertilizerFormStore {
    db: Record<string, Partial<FieldFertilizerFormValues>>
    save(
        b_id_farm: string,
        b_id: string,
        formData: Partial<FieldFertilizerFormValues>,
    ): void
    load(
        b_id_farm: string,
        b_id: string,
    ): Partial<FieldFertilizerFormValues> | undefined
    delete(b_id_farm: string, b_id: string): void
}

function makeId(b_id_farm: string, b_id: string) {
    return `${b_id_farm}/${b_id}`
}
export const useFieldFertilizerFormStore = create<FieldFertilizerFormStore>()(
    persist(
        (set, get) => ({
            db: {},
            save(b_id_farm, b_id, formData) {
                const db = { ...get().db, [makeId(b_id_farm, b_id)]: formData }
                set({ db })
            },
            load(b_id_farm, b_id) {
                return get().db[makeId(b_id_farm, b_id)]
            },
            delete(b_id_farm, b_id) {
                const db = { ...get().db }
                delete db[makeId(b_id_farm, b_id)]
                set({ db })
            },
        }),
        {
            name: "field-fertilizer-form", // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
        },
    ),
)
