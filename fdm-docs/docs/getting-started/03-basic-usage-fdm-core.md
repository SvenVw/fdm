---
title: "Basic Usage (fdm-core)"
---

# Basic Usage (`fdm-core`)

After setting up your database connection as described in the previous step, you can start interacting with the FDM using the initialized `fdm` object from `@svenvw/fdm-core`. This section provides basic examples of common operations.

## Creating a Farm

The foundation of FDM data is the farm. You can create a new farm record using functions provided by `fdm-core`.

```typescript
import { fdm } from './your-fdm-instance-setup'; // Assuming fdm is exported from your setup file
import { createId } from '@paralleldrive/cuid2'; // For generating unique IDs

async function createNewFarm() {
  try {
    const newFarmData = {
      b_id_farm: createId(), // Generate a unique ID for the farm
      b_name_farm: 'My Example Farm',
      b_businessid_farm: 'BUSINESS123',
      b_address_farm: '123 Farm Lane',
      b_postalcode_farm: '12345',
      // created and updated timestamps are handled automatically by the database/ORM
    };

    // Assuming fdm-core exports a function like 'insertFarm' or similar
    // Replace 'insertFarm' with the actual function name if different
    // const createdFarm = await fdm.insert(farms).values(newFarmData).returning(); 
    
    // --- OR --- if fdm-core provides specific helper functions:
    // const createdFarm = await fdm.createFarm(newFarmData); 

    // Note: The exact method depends on how fdm-core exposes insertion operations.
    // The following is a placeholder based on typical Drizzle usage.
    // You'll need to adapt this based on the actual fdm-core API.
    
    const { farms } = await import('@svenvw/fdm-core'); // Import schema table if needed directly
    const createdFarm = await fdm.insert(farms).values(newFarmData).returning();


    console.log('Farm created successfully:', createdFarm);
    return createdFarm[0]; // Assuming returning() returns an array

  } catch (error) {
    console.error('Error creating farm:', error);
    throw error;
  }
}

// Example usage:
// createNewFarm().then(farm => console.log(farm)); 
```
*Note: The exact API call (`fdm.insert(farms)...` or `fdm.createFarm(...)`) depends on the specific functions exported by `@svenvw/fdm-core`. Refer to the API Reference section or the source code for precise usage.*

## Adding a Field to a Farm

Once you have a farm, you can add fields associated with it.

```typescript
import { fdm } from './your-fdm-instance-setup';
import { createId } from '@paralleldrive/cuid2';
import { fields, fieldAcquiring } from '@svenvw/fdm-core'; // Import necessary tables/types

async function addFieldToFarm(farmId: string) {
  try {
    const newFieldData = {
      b_id: createId(), // Unique ID for the field
      b_name: 'North Field',
      // b_geometry: ..., // Requires PostGIS setup and GeoJSON data
      b_id_source: 'ExternalSystemID-456', 
    };

    const newAcquiringData = {
        b_id: newFieldData.b_id,
        b_id_farm: farmId,
        b_acquiring_method: 'owner', // Or 'lease', 'unknown'
        b_start: new Date(), // When the farm acquired/started managing the field
    };

    // Use a transaction to ensure both inserts succeed or fail together
    const result = await fdm.transaction(async (tx) => {
        const createdField = await tx.insert(fields).values(newFieldData).returning();
        const createdAcquiring = await tx.insert(fieldAcquiring).values(newAcquiringData).returning();
        return { field: createdField[0], acquiring: createdAcquiring[0] };
    });


    console.log('Field added and linked to farm:', result);
    return result;

  } catch (error) {
    console.error('Error adding field:', error);
    throw error;
  }
}

// Example usage (assuming you have a farmId from createNewFarm):
// const farm = await createNewFarm();
// if (farm) {
//   addFieldToFarm(farm.b_id_farm).then(result => console.log(result));
// }
```
*Note: Handling geometry data (`b_geometry`) requires a PostGIS-enabled database and appropriate GeoJSON input.*

## Recording Actions (Example: Cultivation Starting)

Actions link activities to assets. Here's how you might record the start of a cultivation on a field:

```typescript
import { fdm } from './your-fdm-instance-setup';
import { createId } from '@paralleldrive/cuid2';
import { cultivations, cultivationStarting, cultivationsCatalogue } from '@svenvw/fdm-core'; 

async function startCultivation(fieldId: string, catalogueId: string) {
  try {
    // 1. Create the Cultivation instance (linking to the catalogue)
    const newCultivation = {
        b_lu: createId(), // Unique ID for this specific cultivation instance
        b_lu_catalogue: catalogueId, // Link to the catalogue entry (e.g., 'WHEAT_SPRING')
    };

    // 2. Create the Cultivation Starting action (linking field and cultivation)
    const newStartingAction = {
        b_id: fieldId, // Link to the field asset
        b_lu: newCultivation.b_lu, // Link to the cultivation instance
        b_lu_start: new Date(), // Sowing date/time
        // b_sowing_amount: 150, // Optional: amount in kg/ha or other unit
        // b_sowing_method: 'Drilled', // Optional: method
    };

    // Use a transaction
    const result = await fdm.transaction(async (tx) => {
        const createdCultivation = await tx.insert(cultivations).values(newCultivation).returning();
        const createdStarting = await tx.insert(cultivationStarting).values(newStartingAction).returning();
        return { cultivation: createdCultivation[0], starting: createdStarting[0] };
    });

    console.log('Cultivation started:', result);
    return result;

  } catch (error) {
    console.error('Error starting cultivation:', error);
    throw error;
  }
}

// Example usage (assuming fieldId and a valid catalogueId exist):
// const catalogueId = 'some_catalogue_id_for_wheat'; // Get this from fdm-data or your setup
// startCultivation('field_id_from_add_field', catalogueId).then(result => console.log(result));

```

These examples illustrate the basic pattern of using `fdm-core` with Drizzle ORM to interact with your FDM database. Remember to consult the specific API documentation for detailed function signatures and options. The next sections will cover using catalogues (`fdm-data`) and calculations (`fdm-calculator`).
