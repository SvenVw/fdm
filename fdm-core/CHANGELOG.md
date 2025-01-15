# Changelog fdm-core

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
