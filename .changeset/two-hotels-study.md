---
"@svenvw/fdm-core": minor
---

Add cultivation management functionality with the following features:

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
