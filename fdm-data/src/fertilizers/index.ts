import { addFertilizerToCatalogue, type FdmType, fdmSchema } from "fdm-core";
import { getDatasetSrm } from "./datasets/srm";

export async function extendFertilizersCatalogue(fdm: FdmType, datasetName: string): Promise<void> {

    let dataset: fdmSchema.fertilizersCatalogueTypeInsert[] = []
    if (datasetName == 'srm') {
        dataset = getDatasetSrm()
    }

    if (dataset.length === 0) {
        throw new Error(`Dataset ${datasetName} is not recognized`)
    }

    // Add fertilizers to catalogue
    dataset.map(async product => {

        await addFertilizerToCatalogue({
            fdm: fdm,
            p_id_catalogue: product.p_id_catalogue,
            p_source: product.p_source,
            p_name_nl: product.p_name_nl,
            p_name_en: product.p_name_en,
            p_description: product.p_description,
            properties: {
                p_dm: product.p_dm,
                p_om: product.p_om,
                p_a: product.p_a,
                p_hc: product.p_hc,
                p_eom: product.p_eom,
                p_eoc: product.p_eoc,
                p_c_rt: product.p_c_rt,
                p_c_of: product.p_c_of,
                p_c_if: product.p_c_if,
                p_c_fr: product.p_c_fr,
                p_cn_of: product.p_cn_of,
                p_n_rt: product.p_n_rt,
                p_n_if: product.p_n_if,
                p_n_of: product.p_n_of,
                p_n_wc: product.p_n_wc,
                p_p_rt: product.p_p_rt,
                p_k_rt: product.p_k_rt,
                p_mg_rt: product.p_mg_rt,
                p_ca_rt: product.p_ca_rt,
                p_ne: product.p_ne,
                p_s_rt: product.p_s_rt,
                p_s_wc: product.p_s_wc,
                p_cu_rt: product.p_cu_rt,
                p_zn_rt: product.p_zn_rt,
                p_na_rt: product.p_na_rt,
                p_si_rt: product.p_si_rt,
                p_b_rt: product.p_b_rt,
                p_mn_rt: product.p_mn_rt,
                p_ni_rt: product.p_ni_rt,
                p_fe_rt: product.p_fe_rt,
                p_mo_rt: product.p_mo_rt,
                p_co_rt: product.p_co_rt,
                p_as_rt: product.p_as_rt,
                p_cd_rt: product.p_cd_rt,
                pr_cr_rt: product.p_cr_rt,
                p_cr_vi: product.p_cr_vi,
                p_pb_rt: product.p_pb_rt,
                p_hg_rt: product.p_hg_rt
            }
        })
    })
}