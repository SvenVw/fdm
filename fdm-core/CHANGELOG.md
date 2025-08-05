# Changelog fdm-core

## 0.23.2

### Patch Changes

- 828ad89: Fix remove not needed line at db migration

## 0.23.1

### Patch Changes

- d331cca: Fix that the classes of `b_gwl_class` are aligned with the latest definition

## 0.23.0

### Minor Changes

- 52e0959: Add `b_area` to output `getCultivationPlan`
- 0f8e4eb: Refactor b_acquiring_method options to align with RVO codes
- b502367: Add function updateHarvest to update values of an harvest event
- b40cffa: Add derogation and functions to manage derogation `addDerogation`, `removeDerogation`, `listDerogations` and `isDerogationGrantedForYear`
- 51722cc: Add `listAvailableAcquiringMethods` to retrieve all acquiring-method options.
- 2ac1471: Add function `removeField` to delete a field and all cascading data (e.g. cultivations, soil analysis, etc.) as well

### Patch Changes

- db5e7fe: Update dependencies
- cbf5340: Fix exception when removing a cultivation with an harvest
- Updated dependencies [db5e7fe]
- Updated dependencies [6821ee9]
  - @svenvw/fdm-data@0.15.0

## 0.22.1

### Patch Changes

- Updated dependencies [ffd1b3e]
  - @svenvw/fdm-data@0.14.1

## 0.22.0

### Minor Changes

- ce5ffa8: Add parameter `p_ef_nh3` to the fertilizersCatalogue to represent the ammonia emission factor of a fertilizer.
- 780e8c4: Add syncing of `baat` catalogue for fertilizers
- a58b367: Add the new function `getSoilParameterDescription` to obtain details about fertilizer parameters
- afe2a32: Add `b_lu_croprotation` to the output of `getCultivation` and `getCultivations`.
- e6c0fa3: Add parameters `p_no3_rt` and `p_nh4_rt` to `fertilizerCatalogue`
- 75693e4: Add the parameter `p_app_method_options` to `fertilizer_catalogue` to represent the possible methods that can be used to apply the fertilizer

### Patch Changes

- b6721b4: Fix typo for `p_cr_rt` at input of addFertilizerToCatalogue
- ac05d8b: Fixes a bug in `syncCatalogue` where, when an item already exists but its hash has changed, the other properties were not updated
- Updated dependencies [093784b]
- Updated dependencies [e37b6f0]
- Updated dependencies [7f95233]
- Updated dependencies [a898e30]
  - @svenvw/fdm-data@0.14.0

## 0.21.1

### Patch Changes

- 8cb4399: Fix typo in parameter name `p_cl_rt` in the type Fertilizer
- Updated dependencies [5eb6ef2]
  - @svenvw/fdm-data@0.13.1

## 0.21.0

### Minor Changes

- 004c58d: Add option to sign in with magic-link
- 7b447f6: Make the function `createDisplayUserName` available
- 842aac4: Add the function `updateUserProfile` to update the profile parameters of the user

### Patch Changes

- 7b447f6: Make the type `FdmAuth` available

## 0.20.0

### Minor Changes

