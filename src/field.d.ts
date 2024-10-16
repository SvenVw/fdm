// Temporary definitions for query results that cannot be inferred yet
export interface getFieldType {
    b_id: string
    b_name: string | null
    b_id_farm: string
    b_manage_start: Date | null
    b_manage_end: Date | null
    b_manage_type: 'owner' | 'lease' | null
    created: Date
    updated: Date | null
}