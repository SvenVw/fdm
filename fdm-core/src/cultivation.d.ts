import * as schema from './db/schema'

export interface getCultivationType {
    b_lu: schema.cultivationsTypeSelect['b_lu'],
    b_lu_catalogue: schema.cultivationsTypeSelect['b_lu_catalogue'],
    b_lu_source: schema.cultivationsCatalogueTypeSelect['b_lu_source'],
    b_lu_name: schema.cultivationsCatalogueTypeSelect['b_lu_name'],
    b_lu_name_en: schema.cultivationsCatalogueTypeSelect['b_lu_name_en'],
    b_lu_hcat3: schema.cultivationsCatalogueTypeSelect['b_lu_hcat3'],
    b_lu_hcat3_name: schema.cultivationsCatalogueTypeSelect['b_lu_hcat3_name'],
    b_sowing_date: schema.fieldSowingTypeSelect['b_sowing_date'],
    b_id: schema.fieldSowingTypeSelect['b_id'],
}
