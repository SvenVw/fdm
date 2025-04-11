---
title: "Running Calculations (fdm-calculator)"
---

# Running Calculations (`fdm-calculator`)

The `@svenvw/fdm-calculator` package provides functions to perform various agronomic calculations based on data stored within the FDM structure. This allows for deriving insights and recommendations from the recorded farm data.

## Overview

The calculator package typically takes data retrieved using `fdm-core` as input or uses `fdm-core` functions internally to fetch data before performing calculations.

## Example: Calculating Total Fertilizer Dose for a Field

The `fdm-calculator` package exports a convenient function `getDoseForField` that calculates the cumulative N, P2O5, K2O, and workable N doses applied to a specific field. It handles fetching the necessary fertilizer applications and fertilizer details using `fdm-core` internally.

```typescript
import { 
    createFdmServer, 
    // Import needed types
    FdmServerType, 
    PrincipalId 
} from '@svenvw/fdm-core'; 
import { 
    getDoseForField // Import the function from fdm-calculator
} from '@svenvw/fdm-calculator'; 

// --- Assume Initialization ---
// Replace with your actual initialization logic
declare const fdm: FdmServerType; 
declare const principalId: PrincipalId; 
// --- End Initialization ---

async function calculateFieldDose(fieldId: string) {
    console.log(`Attempting to calculate total dose for field ${fieldId}...`);
    try {
        // Call the calculator function directly, providing the fdm instance,
        // the user performing the action, and the target field ID.
        const totalDose = await getDoseForField({
            fdm: fdm,
            principal_id: principalId,
            b_id: fieldId 
        }); 

        console.log(`Calculated dose for field ${fieldId}:`, totalDose);
        // Example output format (based on Dose type):
        // { p_dose_n: 120.5, p_dose_nw: 85.3, p_dose_p2o5: 60.0, p_dose_k2o: 90.0 }
        return totalDose;

    } catch (error) {
        console.error(`Error calculating dose for field ${fieldId}:`, error);
        // Handle error appropriately
    }
}

// Example Usage:
// const fieldId = 'your_field_id'; // Get this from fdm-core, e.g., via getFields
// calculateFieldDose(fieldId);

```

This example demonstrates the general workflow using the `getDoseForField` function:
1.  Initialize your `fdm-core` instance (`fdm`).
2.  Have the `principalId` of the user making the request.
3.  Call the specific calculation function from `@svenvw/fdm-calculator` (e.g., `getDoseForField`) with the required parameters.
4.  The function handles fetching the necessary underlying data via `fdm-core` and returns the calculated result.

Refer to the API Reference section or the source code for details on other available calculation functions, their specific parameters, and return types.
