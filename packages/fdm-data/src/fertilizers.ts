import { addFertilizerToCatalogue, type FdmType } from "fdm-core";

export async function extendFertilizersCatalogue(fdm: FdmType, datasetName: string): Promise<void> {
    
    let dataset = [{}]
    if (datasetName == 'test') {
        dataset = [
            {
                p_source: "test",
                p_name_nl: "KAS",
                p_description: 'A test product for KAS',
                p_n_rt: 27
            }
        ]
    }

    if (dataset.length === 0) {
        throw new Error(`Dataset ${datasetName} is not recognized`)
    } else {
        dataset.map(async product => {

            await addFertilizerToCatalogue({
                fdm: fdm,
                p_name_nl: product.p_name_nl,
                p_description: product.p_description,
                p_n_rt: product.p_n_rt
            })
        })
    }

}