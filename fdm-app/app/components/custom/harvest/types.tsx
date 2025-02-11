export interface Harvest {
    b_id_harvesting: string;
    b_harvesting_date: Date;
    harvestable: { harvestableAnalysis: { b_lu_yield: number }[] }[];
}