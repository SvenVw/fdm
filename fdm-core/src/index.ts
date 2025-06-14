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
export type { FdmType } from "./fdm.d"
export type { FdmServerType } from "./fdm-server.d"
export { createFdmServer } from "./fdm-server"
// export { createFdmLocal } from './fdm-local'
export {
    createFdmAuth,
    updateUserProfile,
    createDisplayUsername,
} from "./authentication"
export type { FdmAuth } from "./authentication.d"
export type { PrincipalId } from "./authorization.d"
export {
    addFarm,
    getFarm,
    getFarms,
    updateFarm,
    grantRoleToFarm,
    isAllowedToShareFarm,
    listPrincipalsForFarm,
    revokePrincipalFromFarm,
    updateRoleOfPrincipalAtFarm,
} from "./farm"
export { addField, getField, getFields, updateField } from "./field"
export type { Field } from "./field.d"
export {
    addFertilizerToCatalogue,
    updateFertilizerFromCatalogue,
    getFertilizersFromCatalogue,
    addFertilizer,
    removeFertilizer,
    getFertilizer,
    getFertilizers,
    addFertilizerApplication,
    updateFertilizerApplication,
    removeFertilizerApplication,
    getFertilizerApplication,
    getFertilizerApplications,
} from "./fertilizer"
export type {
    Fertilizer,
    FertilizerApplication,
} from "./fertilizer.d"
export {
    addCultivationToCatalogue,
    getCultivationsFromCatalogue,
    addCultivation,
    updateCultivation,
    removeCultivation,
    getCultivation,
    getCultivations,
    getCultivationPlan,
} from "./cultivation"
export type {
    Cultivation,
    CultivationPlan,
    CultivationCatalogue,
} from "./cultivation.d"
export {
    addSoilAnalysis,
    updateSoilAnalysis,
    removeSoilAnalysis,
    getSoilAnalysis,
    getSoilAnalyses,
    getCurrentSoilData,
    getSoilParametersDescription,
} from "./soil"
export type {
    SoilAnalysis,
    CurrentSoilData,
    SoilParameters,
    SoilParameterDescription,
} from "./soil.d"
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
export {
    getEnabledFertilizerCatalogues,
    getEnabledCultivationCatalogues,
    enableFertilizerCatalogue,
    enableCultivationCatalogue,
    disableFertilizerCatalogue,
    disableCultivationCatalogue,
    isFertilizerCatalogueEnabled,
    isCultivationCatalogueEnabled,
    syncCatalogues,
} from "./catalogues"
export type { Timeframe } from "./timeframe.d"
export { runMigration } from "./migrate"
export {
    createOrganization,
    getOrganizationsForUser,
    getUsersInOrganization,
    checkOrganizationSlugForAvailability,
    inviteUserToOrganization,
    rejectInvitation,
    removeUserFromOrganization,
    updateRoleOfUserAtOrganization,
    deleteOrganization,
    getPendingInvitationsForUser,
    getPendingInvitationsForOrganization,
    getPendingInvitation,
    acceptInvitation,
    cancelPendingInvitation,
    updateOrganization,
    getOrganization,
} from "./organization"
export { lookupPrincipal } from "./principal"
