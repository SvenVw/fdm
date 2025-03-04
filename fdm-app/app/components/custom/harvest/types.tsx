export interface Harvest {
    b_id_harvesting: string
    b_ids_harvesting: string[] | undefined
    b_lu_harvest_date: Date
    harvestables: { harvestable_analyses: { b_lu_yield: number }[] }[]
}

export type HarvestableType = "none" | "once" | "multiple"
