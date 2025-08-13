import type * as schema from "./db/schema"

export interface Cultivation {
    b_lu: schema.cultivationsTypeSelect["b_lu"]
    b_lu_catalogue: schema.cultivationsTypeSelect["b_lu_catalogue"]
    b_lu_source: schema.cultivationsCatalogueTypeSelect["b_lu_source"]
    b_lu_name: schema.cultivationsCatalogueTypeSelect["b_lu_name"]
    b_lu_name_en: schema.cultivationsCatalogueTypeSelect["b_lu_name_en"]
    b_lu_hcat3: schema.cultivationsCatalogueTypeSelect["b_lu_hcat3"]
    b_lu_hcat3_name: schema.cultivationsCatalogueTypeSelect["b_lu_hcat3_name"]
    b_lu_croprotation: schema.cultivationsCatalogueTypeSelect["b_lu_croprotation"]
    b_lu_variety: schema.cultivationsTypeSelect["b_lu_variety"]
    b_lu_start: schema.cultivationStartingTypeSelect["b_lu_start"]
    b_lu_end: schema.cultivationEndingTypeSelect["b_lu_end"]
    m_cropresidue: schema.cultivationEndingTypeSelect["m_cropresidue"]
    b_id: schema.cultivationStartingTypeSelect["b_id"]
}

export interface CultivationPlan {
    b_lu_catalogue: schema.cultivationsCatalogueTypeSelect["b_lu_catalogue"]
    b_lu_name: schema.cultivationsCatalogueTypeSelect["b_lu_name"]
    b_lu_variety: schema.cultivationsTypeSelect["b_lu_variety"]
    b_area: number
    b_lu_start: schema.cultivationStartingTypeSelect["b_lu_start"]
    b_lu_end: schema.cultivationEndingTypeSelect["b_lu_end"]
    m_cropresidue: schema.cultivationEndingTypeSelect["m_cropresidue"]
    fields: Array<{
        b_lu: schema.cultivationsTypeSelect["b_lu"]
        b_id: schema.fieldsTypeSelect["b_id"]
        b_area: number
        b_name: schema.fieldsTypeSelect["b_name"]
        fertilizer_applications: Array<{
            p_id_catalogue: schema.fertilizersCatalogueTypeSelect["p_id_catalogue"]
            p_name_nl: schema.fertilizersCatalogueTypeSelect["p_name_nl"]
            p_app_amount: schema.fertilizerApplicationTypeSelect["p_app_amount"]
            p_app_method: schema.fertilizerApplicationTypeSelect["p_app_method"]
            p_app_date: schema.fertilizerApplicationTypeSelect["p_app_date"]
            p_app_id: schema.fertilizerApplicationTypeSelect["p_app_id"]
        }>
        harvests: Array<{
            b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_"]
            b_lu_harvest_date: schema.cultivationHarvestingTypeSelect["b_lu_harvest_date"]
            harvestable: {
                b_id_harvestable: schema.harvestableAnalysesTypeSelect["b_id_harvestable"]
                harvestable_analyses: Array<{
                    b_lu_yield: schema.harvestableAnalysesTypeSelect["b_lu_yield"]
                    b_lu_n_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_n_harvestable"]
                    b_lu_n_residue: schema.harvestableAnalysesTypeSelect["b_lu_n_residue"]
                    b_lu_p_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_p_harvestable"]
                    b_lu_p_residue: schema.harvestableAnalysesTypeSelect["b_lu_p_residue"]
                    b_lu_k_harvestable: schema.harvestableAnalysesTypeSelect["b_lu_k_harvestable"]
                    b_lu_k_residue: schema.harvestableAnalysesTypeSelect["b_lu_k_residue"]
                }>
            }
        }>
    }>
}

export type CultivationCatalogue = schema.cultivationsCatalogueTypeSelect
