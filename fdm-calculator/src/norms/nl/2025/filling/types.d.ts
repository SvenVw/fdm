import type { fdmSchema } from "@svenvw/fdm-core"

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