- e260795: Add `a_c_of` to soil analysis. It represents the amount of organic carbon (g C / kg) that is reported on the soil analysis
- 0dc93fd: Change `a_source` to a list of options
- 5a3bf78: Add `b_n_fixation` as property of cultivation catalogue. It represents the amount of nitrogen that can be fixated by the cultivation as kg N / ha
- 249138c: Add `a_nmin_cc` as parameter for soil analysis
- f05e1cb: Add `b_lu_n_residue` as property of cultivation catalogue. It represents the nitrogen content (g N / kg) of the crop residues for the cultivation that can be used as a default.
- 9a5be3b: Add parameter `m_cropresidue` to cultivationEnding to indicate whether crop residues are left behind or not when cultivation is ended
- 6292cf3: Add function lookup for users and organizations
- f05e1cb: Add `b_lu_hi` as property of cultivation catalogue. It represents the fraction of the crop biomass that is commercially valueable
- 286abb9: The response of `getFarm` and `getFarms` include now the roles on the farm that the principal has
- bdf0cb0: This change introduces a suite of helper functions within `fdm-core` to facilitate comprehensive organization management and user interaction as `better-auth` does not provide server functions to interact with organizations. These functions enable users and administrators to manage organizations, invite members, and control access.
  - `createOrganization`: Creates a new organization.
  - `updateOrganization`: Updates an existing organization.
  - `getOrganization`: Retrieves information about a specific organization.
  - `checkOrganizationSlugForAvailability`: Checks if a given organization slug is available for use.
  - `getOrganizationsForUser`: Retrieves a list of organizations a user belongs to.
  - `deleteOrganization`: Deletes an organization.
  - `getUsersInOrganization`: Retrieves a list of users within a specific organization.
  - `removeUserFromOrganization`: Removes a user from an organization.
  - `updateRoleOfUserAtOrganization`: Updates the role of a user within an organization.
  - `inviteUserToOrganization`: Sends an invitation to a user to join an organization.
  - `getPendingInvitationsForUser`: Retrieves a list of pending invitations for a user.
  - `getPendingInvitation`: Retrieves a specific pending invitation.
  - `acceptInvitation`: Accepts a pending invitation to join an organization.
  - `rejectInvitation`: Rejects a pending invitation to join an organization.
  - `getPendingInvitationsForOrganization`: Retrieves a list of pending invitations for an organization.
  - `cancelPendingInvitation`: Cancels a pending invitation to join an organization.

- 343c580: At soil sampling rename `a_depth` to `a_depth_lower` and add `a_depth_upper`
- e260795: Add `a_density_sa` to soil analysis. It represents the soil bulk density (g/cm^3) that is reported on a soil analysis
- 18f195b: Add `b_centroid` to output of `getField` and `getFields`. It repesents the [longitude, latitude] of the center of the field
- 7e881c1: Add new soil parameters: `a_al_ox`, `a_ca_co`, `a_ca_co_po`, `a_caco3_if`, `a_cec_co`, `a_cn_fr`, `a_com_fr`, `a_cu_cc`, `a_fe_ox`, `a_k_cc`, `a_k_co`, `a_k_co_po`, `a_mg_cc`, `a_mg_co`, `a_mg_co_po`, `a_n_pmn`,`a_p_ox`, `a_p_rt`, `a_p_sg`, `a_p_wa`, `a_ph_cc`, `a_s_rt`, `a_sand_mi`, `a_silt_mi`, `a_zn_cc`
- c44812f: Adds `a_cn_fr` as property of soil analysis. It represents the carbon to nitrogen (-) ratio reported on a soil analysis
- ec0494c: Add `b_lu_n_harvestable` as property of cultivation catalogue. It represents the nitrogen content (g N / kg) of the harvestable parts of the crop for a cultivation and can be used as default
- ec0494c: Add `b_lu_yield` as property of cultivation catalogue. It represents an average dry matter yield (kg / ha) for the cultivation that can be used as default
- 6676992: Adds functions to manage user and organization access to farms.

  **New Functions:**
  - `grantRoleToFarm`: Grants a role to a principal (user/org) on a farm.
  - `isAllowedToShareFarm`: Checks if a principal can share a farm.
  - `listPrincipalsForFarm`: Lists principals with access to a farm.
  - `revokePrincipalFromFarm`: Removes access for a principal.
  - `updateRoleOfPrincipalAtFarm`: Updates a principal's role.

  **Purpose:** Enables granular control over farm data access between users and organizations.

- 4027c9a: Add `a_nh4_cc` and `a_no3_cc` to soil analysis

### Patch Changes

