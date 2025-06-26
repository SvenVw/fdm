---
title: "Catalogues & FDM Data"
sidebar_position: 3 # Position after Schema
---

# FDM Data Package (`fdm-data`)

The `@svenvw/fdm-data` package serves as a central repository for standardized agricultural data catalogues used within the Farm Data Model ecosystem. Its primary purpose is to provide consistent, pre-defined lists for common entities like cultivations and fertilizers.

## Purpose of Catalogues

Using standardized catalogues offers several benefits:

*   **Consistency:** Ensures that the same cultivation (e.g., "Winter Wheat") or fertilizer (e.g., "Urea (46%)") is referred to using the same identifier (`b_lu_catalogue` or `p_id_catalogue`) across different datasets and applications.
*   **Data Quality:** Reduces errors from manual data entry by providing validated options.
*   **Simplified Integration:** Makes it easier to integrate data from different sources that adhere to the same catalogue references.
*   **Analysis:** Facilitates comparative analysis across farms or regions based on standardized inputs.

## Structure and Usage

Catalogues within `fdm-data` are typically structured as TypeScript files exporting arrays or objects containing the catalogue entries. Each entry usually includes:

*   A unique identifier (e.g., `b_lu_catalogue`, `p_id_catalogue`).
*   Human-readable names (often in multiple languages, e.g., `p_name_nl`, `p_name_en`).
*   Relevant attributes specific to the catalogue type (e.g., nutrient content for fertilizers, harvestability for cultivations).
*   A source identifier (e.g., `b_lu_source`, `p_source`) indicating the origin of the catalogue data (e.g., 'BRP', 'baat', 'NMI').
*   A hash for tracking changes to the entry.

**Using Existing Catalogues:**

Applications can directly import the exported catalogues from `@svenvw/fdm-data` to:

1.  Populate UI elements like dropdown menus.
2.  Validate user input.
3.  Retrieve the correct catalogue ID (`b_lu_catalogue` or `p_id_catalogue`) needed when calling `fdm-core` functions like `addCultivation` or `addFertilizer`.

Refer to the **Using Catalogues (`fdm-data`)** guide in the "Getting Started" section for code examples.

## Contributing New Catalogue Data Sources

The `fdm-data` package is designed to be extensible. If you have a standardized data source for cultivations or fertilizers (e.g., an official regional list, an updated BRP or BAAT version) that isn't already included, you can contribute it. This involves adding a new data source for the *existing* catalogue types (cultivations or fertilizers).

**Process:**

1.  **Identify Catalogue Type:** Determine if you are adding data for `cultivations` or `fertilizers`.
2.  **Prepare Data:** Structure your data according to the existing TypeScript types defined within `fdm-data` (e.g., `CatalogueCultivationItem`, `CatalogueFertilizerItem`). Ensure you include all required properties (like unique IDs, names, source identifier) and maintain consistent data types.
3.  **Create Source File:** Add a new TypeScript file for your data source within the correct subdirectory:
    *   For fertilizers: `fdm-data/src/fertilizers/catalogues/your-source-name.ts`
    *   For cultivations: `fdm-data/src/cultivations/catalogues/your-source-name.ts`
4.  **Export Data:** In your new file, export the catalogue data as a constant array conforming to the appropriate type (e.g., `export const fertilizersCatalogueYourSource: CatalogueFertilizerItem[] = [...]`). Assign a clear `p_source` or `b_lu_source` identifier value within your data entries.
5.  **Update Type Index:** Add an export statement for your new catalogue constant in the relevant type index file (`fdm-data/src/fertilizers/index.ts` or `fdm-data/src/cultivations/index.ts`) so it becomes part of the package's public API.
6.  **Hashing (Recommended):** Implement hashing for your entries (see `fdm-data/src/hash.ts` and how existing catalogues use it) to generate the `hash` property. This helps track changes. Update the main index (`fdm-data/src/index.ts`) to include your hashed data export if applicable.
7.  **Documentation:** Briefly document your new source within the `fdm-data` package's README or relevant documentation files.
8.  **Pull Request:** Submit a pull request to the FDM repository with your changes, following the guidelines in the **Contributing** guide.

*Note: Currently, adding entirely new *types* of catalogues (e.g., for pesticides or machinery) would require modifications to `fdm-core`'s schema and functions, in addition to creating the data in `fdm-data`.*

## Syncing Catalogues with `fdm-core`

While applications can use `fdm-data` by directly importing the catalogues, `fdm-core` also provides a `syncCatalogues` function. This function can be used to populate the `fertilizers_catalogue` and `cultivations_catalogue` tables within an FDM database instance directly from the data provided by `fdm-data`. This might be useful for scenarios where database-level referential integrity or querying against the catalogue tables is desired. Refer to the `fdm-core` API reference for details on `syncCatalogues`.
