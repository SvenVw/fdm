import brp from './brp.json'
import { fdmSchema } from '@svenvw/fdm-core'

/**
 * Retrieves the BRP cultivation catalogue.
 *
 * @returns An array of cultivation catalogue entries conforming to the `cultivationsCatalogueTypeInsert` schema.
 */
export function getCatalogueBrp(): fdmSchema.cultivationsCatalogueTypeInsert[] {

    const catalogueBrp = brp.map(cultivation => {
        return {
            b_lu_source: 'brp',
           ...cultivation
        }
    })

    return catalogueBrp
}