- c44812f: Add `a_n_rt` as property of soil analysis. It represents the total nitrogen content (mg N / kg) as reported on a soil analysis
- cf399ca: Make types `Harvestable`, `Harvest` and `HarvestableAnalysis` available
- ef8a2c6: Add `b_lu_croprotation` as property to cultivation catalogue. It represents the type in the crop rotation
- 13210e6: Limit that each harvest can have only 1 harvestable and not multiple
- a550805: Rename types `getFertilizerType` and `GetFertilizerApplicationsType` to `Fertilizer` and `FertilizerApplication`
- d4a7e02: Make types `Cultivation`, `CultivationPlan`, `CultivationCatalogue` available
- e0a779c: Round `b_area`at `getField` and `getFields` to 2 decimals
- dd7bb7b: Make type `SoilAnalysis` available
- 0a546d4: Make type `Field` available
- Updated dependencies [af2c6a2]
  - @svenvw/fdm-data@0.13.0

## 0.19.0

### Minor Changes

- eed1780: Provide the auth settings as input argument instead of environmental variables

## 0.18.0

### Minor Changes

- c240486: Adapt function `addFertilizerToCatalogue` to add custom fertilizers for a farm
- 82f4767: Add function `getSoilParameterDescription` to obtain a description of the soil parameters
- a52796a: Add function `updateFertilizerFromCatalogue` to alter properties of custom fertilizer
- 9ea6795: Change at `getSoilAnalysis` argument `b_id` to `a_id` to retrieve details of specific soil analysis
- a259ff6: Add to the output of `getFertilizer` and `getFertilizers` the values for `p_type_*` and `p_source`
- 0944ef1: Add `timeframe` argument to `getCultivations`, `getCultivationPlan`, `getFertilizerApplications`, `getFields`, `getHarvests` and `getSoilAnalyses`
- 9f4d818: Add `getCurrentSoilData` to retrieve for every soil parameter the most recent value

### Patch Changes

- e9926cb: Rename `p_cl_cr` to `p_cl_rt` as the previous name was a typo
- 01081b3: Rename db migration files to version tags
- d693cdb: Fix that soil data without sampling date is not excluded
- 175ea6a: Minify the code during rollup with terser
- Updated dependencies [e9926cb]
- Updated dependencies [7e66231]
- Updated dependencies [1218ab7]
- Updated dependencies [175ea6a]
  - @svenvw/fdm-data@0.12.0

## 0.17.0

### Minor Changes

- 9bfd0a8: Improved parsing of names of Microsoft accounts at registration

## 0.16.0

### Minor Changes

- e134cfc: Remove `migrateFdmServer` as it is replaced by `runMigration`

## 0.15.0

### Minor Changes

- b601b5f: Add tables `fertilizer_catalogue_enabling` and `cultivation_catalogue_selecting` to store which catalogues at farm level are enabled
- f056396: Add `syncCatalogues` to enabling syncing of catalogue data in fdm instance and `fdm-data`
- cdb1d02: Add the functions `getEnabledFertilizerCatalogues`, `getEnabledCultivationCatalogues`, `enableFertilizerCatalogue`, `enableCultivationCatalogue`, `disableCultivationCatalogue`, `disableFertilizerCatalogue`, `isFertilizerCatalogueEnabled` and `isCultivationCatalogueEnabled`
- 9a6e329: The function `getFertilizersFromCatalogue` and `getCultivationFromCatalogue` now require `principal_id` and `b_id_farm` as argument

### Patch Changes

- 9b1f522: Fix documentation about `addFertilizer`, so that it describes acquiring a fertilizer not applying
- Updated dependencies [7499eae]
- Updated dependencies [c93c076]
- Updated dependencies [5a93b69]
- Updated dependencies [ae3447f]
  - @svenvw/fdm-data@0.11.0

## 0.14.0

### Minor Changes

- 4d1dbd9: Rename table `cultivation_terminating` to `cultivation_ending`
- 4d1dbd9: Rename `b_terminating_date` to `b_lu_end`
- 0224544: Rename table `field_sowing` to `cultivation_starting`
- 0b28bd5: Rename `b_harvesting_date` to `b_lu_harvest_date`
- 1a295b0: Rename `b_discarding_date` to `b_end`
- 972bac8: Rename `b_sowing_date` to `b_lu_start`
- 7387530: Rename `b_acquiring_date` to `b_start`

