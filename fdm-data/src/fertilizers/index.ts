import {
    type FdmType,
    addFertilizerToCatalogue,
    type fdmSchema,
    getFertilizersFromCatalogue,
} from "@svenvw/fdm-core"
import { getCatalogueSrm } from "./catalogues/srm"

export async function extendFertilizersCatalogue(
    fdm: FdmType,
    catalogueName: string,
): Promise<void> {
    // Get the specified catalogue
    let catalogue: fdmSchema.fertilizersCatalogueTypeInsert[] = []
    if (catalogueName == "srm") {
        catalogue = getCatalogueSrm()
    }

    // Check if specified catalogue exist
    if (catalogue.length === 0) {
        throw new Error(`catalogue ${catalogueName} is not recognized`)
    }

    // Get list of fertilizers from catalogue
    const fertilizersCatalogue = await getFertilizersFromCatalogue(fdm)

    // Add fertilizers to catalogue
    await Promise.all(
        catalogue.map(async (fertilizer) => {
            // Check if fertilizer is already present in catalogue
            const fertilizerInCatalogue = fertilizersCatalogue.find(
                (x: fdmSchema.fertilizersCatalogueTypeSelect): any =>
                    x.p_id_catalogue === fertilizer.p_id_catalogue,
            )

            // If fertilizer is not present in catalogue, add it to fdm instance
            if (!fertilizerInCatalogue) {
                await addFertilizerToCatalogue(fdm, {
                    p_id_catalogue: fertilizer.p_id_catalogue,
                    p_source: fertilizer.p_source,
                    p_name_nl: fertilizer.p_name_nl,
                    p_name_en: fertilizer.p_name_en,
                    p_description: fertilizer.p_description,
                    p_dm: fertilizer.p_dm,
                    p_density: fertilizer.p_density,
                    p_om: fertilizer.p_om,
                    p_a: fertilizer.p_a,
                    p_hc: fertilizer.p_hc,
                    p_eom: fertilizer.p_eom,
                    p_eoc: fertilizer.p_eoc,
                    p_c_rt: fertilizer.p_c_rt,
                    p_c_of: fertilizer.p_c_of,
                    p_c_if: fertilizer.p_c_if,
                    p_c_fr: fertilizer.p_c_fr,
                    p_cn_of: fertilizer.p_cn_of,
                    p_n_rt: fertilizer.p_n_rt,
                    p_n_if: fertilizer.p_n_if,
                    p_n_of: fertilizer.p_n_of,
                    p_n_wc: fertilizer.p_n_wc,
                    p_p_rt: fertilizer.p_p_rt,
                    p_k_rt: fertilizer.p_k_rt,
                    p_mg_rt: fertilizer.p_mg_rt,
                    p_ca_rt: fertilizer.p_ca_rt,
                    p_ne: fertilizer.p_ne,
                    p_s_rt: fertilizer.p_s_rt,
                    p_s_wc: fertilizer.p_s_wc,
                    p_cu_rt: fertilizer.p_cu_rt,
                    p_zn_rt: fertilizer.p_zn_rt,
                    p_na_rt: fertilizer.p_na_rt,
                    p_si_rt: fertilizer.p_si_rt,
                    p_b_rt: fertilizer.p_b_rt,
                    p_mn_rt: fertilizer.p_mn_rt,
                    p_ni_rt: fertilizer.p_ni_rt,
                    p_fe_rt: fertilizer.p_fe_rt,
                    p_mo_rt: fertilizer.p_mo_rt,
                    p_co_rt: fertilizer.p_co_rt,
                    p_as_rt: fertilizer.p_as_rt,
                    p_cd_rt: fertilizer.p_cd_rt,
                    pr_cr_rt: fertilizer.p_cr_rt,
                    p_cr_vi: fertilizer.p_cr_vi,
                    p_pb_rt: fertilizer.p_pb_rt,
                    p_hg_rt: fertilizer.p_hg_rt,
                    p_type_manure: fertilizer.p_type_manure,
                    p_type_mineral: fertilizer.p_type_mineral,
                    p_type_compost: fertilizer.p_type_compost,
                })
            }
        }),
    )
}
