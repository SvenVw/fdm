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

export { getFertilizersCatalogue } from "./fertilizers"
export type {
    CatalogueFertilizerName,
    ApplicationMethods,
    CatalogueFertilizer,
    CatalogueFertilizerItem,
} from "./fertilizers/d"
export { getCultivationCatalogue } from "./cultivations"
export type {
    CatalogueCultivationName,
    CatalogueCultivation,
    CatalogueCultivationItem,
} from "./cultivations/d"
export { hashFertilizer } from "./fertilizers/hash"
export { hashCultivation } from "./cultivations/hash"
