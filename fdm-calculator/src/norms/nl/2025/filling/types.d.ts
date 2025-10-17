import type { fdmSchema } from "@svenvw/fdm-core"
import { RegionKey } from "../types"

export type NormFilling = {
    normFilling: number
    applicationFilling: {
        p_app_id: string
        normFilling: number
        normFillingDetails?: string
    }[]
}

export type Table11Mestcodes = {
    p_type_rvo: fdmSchema.fertilizersCatalogueTypeSelect["p_type_rvo"]
    p_type_nitratesdirective: boolean
    p_n_rt?: number
    p_p_rt?: number
}[]

export type Table9 = {
    description: string
    p_type_rvo: fdmSchema.fertilizersCatalogueTypeSelect["p_type_rvo"][]
    onFarmProduced?: boolean
    subTypes?: {
        description: string
        b_grazing_intention?: boolean
        grondsoortCode?: RegionKey[]
        applicationPeriod?: "1 september t/m 31 januari" | "hele jaar"
        isBouwland?: boolean
        p_n_wcl: number
    }[]
    p_n_wcl?: number
}[]

export type WorkingCoefficientDetails = {
    p_n_wcl: number
    description: string
    subTypeDescription?: string
}

export type NL2025NormsFillingInput = {
    cultivations: cultivations
    applications: FertilizerApplication[]
    fertilizers: Fertilizer[]
    has_organic_certification: boolean
    has_grazining_intention: boolean
    fosfaatgebruiksnorm: number
    b_centroid: Field["b_centroid"]
}