### Patch Changes

- 6a01698: Fix value for option `-` at `b_gwl_class`

## 0.13.0

### Minor Changes

- 9830186: Add `createFdmAuth` to create a better-auth instance for fdm

### Patch Changes

- 06619e7: Rename schema `fdm-dev` to `fdm`

## 0.12.0

### Minor Changes

- 5d2871e: Add `b_lu_harvestable` to the table `cultivations_catalogue`
- 644a159: Switch format of `b_geometry` from WKT to GeoJSON
- e518d78: Export the interfaces `getFertilizerType` and `getFertilizerApplicationType`
- 9e05058: Add properties of harvestable analysis: b*lu*[n/p/l]\_[harveable/residue]
- d2a2ab7: Renamed column `b_harvest_date` to `b_harvesting_date`
- 488f898: For `addCultivation` and `updateCultivation` automatically add harvest if `b_terminating_date` is set and `b_lu_harvestable_type` is `once`
- aede4a7: Add `harvests` to output of `getCultivationPlan`
- 9e6f2d7: Add the functions `addHarvest`, `getHarvest`, `getHarvests`, `removeHarvest`

### Patch Changes

- 1b435a3: Drop `drizzle-graphql` as dependency while it is not used
- ed82ff6: Fix that typescript declarations are included in the build
- d2a2ab7: Add `b_harvesting_id` to table `cultivation_harvesting`
- 644a159: Remove `wkx` as a dependency

## 0.11.3

### Patch Changes

- bc52f62: Rename `b_terminate_date` to `b_terminating_date` to be consistent with other parameter names
- 9b53632: Add function to standardize error handling across functions

## 0.11.2

### Patch Changes

- 444bff1: Use global setup for fdm-core unit tests to prevent concurrent migration errors
- 444bff1: Add Github Action for unit test and coverage

## 0.11.1

### Patch Changes

