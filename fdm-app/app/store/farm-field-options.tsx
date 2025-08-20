import { create } from "zustand"
import type { HeaderFarmOption } from "~/components/blocks/header/farm"
import type { HeaderFieldOption } from "~/components/blocks/header/field"

/**
 * Cache for farm and field options, to be used in error boundaries only.
 */
interface FarmFieldOptionsStore {
    /**
     * Farm options cached when the farm breadcrumb was last rendered.
     */
    farmOptions: HeaderFarmOption[]
    /**
     * Field options cached when the field breadcrumb was last rendered.
     */
    fieldOptions: HeaderFieldOption[]
    /**
     * Sets the cached list of farms as provided by the farm breadcrumb.
     *
     * @param farmOptions the list of HeaderFarmOption
     */
    setFarmOptions(farmOptions: HeaderFarmOption[]): void
    /**
     * Sets the cached list of fields as provided by the field breadcrumb.
     *
     * @param fieldOptions the list of HeaderFieldOption
     */
    setFieldOptions(fieldOptions: HeaderFieldOption[]): void
    /**
     * Tries to get the cached farm with the given id, otherwise returns undefined.
     *
     * @param b_id_farm The farm id
     * @returns the HeaderFarmOption if found otherwise undefined
     */
    getFarmById(b_id_farm: string | undefined): HeaderFarmOption | undefined
    /**
     * Tries to get the cached field with the given id, otherwise returns undefined.
     *
     * @param b_id The field id
     * @returns the HeaderFieldOption if found otherwise undefined
     */
    getFieldById(b_id: string | undefined): HeaderFieldOption | undefined
}

export const useFarmFieldOptionsStore = create<FarmFieldOptionsStore>(
    (set, get) => ({
        farmOptions: [],
        fieldOptions: [],
        setFarmOptions(farmOptions) {
            set({ farmOptions })
        },
        setFieldOptions(fieldOptions) {
            set({ fieldOptions })
        },
        getFarmById(b_id_farm) {
            return get().farmOptions.find((f) => f.b_id_farm === b_id_farm)
        },
        getFieldById(b_id) {
            return get().fieldOptions.find((f) => f.b_id === b_id)
        },
    }),
)
