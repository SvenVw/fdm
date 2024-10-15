import { type FdmServerType } from './fdm-server.d'
import { type FdmLocalType } from './fdm-local'

// Define type of Fdm
export type FdmType = FdmServerType | FdmLocalType

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

export interface getFertilizerType {
    p_id: string
    p_name_nl: string | null
    p_name_en: string | null
    p_description: string | null
    p_amount: number | null
    p_date_acquiring: Date | null
    p_picking_date: Date | null
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
}

interface getFertilizersType {
    p_id: string
}

