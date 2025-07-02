/**
 * A library to extend the Farm Data Model with catalogue data
 *
 * @remarks
 *
 * Created by Nutriënten Management Instituut (www.nmi-agro.nl)
 * Source code available at https://github.com/SvenVw/fdm
 * In case you find a bug, please report at https://github.com/SvenVw/fdm/issues
 *
 * @public
 * @packageDocumentation
 */

export { getCultivationCatalogue } from "./cultivations"
export type {
    CatalogueCultivation,
    CatalogueCultivationItem,
    CatalogueCultivationName,
} from "./cultivations/d"
export { hashCultivation } from "./cultivations/hash"
export { getFertilizersCatalogue } from "./fertilizers"
export type {
    ApplicationMethods,
    CatalogueFertilizer,
    CatalogueFertilizerItem,
    CatalogueFertilizerName,
} from "./fertilizers/d"
export { hashFertilizer } from "./fertilizers/hash"
