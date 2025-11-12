---
"@svenvw/fdm-app": minor
---

Adds new parameters to the `harvestableAnalyses` table to provide a more detailed analysis of harvested crops:
-   **`b_lu_yield_fresh`**: Mass of fresh harvested products (kg/ha). This parameter measures the total fresh weight of the harvested crop per hectare, providing a baseline for yield assessment.
-   **`b_lu_yield_bruto`**: Mass of fresh harvested products, including tare (kg/ha). This represents the gross weight of the harvest before cleaning, accounting for soil and other debris.
-   **`b_lu_tarra`**: Tare percentage of the fresh harvested product mass (%). This is the percentage of non-product material (e.g., soil, stones) in the gross harvest weight.
-   **`b_lu_dm`**: Dry matter content of the harvested products (g/kg). 
-   **`b_lu_moist`**: Moisture content of the harvested products (%). 
-   **`b_lu_uww`**: Underwater weight of the fresh harvested products (g/5kg). This measurement is often used to estimate the starch content and dry matter content of potatoes and other root crops.
-   **`b_lu_cp`**: Crude protein content (g CP/kg).
