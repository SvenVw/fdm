import srm from './srm.json'
import { fdmSchema } from 'fdm-core'

export function getCatalogueSrm(): fdmSchema.fertilizersCatalogueTypeInsert[] {

    const catalogueSrm = srm.map(fertilizer => {
        return {
            p_source: 'srm',
           ...fertilizer
        }
    })

    return catalogueSrm
}