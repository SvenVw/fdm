export type CatalogueCultivationName = "brp"

export interface CatalogueCultivationItem {
    b_lu_source: CatalogueCultivationName
    b_lu_catalogue: string
    b_lu_name: string
    b_lu_name_en: string | null
    b_lu_harvestable: "once" | "none" | "multiple"
    b_lu_hcat3: string | null
    b_lu_hcat3_name: string | null
    b_lu_croprotation:
        | "other"
        | "clover"
        | "nature"
        | "potato"
        | "grass"
        | "rapeseed"
        | "starch"
        | "maize"
        | "cereal"
        | "sugarbeet"
        | "alfalfa"
        | "catchcrop"
    b_lu_yield: number
    b_lu_hi: number
    b_lu_n_harvestable: number
    b_lu_n_residue: number
    b_n_fixation: number
    b_lu_rest_oravib: boolean
    b_lu_variety_options: string[] | null
    hash: string | null
}

export type CatalogueCultivation = CatalogueCultivationItem[]
