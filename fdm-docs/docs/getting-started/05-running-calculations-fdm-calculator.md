---
title: "Running Calculations (fdm-calculator)"
---

# Running Calculations (`fdm-calculator`)

The `@svenvw/fdm-calculator` package provides functions to perform various agronomic calculations based on data stored within the FDM structure. This allows for deriving insights and recommendations from the recorded farm data.

## Overview

The calculator package typically takes data retrieved using `fdm-core` as input and returns calculated results. The specific calculations available depend on the functions implemented within `fdm-calculator`.

## Example: Calculating Fertilizer Dose (Conceptual)

Let's imagine `fdm-calculator` has a function to calculate a recommended fertilizer dose for a specific field and cultivation, potentially considering soil analysis data.

```typescript
import { fdm } from './your-fdm-instance-setup'; // Your initialized fdm-core instance
import { 
    calculateFertilizerDose // Hypothetical function from fdm-calculator
} from '@svenvw/fdm-calculator'; 
import { 
    fields, 
    cultivations, 
    soilAnalysis, 
    soilSampling 
    // Import other necessary tables/types from fdm-core
} from '@svenvw/fdm-core';
import { eq } from 'drizzle-orm'; // Import query operators

async function getFieldCalculationInput(fieldId: string, cultivationLu: string) {
  try {
    // Fetch relevant data for the calculation using fdm-core
    const fieldData = await fdm.query.fields.findFirst({
        where: eq(fields.b_id, fieldId),
        // Potentially with related data like latest soil sample/analysis
        with: {
            soilSamples: {
                orderBy: (samples, { desc }) => [desc(samples.b_sampling_date)],
                limit: 1,
                with: {
                    analysis: true
                }
            }
        }
    });

    const cultivationData = await fdm.query.cultivations.findFirst({
        where: eq(cultivations.b_lu, cultivationLu),
        with: {
            catalogueEntry: true // Assuming a relation 'catalogueEntry' exists
        }
    });
    
    if (!fieldData || !cultivationData) {
        throw new Error('Required field or cultivation data not found.');
    }

    // Structure the input data as required by the calculator function
    const calculationInput = {
        field: fieldData,
        cultivation: cultivationData,
        latestSoilAnalysis: fieldData.soilSamples[0]?.analysis ?? null,
        // Add any other required data points
    };

    return calculationInput;

  } catch (error) {
    console.error('Error fetching data for calculation:', error);
    throw error;
  }
}


async function runDoseCalculation(fieldId: string, cultivationLu: string) {
    try {
        const inputData = await getFieldCalculationInput(fieldId, cultivationLu);

        if (!inputData) return;

        // Call the calculator function
        // The exact function name and parameters will depend on fdm-calculator's API
        const recommendedDose = calculateFertilizerDose(inputData); 

        console.log(`Recommended dose for field ${fieldId}:`, recommendedDose);
        return recommendedDose;

    } catch (error) {
        console.error('Error running dose calculation:', error);
        // Handle error appropriately
    }
}

// Example Usage:
// const fieldId = 'your_field_id';
// const cultivationLu = 'your_cultivation_lu'; 
// runDoseCalculation(fieldId, cultivationLu);

```

*Note: This is a conceptual example. The actual function names (`calculateFertilizerDose`), input data structure, and return values will depend entirely on the implementation within the `@svenvw/fdm-calculator` package. Refer to its specific API documentation (once available in the API Reference section) or source code.*

This example demonstrates the general workflow:
1.  Use `fdm-core` to query the necessary data (field details, cultivation info, soil tests, etc.).
2.  Structure this data according to the input requirements of the desired function in `fdm-calculator`.
3.  Call the calculation function from `fdm-calculator` with the prepared data.
4.  Use the calculated results.
