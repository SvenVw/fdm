---
title: "Using Catalogues (fdm-data)"
---

# Using Catalogues (`fdm-data`)

The `@svenvw/fdm-data` package provides standardized catalogues for common agricultural items like cultivations and fertilizers. Using these catalogues helps ensure data consistency and simplifies data entry by providing pre-defined, validated options.

## Accessing Catalogue Data

The `fdm-data` package typically exports arrays or objects containing the catalogue entries. You can import these directly into your application.

```typescript
// Example: Importing cultivation and fertilizer catalogues
import { 
    cultivationsCatalogueBRPCrops, // Example: BRP crop catalogue
    cultivationsCatalogueBRPCoverCrops, // Example: BRP cover crop catalogue
    fertilizersCatalogueSRM // Example: SRM fertilizer catalogue
} from '@svenvw/fdm-data';

// You can now use these arrays, for example, to populate dropdown lists in a UI
// or to validate user input against known catalogue IDs.

console.log('Available BRP Crops:', cultivationsCatalogueBRPCrops.length);
console.log('Available SRM Fertilizers:', fertilizersCatalogueSRM.length);

// Example: Finding a specific catalogue entry
const wheatEntry = cultivationsCatalogueBRPCrops.find(
    crop => crop.b_lu_name === 'Winter wheat' // Adjust property name if needed
);

if (wheatEntry) {
    console.log('Found Winter Wheat:', wheatEntry.b_lu_catalogue);
    // Use wheatEntry.b_lu_catalogue when creating a cultivation instance via fdm-core
}

const manureEntry = fertilizersCatalogueSRM.find(
    fert => fert.p_name_nl === 'Rundveedrijfmest' // Adjust property name if needed
);

if (manureEntry) {
    console.log('Found Cattle Slurry:', manureEntry.p_id_catalogue);
    // Use manureEntry.p_id_catalogue when recording fertilizer actions via fdm-core
}

```
*Note: The exact names of the exported catalogue variables (`cultivationsCatalogueBRPCrops`, `fertilizersCatalogueSRM`, etc.) might differ. Check the `fdm-data` package's exports or API reference for the correct names.*

## Linking Actions to Catalogues

When recording actions in `fdm-core` that relate to catalogued items (like starting a cultivation or applying fertilizer), you should use the appropriate ID from the `fdm-data` catalogue.

See the `Cultivation Starting` example in the "Basic Usage (`fdm-core`)" section, where `catalogueId` (which would come from `fdm-data`) is used to link the `cultivations` record via the `b_lu_catalogue` foreign key. Similarly, when recording fertilizer applications, the `p_id_catalogue` from `fdm-data` would be used to link the `fertilizerPicking` record.

Using these shared catalogue IDs ensures that data remains standardized and comparable, even if different applications or users are entering the information.
