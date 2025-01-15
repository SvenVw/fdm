import type { fdmSchema } from "@svenvw/fdm-core"
import srm from "./srm.json"

export function getCatalogueSrm(): fdmSchema.fertilizersCatalogueTypeInsert[] {
    const catalogueSrm = srm.map((fertilizer) => {
        return {
            p_source: "srm",
            ...fertilizer,
        }
    })

    return catalogueSrm
}
