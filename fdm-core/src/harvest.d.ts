import type * as schema from "./db/schema"

export interface Harvest {
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"]
    b_lu_harvest_date: schema.cultivationHarvestingTypeSelect["b_lu_harvest_date"]
    b_lu: schema.cultivationHarvestingTypeSelect["b_lu"]
    harvestables: Harvestable[]
}

export interface Harvestable {
    b_id_harvestable: schema.harvestablesTypeSelect["b_id_harvestable"]
    harvestable_analyses: HarvestableAnalysis[]
}

export interface HarvestableAnalysis {
    b_id_harvestable_analysis: schema.harvestableAnalysesTypeSelect["b_id_harvestable_analysis"]
    b_lu_yield: schema.harvestableAnalysesTypeSelect["b_lu_yield"]
    b_lu_n_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_n_harvestable"]
    b_lu_n_residue: schema.harvestableAnalysesTypeSelect["b_lu_n_residue"]
    b_lu_p_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_p_harvestable"]
    b_lu_p_residue: schema.harvestableAnalysesTypeSelect["b_lu_p_residue"]
    b_lu_k_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_k_harvestable"]
    b_lu_k_residue: schema.harvestableAnalysesTypeSelect["b_lu_k_residue"]
}
