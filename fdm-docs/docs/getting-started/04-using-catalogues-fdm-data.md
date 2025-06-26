---
title: "Using Catalogues (fdm-data & fdm-core)" 
---

# Using Catalogues (`fdm-data` & `fdm-core`)

Standardized catalogues simplify data entry and ensure consistency. You can access catalogue data in two main ways:

1.  **Directly from `@svenvw/fdm-data`:** For populating general UI elements or accessing the raw catalogue definitions.
2.  **Via `@svenvw/fdm-core` functions:** For retrieving catalogue entries relevant to a specific farm context (e.g., only showing enabled catalogues).

## 1. Accessing Raw Catalogue Data (from `fdm-data`)

The `@svenvw/fdm-data` package exports arrays containing the raw catalogue entries. Import these directly for general use.

```typescript
// Example: Importing raw cultivation and fertilizer catalogues
import { 
    cultivationsCatalogueBRPCrops, 
    fertilizersCatalogueBaat 
} from '@svenvw/fdm-data';

console.log('Total BRP Crops in package:', cultivationsCatalogueBRPCrops.length);
console.log('Total BAAT Fertilizers in package:', fertilizersCatalogueBaat.length);

// Example: Finding a specific entry's ID from the raw data
const wheatEntry = cultivationsCatalogueBRPCrops.find(c => c.b_lu_name === 'Winter wheat');
const wheatCatalogueId = wheatEntry?.b_lu_catalogue; 
// Use wheatCatalogueId when calling fdm-core functions like addCultivation

const manureEntry = fertilizersCatalogueBAAT.find(f => f.p_name_nl === 'Rundveedrijfmest');
const manureCatalogueId = manureEntry?.p_id_catalogue;
// Use manureCatalogueId when calling fdm-core functions like addFertilizer
```
*Note: Check `fdm-data` exports for exact variable names.*

## 2. Retrieving Contextual Catalogue Data (via `fdm-core`)

`@svenvw/fdm-core` provides functions like `getCultivationsFromCatalogue` and `getFertilizersFromCatalogue`. These functions query the database and typically return catalogue entries that are relevant to the specific farm context, potentially considering which catalogues have been enabled for that farm (using the `cultivation_catalogue_selecting` and `fertilizer_catalogue_enabling` tables).

```typescript
import { 
    createFdmServer, 
    getCultivationsFromCatalogue, // Function from fdm-core
    FdmServerType, 
    PrincipalId 
} from '@svenvw/fdm-core'; 

// --- Assume Initialization ---
declare const fdm: FdmServerType; 
declare const principalId: PrincipalId; 
declare const farmId: string; 
// --- End Initialization ---

async function getFarmEnabledCultivations() {
    console.log(`Getting enabled/relevant cultivations for farm ${farmId}...`);
    try {
        // This function queries the DB catalogue tables, potentially filtered
        const availableCultivations = await getCultivationsFromCatalogue(fdm, principalId, farmId);

        console.log(`Found ${availableCultivations.length} cultivations relevant to the farm.`);
        // Use this list to populate UI choices specific to the farm context
        
        // Example: Find wheat within the farm-specific list
        const farmWheatEntry = availableCultivations.find(c => c.b_lu_name === 'Winter wheat');
        if (farmWheatEntry) {
             console.log('Farm-relevant Winter Wheat ID:', farmWheatEntry.b_lu_catalogue);
             // Use this ID when calling addCultivation for this farm/field
        }

        return availableCultivations;

    } catch (error) {
        console.error('Error getting cultivations from catalogue:', error);
    }
}

// getFarmEnabledCultivations();
```

## Linking Actions to Catalogues

Regardless of how you obtain the catalogue ID (directly from `fdm-data` or via `fdm-core` functions like `getCultivationsFromCatalogue`), you use this ID when recording related actions using `fdm-core` functions (e.g., `addCultivation`, `addFertilizer`). This ensures data consistency. See the "Basic Usage (`fdm-core`)" guide for examples of these action functions.
