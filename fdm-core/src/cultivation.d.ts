import type * as schema from "./db/schema"

export interface getCultivationType {
    b_lu: schema.cultivationsTypeSelect["b_lu"]
    b_lu_catalogue: schema.cultivationsTypeSelect["b_lu_catalogue"]
    b_lu_source: schema.cultivationsCatalogueTypeSelect["b_lu_source"]
    b_lu_name: schema.cultivationsCatalogueTypeSelect["b_lu_name"]
    b_lu_name_en: schema.cultivationsCatalogueTypeSelect["b_lu_name_en"]
    b_lu_hcat3: schema.cultivationsCatalogueTypeSelect["b_lu_hcat3"]
    b_lu_hcat3_name: schema.cultivationsCatalogueTypeSelect["b_lu_hcat3_name"]
    b_sowing_date: schema.fieldSowingTypeSelect["b_sowing_date"]
    b_id: schema.fieldSowingTypeSelect["b_id"]
}

export interface cultivationPlanType {
    b_lu_catalogue: schema.cultivationsCatalogueTypeSelect["b_lu_catalogue"]
    b_lu_name: schema.cultivationsCatalogueTypeSelect["b_lu_name"]
    fields: Array<{
        b_lu: schema.cultivationsTypeSelect["b_lu"]
        b_id: schema.fieldsTypeSelect["b_id"]
        b_name: schema.fieldsTypeSelect["b_name"]
        fertilizer_applications: Array<{
            p_id_catalogue: schema.fertilizersCatalogueTypeSelect["p_id_catalogue"]
            p_name_nl: schema.fertilizersCatalogueTypeSelect["p_name_nl"]
            p_app_amount: schema.fertilizerApplicationTypeSelect["p_app_amount"]
            p_app_method: schema.fertilizerApplicationTypeSelect["p_app_method"]
            p_app_date: schema.fertilizerApplicationTypeSelect["p_app_date"]
            p_app_id: schema.fertilizerApplicationTypeSelect["p_app_id"]
        }>
    }>
}
