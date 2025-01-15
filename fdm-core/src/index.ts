/**
 * A library to interact with the Farm Data Model using PostgreSQL as backend
 *
 * @remarks
 * The `fdm` defines the {@link fdmLocal} and {@link fdmServer} class to store, retrieve and update the Farm Data Model
 *
 * Created by Nutriënten Management Instituut (www.nmi-agro.nl)
 * Source code available at https://github.com/SvenVw/fdm
 * In case you find a bug, please report at https://github.com/SvenVw/fdm/issues
 *
 * @public
 * @packageDocumentation
 */

/** {@inheritDoc fdmServer} */
import * as fdmSchema from './db/schema'
export { fdmSchema }
export {type FdmType } from './fdm.d'
export {type FdmServerType } from './fdm-server.d'
export { createFdmServer, migrateFdmServer } from './fdm-server'
// export { createFdmLocal, migrateFdmLocal } from './fdm-local'
export { addFarm, getFarm, getFarms, updateFarm, } from './farm'
export { addField, getField, getFields, updateField } from './field'
export { addFertilizerToCatalogue, getFertilizersFromCatalogue, addFertilizer, removeFertilizer, getFertilizer, getFertilizers, addFertilizerApplication, updateFertilizerApplication, removeFertilizerApplication, getFertilizerApplication, getFertilizerApplications} from './fertilizer'
export { addCultivationToCatalogue, getCultivationsFromCatalogue, addCultivation, updateCultivation, removeCultivation, getCultivation, getCultivations, getCultivationPlan } from './cultivation'
export { addSoilAnalysis, updateSoilAnalysis, removeSoilAnalysis, getSoilAnalysis, getSoilAnalyses } from './soil'