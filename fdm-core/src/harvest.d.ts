import type * as schema from "./db/schema"

export interface HarvestType {
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"]
    b_harvesting_date: schema.cultivationHarvestingTypeSelect["b_harvesting_date"]
    harvestable: HarvestableType[]
}

export interface HarvestableType {
    b_id_harvestable: schema.harvestablesTypeSelect["b_id_harvestable"]
    harvestableAnalysis: HarvestableAnalysisType[]
}

export interface HarvestableAnalysisType {
    b_id_harvestable_analysis: schema.harvestableAnalysesTypeSelect["b_id_harvestable_analysis"]
    b_lu_yield: schema.harvestableAnalysesTypeSelect["b_lu_yield"]
    b_lu_n_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_n_harvestable"]
    b_lu_n_residue: schema.harvestableAnalysesTypeSelect["b_lu_n_residue"]
    b_lu_p_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_p_harvestable"]
    b_lu_p_residue: schema.harvestableAnalysesTypeSelect["b_lu_p_residue"]
    b_lu_k_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_k_harvestable"]
    b_lu_k_residue: schema.harvestableAnalysesTypeSelect["b_lu_k_residue"]
}