- 0d80fcb: Fix updateCultivation bug due to missing {

## 0.11.0

### Minor Changes

- 341b0a3: Changed type of `b_manage_start` and `b_manage_end` to `timestamptz`
- 0d97679: Add to output of `getFertilizerApplication` and `getFertilizerApplications` the parameters `p_id_catalogue` and `p_name_nl`
- f7d7a50: Rename `b_manage_start` to `b_acquiring_date` and `b_manage_end` to `b_discarding_date`
- 899b99c: Add tables `cultivation_harvesting`, `cultivation_terminating`, `harvestable_analyses`, `harvestable_sampling` and `harvestables`
- f7d7a50: Renamed table `farm_managing` into `field_acquiring`
- c584d5a: Switch from Vite to Rollup to fix building errors (and Rollup is better suited for server-only modules)
- f7d7a50: Add table `field_discarding`
- 073b92e: Add the value `unknown` to `b_manage_type` and set to default

## 0.10.2

### Patch Changes

- Replace ESLint with Biome and format the code accordingly

## 0.10.1

### Patch Changes

- Use the same version for `vite`, `typescript` and `dotenvx` across packages and update those to the latest version

## 0.10.0

### Minor Changes

- 520a074: Adds the `getFarms` function
- 2171b68: Add `b_address`, `b_businessid_farm` and `b_postalcode_farm` as columns to `farms`
- 2171b68: Remove `b_sector` as column of `farms`

## 0.9.1

### Patch Changes

- Replace id's with 16 characters and only safe and not lookalike characters

## 0.9.0

### Minor Changes

- 441decd: Change `b_sowing_date` from date column with string input to timestamp with Date input
- 5d0e1f7: Add `updateCultivation` to update details of a cultivation
- 315710b: Add functions for soil analysis: `AddSoilAnalysis`, `updateSoilAnalysis`, `removeSoilAnalysis`, `getSoilAnalysis` and `getSoilAnalyses`

### Patch Changes

- 71cbba3: Refactored depecrated index function

## 0.8.0

### Minor Changes

- 6a3e6db: Remove `iam` functions from package as `fdm-app` handles authentication

### Patch Changes

- 83c589b: Upgrade `drizzle-orm` to v0.38.2 and `drizzle-kit` to v0.30.1

## 0.7.0

### Minor Changes

- 7af3fda: Rename `p_amount` at `fertilizer_acquiring` to `p_acquiring_amount`
- bc4e75f: Rename `p_date_acquiring` to `p_acquiring_date` anc convert type from timestamp to date
- efa423d: Export `getFertilizer` and `getFertilizers`
- b0c001e: Add functions `addFertilizerApplication`, `updateFertilizerApplication`, `removeFertilizerApplication`, `getFertilizerApplication` and `getFertilizerApplications`
- 6ef3d44: Alter `p_acquiring_date` and `p_picking_date` from date to timestamptz
- 61da12f: Add to output of `getCultivationPlan` the `fertilizer_applications`
- 5be0abc: `getFertilizers` returns the details of the fertilizers similiar as `getFertilizer`
- 4189f5d: Add `fertilizer_application` table

### Patch Changes

- a948c61: Fix by adding `b_name` to output type of `getCultivationPlan`
- Upgrade to use ES2022

## 0.6.1

### Patch Changes

- Patch for CVE-2024-55565

## 0.6.0

### Minor Changes

- c316d5c: Add `b_area` with the area of the field in hectares to the output of `getField` and `getFields`
- b1dea77: Export type `FdmServerType`
- 49aa60c: Add cultivation management functionality with the following features:
  - Catalogue Management:
    - `addCultivationToCatalogue`: Adds new cultivation entries to the catalogue
    - `getCultivationsFromCatalogue`: Retrieves available cultivations
    - `extendCultivationsCatalogue`: Extends catalogue with BRP data (partially implemented)

  - Field Operations:
    - `addCultivation`: Associates a cultivation with a field
    - `removeCultivation`: Removes a cultivation association
    - `getCultivation`: Retrieves specific cultivation details
    - `getCultivations`: Lists cultivations for a field
    - `getCultivationPlan`: Retrieves farm-level cultivation planning

  Known limitations:
  - BRP catalogue integration needs additional work (see index.test.ts)
  - Edge case handling for duplicate entries and invalid data pending
  - Test coverage to be expanded for error scenarios

### Patch Changes

- 35c55e1: Add example configuration file as `.env.example`
- 6694029: Upgrade `pnpm` to 9.14.2

## 0.5.0

### Minor Changes

- 5fa0cdc: Add `getFields` function to get details of fields based on `b_id_farm`
- f9050b0: Setting arguments for `updateFields` to undefined won't update the values anymore
- Add `b_geometry` for fields
- 7aff5c6: Add `signUpUser` and `getUserFromSession` to create a user and retrieve user information from session

## 0.4.0

### Minor Changes

- For `addFertilizersToCatalogue` include all parameters in `properties`
- a2ee857: Add to `fertilizers_catalogue` the columns:`p_density`, `p_type_manure`, `p_type_mineral` and `p_type_compost`

## 0.3.1

### Patch Changes

- 6f6b1c4: Fix building by updating `vite-plugin-dts`
- 1750661: Add GitHub Action to publish dev version of fdm-core to GitHub Packages

## 0.3.0

### Minor Changes

- 73bdd1c: Set license to MIT
- 3160e82: Add exporting type `FdmType`

### Patch Changes

- 6fb7d11: Replace `dotenv` with `dotenvx`

## v0.2.0

### Added

- Adds functions related to fertilizers available on a farm:
  - `getFertilizersFromCatalogue()`
  - `addFertilizerToCatalogue()`
  - `addFertilizer()`
  - `removeFertilizer()`
  - `getFertilizers()`
  - `getFertilizer()`

## v.0.1.0

A first prototype that includes 3 tables: `farms`, `fields` and `farm_managing` to check and test the approach of this package
