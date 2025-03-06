export type CatalogueCultivationName = "brp"

export interface CatalogueCultivationItem {
    b_lu_source: CatalogueCultivationName
    b_lu_catalogue: string
    b_lu_name: string
    b_lu_name_en: string | null
    b_lu_harvestable: "once" | "none" | "multiple"
    b_lu_hcat3: string | null
    b_lu_hcat3_name: string | null
    hash: string | null
}

export type CatalogueCultivation = CatalogueCultivationItem[]
