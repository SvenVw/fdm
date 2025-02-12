export interface Harvest {
    b_id_harvesting: string
    b_id_harvestings: string[] | undefined
    b_harvesting_date: Date
    harvestables: { harvestable_analyses: { b_lu_yield: number }[] }[]
}

export type HarverstableType = "none" | "once" | "multiple"
