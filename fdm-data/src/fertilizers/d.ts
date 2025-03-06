export type CatalogueFertilizerName = "srm"

export interface CatalogueFertilizerItem {
    p_source: CatalogueFertilizerName
    p_id_catalogue: string
    p_name_nl: string
    p_name_en: string | null
    p_description: string | null
    p_dm: number | null
    p_density: number | null
    p_om: number | null
    p_a: number | null
    p_hc: number | null
    p_eom: number | null
    p_eoc: number | null
    p_c_rt: number | null
    p_c_of: number | null
    p_c_if: number | null
    p_c_fr: number | null
    p_cn_of: number | null
    p_n_rt: number | null
    p_n_if: number | null
    p_n_of: number | null
    p_n_wc: number | null
    p_p_rt: number | null
    p_k_rt: number | null
    p_mg_rt: number | null
    p_ca_rt: number | null
    p_ne: number | null
    p_s_rt: number | null
    p_s_wc: number | null
    p_cu_rt: number | null
    p_zn_rt: number | null
    p_na_rt: number | null
    p_si_rt: number | null
    p_b_rt: number | null
    p_mn_rt: number | null
    p_ni_rt: number | null
    p_fe_rt: number | null
    p_mo_rt: number | null
    p_co_rt: number | null
    p_as_rt: number | null
    p_cd_rt: number | null
    p_cr_rt: number | null
    p_cr_vi: number | null
    p_pb_rt: number | null
    p_hg_rt: number | null
    p_cl_cr: number | null
    p_type_manure: boolean | null
    p_type_mineral: boolean | null
    p_type_compost: boolean | null
}

export type CatalogueFertilizer = CatalogueFertilizerItem[]
