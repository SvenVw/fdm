import srm from './srm.json'
import { fdmSchema } from 'fdm-core'

export function getDatasetSrm(): fdmSchema.fertilizersCatalogueTypeInsert[] {

    const srmDataset = srm.map(product => {
        return {
            p_source: 'srm',
           ...product
        }
    })

    return srmDataset
}
