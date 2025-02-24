import type * as schema from "./db/schema"

export interface getFieldType {
    b_id: schema.fieldsTypeSelect["b_id"]
    b_name: schema.fieldsTypeSelect["b_name"]
    b_id_farm: schema.fieldAcquiringTypeSelect["b_id_farm"]
    b_id_source: schema.fieldsTypeSelect["b_id_source"]
    b_geometry: schema.fieldsTypeSelect["b_geometry"]
    b_area: number | null
    b_acquiring_date: schema.fieldAcquiringTypeSelect["b_acquiring_date"]
    b_discarding_date: schema.fieldDiscardingTypeSelect["b_discarding_date"]
    b_acquiring_method: schema.fieldAcquiringTypeSelect["b_acquiring_method"]
    created: Date | null
    updated: Date | null
}
