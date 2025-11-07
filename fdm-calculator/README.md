# FDM Calculator (`@svenvw/fdm-calculator`)

The `fdm-calculator` package provides a powerful set of tools for performing domain-specific agricultural calculations based on data structured according to the Farm Data Model (FDM) schema. It is a core component of the FDM project, designed to encapsulate complex business logic for nutrient management, regulatory compliance, and agronomic advice.

## Features

-   **Nitrogen Balance Calculation:** A comprehensive model to calculate nitrogen inputs, outputs, and balance at the field and farm level, following standard agricultural science principles.
-   **Nutrient Dose Calculation:** Utility functions to calculate the total dose of various nutrients (N, P, K, and micro-nutrients) applied to a field from a series of fertilizer applications.
-   **Dutch Agricultural Norms (2025):** Implements the official Dutch regulations for 2025 regarding the usage norms (`gebruiksnormen`) for nitrogen, phosphate, and animal manure. It includes logic for geographically-defined rules (e.g., NV-gebieden, soil types) and special conditions (e.g., derogation, catch crops).
-   **Nutrient Advice Integration:** Provides a client to connect with the NMI (Nutriënten Management Instituut) API to fetch tailored nutrient application advice.
-   **Geospatial Calculations:** Built-in utilities for handling geospatial data (GeoTIFFs) to determine region-specific parameters for norm calculations.
-   **Cached for Performance:** Core calculation functions are memoized to ensure high performance by avoiding redundant computations for the same inputs.

## Getting Started

### Installation

To add the `fdm-calculator` to your project, use your preferred package manager:

```bash
npm install @svenvw/fdm-calculator
```

or

```bash
yarn add @svenvw/fdm-calculator
```

## Usage Examples

### 1. Nitrogen Balance Calculation

To calculate the nitrogen balance for a set of fields, you first need to collect the required input data.

```typescript
import {
    collectInputForNitrogenBalance,
    getNitrogenBalance,
} from "@svenvw/fdm-calculator";
import { FdmType, PrincipalId } from "@svenvw/fdm-core";

async function calculateMyFarmBalance(
    fdm: FdmType,
    principal_id: PrincipalId,
    fieldIds: string[],
) {
    // 1. Collect standardized input data for the fields.
    const nitrogenBalanceInput = await collectInputForNitrogenBalance({
        fdm,
        principal_id,
        b_ids: fieldIds,
        timeframe: {
            start: new Date("2025-01-01"),
            end: new Date("2025-12-31"),
        },
    });

    // 2. Run the calculation.
    const result = await getNitrogenBalance(nitrogenBalanceInput);

    console.log("Farm-level Nitrogen Balance (kg N/ha):", result.balance);
    console.log("Breakdown for the first field:", result.fields[0]);

    return result;
}
```

### 2. Nutrient Dose Calculation

Calculate the total amount of each nutrient applied across one or more fertilizer applications.

```typescript
import { calculateDose } from "@svenvw/fdm-calculator";
import type { Fertilizer, FertilizerApplication } from "@svenvw/fdm-core";

const applications: FertilizerApplication[] = [
    {
        p_app_id: "app1",
        p_id_catalogue: "KAS",
        p_app_amount: 150, // kg/ha
        /* ...other properties */
    },
    {
        p_app_id: "app2",
        p_id_catalogue: "DAP",
        p_app_amount: 100, // kg/ha
        /* ...other properties */
    },
];

const fertilizers: Fertilizer[] = [
    {
        p_id_catalogue: "KAS",
        p_n_rt: 270, // g N / kg
        /* ...other properties */
    },
    {
        p_id_catalogue: "DAP",
        p_n_rt: 180, // g N / kg
        p_p_rt: 460, // g P2O5 / kg
        /* ...other properties */
    },
];

const { dose, applications: individualDoses } = calculateDose({
    applications,
    fertilizers,
});

console.log("Total Nitrogen Dose:", dose.p_dose_n); // (150 * 270 / 1000) + (100 * 180 / 1000) = 58.5
console.log("Total Phosphate Dose:", dose.p_dose_p); // (100 * 460 / 1000) = 46
```

### 3. Dutch Agricultural Norms (2025)

The calculator provides factory functions to access the correct norm calculation logic for a specific region and year.

```typescript
import { createFunctionsForNorms } from "@svenvw/fdm-calculator";
import { FdmType, PrincipalId } from "@svenvw/fdm-core";

async function checkFieldNorms(
    fdm: FdmType,
    principal_id: PrincipalId,
    fieldId: string,
) {
    // 1. Get the norm calculation functions for NL-2025.
    const normFunctions = createFunctionsForNorms("NL", "2025");

    // 2. Collect the required input data for the specific field.
    const normsInput = await normFunctions.collectInputForNorms(
        fdm,
        principal_id,
        fieldId,
    );

    // 3. Calculate the different norms for the field.
    const nitrogenNorm = await normFunctions.calculateNormForNitrogen(normsInput);
    const phosphateNorm = await normFunctions.calculateNormForPhosphate(normsInput);
    const manureNorm = await normFunctions.calculateNormForManure(normsInput);

    console.log(
        `Nitrogen Norm: ${nitrogenNorm.normValue} kg/ha (${nitrogenNorm.normSource})`,
    );
    console.log(
        `Phosphate Norm: ${phosphateNorm.normValue} kg/ha (${phosphateNorm.normSource})`,
    );
    console.log(
        `Animal Manure Norm: ${manureNorm.normValue} kg N/ha (${manureNorm.normSource})`,
    );
}
```

## API Documentation

For detailed information on all exported functions, types, and interfaces, please refer to the generated TypeDoc documentation.

*(Link to be added upon setup of documentation generation pipeline)*

## Development Status

This package is currently in alpha and is under active development. While the core features are functional, the API may still be subject to change.

## Made Possible By

FDM is developed by the [Nutriënten Management Instituut](https://www.nmi-agro.nl/) as part of the Horizon Europe projects: [NutriBudget](https://www.nutribudget.eu/) and [PPS BAAT](https://www.handboekbodemenbemesting.nl/nl/handboekbodemenbemesting/pps-baat.htm).

## Contact

Maintainer: @SvenVw
Reviewer: @gerardhros
