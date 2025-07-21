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
import * as fdmSchema from "./db/schema"
export { fdmSchema }
// export { createFdmLocal } from './fdm-local'
export {
    createDisplayUsername,
    createFdmAuth,
    updateUserProfile,
} from "./authentication"
export type { FdmAuth } from "./authentication.d"
export type { PrincipalId } from "./authorization.d"
export {
    disableCultivationCatalogue,
    disableFertilizerCatalogue,
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
    getEnabledCultivationCatalogues,
    getEnabledFertilizerCatalogues,
    isCultivationCatalogueEnabled,
    isFertilizerCatalogueEnabled,
    syncCatalogues,
} from "./catalogues"
export {
    addCultivation,
    addCultivationToCatalogue,
    getCultivation,
    getCultivationPlan,
    getCultivations,
    getCultivationsFromCatalogue,
    removeCultivation,
    updateCultivation,
} from "./cultivation"
export type {
    Cultivation,
    CultivationCatalogue,
    CultivationPlan,
} from "./cultivation.d"
export {
    addFarm,
    getFarm,
    getFarms,
    grantRoleToFarm,
    isAllowedToShareFarm,
    listPrincipalsForFarm,
    revokePrincipalFromFarm,
    updateFarm,
    updateRoleOfPrincipalAtFarm,
} from "./farm"
export type { FdmType } from "./fdm.d"
export { createFdmServer } from "./fdm-server"
export type { FdmServerType } from "./fdm-server.d"
export {
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
    getFertilizer,
    getFertilizerApplication,
    getFertilizerApplications,
    getFertilizerParametersDescription,
    getFertilizers,
    getFertilizersFromCatalogue,
    removeFertilizer,
    removeFertilizerApplication,
    updateFertilizerApplication,
    updateFertilizerFromCatalogue,
} from "./fertilizer"
export type {
    Fertilizer,
    FertilizerApplication,
    FertilizerParameterDescription,
    FertilizerParameterDescriptionItem,
    FertilizerParameters,
} from "./fertilizer.d"
export { addField, getField, getFields, updateField, removeField, listAvailableAcquiringMethods } from "./field"
export type { Field } from "./field.d"
export {
    addHarvest,
    getHarvest,
    getHarvests,
    removeHarvest,
} from "./harvest"
export type {
    Harvest,
    Harvestable,
    HarvestableAnalysis,
} from "./harvest.d"
export { runMigration } from "./migrate"
export {
    acceptInvitation,
    cancelPendingInvitation,
    checkOrganizationSlugForAvailability,
    createOrganization,
    deleteOrganization,
    getOrganization,
    getOrganizationsForUser,
    getPendingInvitation,
    getPendingInvitationsForOrganization,
    getPendingInvitationsForUser,
    getUsersInOrganization,
    inviteUserToOrganization,
    rejectInvitation,
    removeUserFromOrganization,
    updateOrganization,
    updateRoleOfUserAtOrganization,
} from "./organization"
export { lookupPrincipal } from "./principal"
export {
    addSoilAnalysis,
    getCurrentSoilData,
    getSoilAnalyses,
    getSoilAnalysis,
    getSoilParametersDescription,
    removeSoilAnalysis,
    updateSoilAnalysis,
} from "./soil"
export type {
    CurrentSoilData,
    SoilAnalysis,
    SoilParameterDescription,
    SoilParameters,
} from "./soil.d"
export type { Timeframe } from "./timeframe.d"
export { isDerogationGrantedForYear, addDerogation, removeDerogation, listDerogations} from "./derogation"
