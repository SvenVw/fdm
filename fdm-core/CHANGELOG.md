# Changelog fdm-core

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
