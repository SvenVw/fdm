---
title: Norms and Regulations
sidebar_label: Norms and Regulations
---

# Norms and Regulations

The `fdm-calculator` is not only a tool for agronomic calculations, but also a powerful engine for ensuring compliance with legal and regional norms. This is particularly important for nutrient management, where regulations are often in place to protect the environment.

## Implementation of Norms

Norms and regulations are implemented in the `fdm-calculator` as a series of checks and constraints that are applied to the input data. For example, when calculating fertilizer recommendations, the calculator will take into account the legal limits for nutrient application in specific regions, such as Nitrate Vulnerable Zones (NVZs).

The calculator includes a detailed implementation of the Dutch nutrient management regulations for 2025. This includes the following usage norms (`gebruiksnormen`):

*   **[Nitrogen Usage Norm (`Stikstofgebruiksnorm`)](./nl/2025/stikstofgebruiksnorm.md):** This norm sets the maximum total effective nitrogen (in kg N/ha) that can be applied to a field. The calculation takes into account the main crop, the geographical location (including `NV-gebieden`), and the soil region.
*   **[Phosphate Usage Norm (`Fosfaatgebruiksnorm`)](./nl/2025/fosfaatgebruiksnorm.md):** This norm defines the maximum amount of phosphate (in kg P₂O₅ per hectare) that can be applied to a parcel of land. The maximum is determined by the land use type (grassland or arable land) and the phosphate status of the soil.
*   **[Animal Manure Usage Norm (`Dierlijke Mest Gebruiksnorm`)](./nl/2025/dierlijke-mest-gebruiksnorm.md):** This norm defines the maximum nitrogen from animal manure (in kg N/ha) that can be applied. The calculation is based on the farm's derogation status and the field's location.

For more detailed information on these norms, please refer to the specific pages for each one.

## Customization

The `fdm-calculator` is designed to be flexible and customizable. You can define your own sets of norms and regulations to meet the specific requirements of your region or certification scheme.

This is done by providing a custom configuration file that specifies the limits and constraints for different nutrients and regions.
