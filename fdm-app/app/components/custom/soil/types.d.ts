export interface SoilAnalysis {
    a_id: string
    a_source: string
    b_sampling_date: Date
    a_p_al: number | undefined | null
    a_p_cc: number | undefined | null
    a_som_loi: number | undefined | null
    b_soiltype_agr: string | undefined | null
    b_gwl_class: string | undefined | null
}
