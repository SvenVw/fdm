import type z from "zod"
import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"
import type { FormSchema } from "~/components/blocks/fertilizer-applications/formschema"

type FieldFertilizerFormValues = z.infer<typeof FormSchema>
interface FieldFertilizerFormStore {
    db: Record<string, Partial<FieldFertilizerFormValues>>
    save(
        b_id_farm: string,
        b_id_or_b_lu_catalogue: string,
        formData: Partial<FieldFertilizerFormValues>,
    ): void
    load(
        b_id_farm: string,
        b_id_or_b_lu_catalogue: string,
    ): Partial<FieldFertilizerFormValues> | undefined
    delete(b_id_farm: string, b_id_or_b_lu_catalogue: string): void
}

function makeId(b_id_farm: string, b_id: string) {
    return `${b_id_farm}/${b_id}`
}
export const useFieldFertilizerFormStore = create<FieldFertilizerFormStore>()(
    persist(
        (set, get) => ({
            db: {},
            save(b_id_farm, b_id_or_b_lu_catalogue, formData) {
                const db = {
                    ...get().db,
                    [makeId(b_id_farm, b_id_or_b_lu_catalogue)]: formData,
                }
                set({ db })
            },
            load(b_id_farm, b_id_or_b_lu_catalogue) {
                return get().db[makeId(b_id_farm, b_id_or_b_lu_catalogue)]
            },
            delete(b_id_farm, b_id_or_b_lu_catalogue) {
                const db = { ...get().db }
                delete db[makeId(b_id_farm, b_id_or_b_lu_catalogue)]
                set({ db })
            },
        }),
        {
            name: "field-fertilizer-form", // name of the item in the storage (must be unique)
            storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
        },
    ),
)
