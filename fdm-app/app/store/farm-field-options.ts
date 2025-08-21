import { create } from "zustand"
import type { HeaderFarmOption } from "~/components/blocks/header/farm"
import type { HeaderFieldOption } from "~/components/blocks/header/field"

/**
 * Cache for farm and field options, to be used in error boundaries only.
 *
 * Do not use this store server-side
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
     * Adds a singe farm option so it is later found by getFarmById
     *
     * @param b_id_farm The farm id
     * @param b_name_farm The farm name
     */
    addFarmOption(b_id_farm: string, b_name_farm: string): void
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
        addFarmOption(b_id_farm, b_name_farm) {
            set((state) => {
                const item = { b_id_farm, b_name_farm }

                const duplicateIndex = state.farmOptions.findIndex(
                    (f) => f.b_id_farm === b_id_farm,
                )
                if (duplicateIndex > -1) {
                    const newFarmOptions = state.farmOptions.slice()
                    newFarmOptions[duplicateIndex] = item
                    return { farmOptions: newFarmOptions }
                }

                return { farmOptions: [item, ...get().farmOptions] }
            })
        },
        getFarmById(b_id_farm) {
            if (b_id_farm) {
                return get().farmOptions.find((f) => f.b_id_farm === b_id_farm)
            }
        },
        getFieldById(b_id) {
            if (b_id) {
                return get().fieldOptions.find((f) => f.b_id === b_id)
            }
        },
    }),
)
