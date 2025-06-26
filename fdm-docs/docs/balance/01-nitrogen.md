---
title: Nitrogen Balance Calculation
sidebar_label: Nitrogen
---

# Nitrogen Balance Calculation

This document explains how the nitrogen (N) balance is calculated within the FDM Calculator. The balance provides insights into nitrogen inputs, outputs, and potential surpluses or deficits on a per-field basis, which are then aggregated to the farm level. It serves as a critical tool for agronomists and farmers to optimize nutrient management, enhance crop productivity, and minimize environmental impacts.

## 1. Overview

Nitrogen is a macronutrient essential for plant growth, playing a vital role in photosynthesis, protein synthesis, and overall crop development. However, nitrogen is also highly dynamic in agricultural systems, subject to various inputs, outputs, and transformations. An accurate nitrogen balance helps in understanding the nitrogen cycle on a farm, identifying potential nutrient deficiencies or surpluses, and guiding sustainable fertilization practices.

The nitrogen balance for each field is determined by the formula:

```text
N Balance (kg N / ha) = N Supply - N Removal - N Volatilization
```

*  **N Supply:** Nitrogen added to the field.
*  **N Removal:** Nitrogen taken off the field.
*  **N Volatilization:** Nitrogen lost to the atmosphere as gases (primarily ammonia).

(Note: In the calculation, N Removal and N Volatilization are typically treated as negative values when summing components to derive the final balance.)

The calculations are performed for a user-defined **Time Frame**.

## 2. Required Input Data

Accurate N balance calculation relies on comprehensive input data that captures the various aspects of farm management and environmental conditions influencing nitrogen dynamics.

*  **Field Information:** Essential for defining the spatial and temporal boundaries of the calculation. Field area is used for scaling, and centroid coordinates are crucial for location-specific environmental data like atmospheric deposition.
    *  Unique ID, area (ha), centroid coordinates (for deposition).
    *  Start and end dates defining the field's existence (if different from the balance time frame).
*  **Cultivation Data (per field):** Crop type significantly influences nitrogen demand, uptake patterns, and potential for biological nitrogen fixation. Residue management dictates whether nitrogen in crop residues is returned to the soil or removed from the field.
    *  Crop type (via `b_lu_catalogue` linking to `CultivationCatalogue`).
    *  Crop residue management (`m_cropresidue` flag: true if residues removed, false / null if incorporated).
*  **Harvest Data (per field):** Harvested products represent the primary pathway of nitrogen removal from the field. Accurate yield and nitrogen content data are critical for quantifying this export.
    *  Links to the specific `b_lu` (cultivation instance).
    *  `harvestable_analyses` array containing:
        *  Yield of harvested product (`b_lu_yield`, kg / ha).
        *  N content of harvested product (`b_lu_n_harvestable`, g N / kg product).
        *  (If these are not in `harvestable_analyses`, defaults from `CultivationCatalogue` are used).
*  **Soil Analysis Data (per field):** Soil properties are fundamental to understanding the inherent nitrogen supply capacity of the soil (e.g., through mineralization) and its ability to retain or lose nitrogen.
    *  Multiple analyses can be provided. The system uses the most recent available data for each parameter.
    *  Key parameters used:
        *  Agricultural soil type (`b_soiltype_agr`).
        *  Total N content (`a_n_rt`, mg N / kg).
        *  Organic carbon (`a_c_of`, g C / kg).
        *  C / N ratio (`a_cn_fr`).
        *  Bulk density (`a_density_sa`, g / cm³).
        *  Soil Organic Matter (SOM) by Loss on Ignition (`a_som_loi`, %).
    *  If some parameters are missing, they may be estimated (see Section 3.1.4.1).
*  **Fertilizer Application Data (per field):** These represent direct, managed inputs of nitrogen to the field, crucial for meeting crop nutrient demands.
    *  Application amount (`p_app_amount`, kg / ha).
    *  Link to fertilizer type via `p_id_catalogue`.
*  **Catalogue Data:** Standardized data from catalogues ensures consistency and provides default values for various crop and fertilizer characteristics, which are essential for modeling when specific field-level data is unavailable.
    *  `FertilizerCatalogue` (`FertilizerDetail`):
        *  Total N content (`p_n_rt`, g N / kg).
        *  Type flags: `p_type_mineral`, `p_type_manure`, `p_type_compost` (booleans).
    *  `CultivationCatalogue` (`CultivationDetail`):
        *  Default yield (`b_lu_yield`, kg / ha).
        *  Default N content of harvestable product (`b_lu_n_harvestable`, g N / kg).
        *  N content of crop residue (`b_lu_n_residue`, g N / kg residue).
        *  Harvest Index (`b_lu_hi`, fraction).
        *  Biological N fixation rate (`b_n_fixation`, kg N / ha / year for the crop).

## 3. Calculation Components

### 3.1. Nitrogen Supply (kg N / ha)

Nitrogen supply encompasses all pathways by which nitrogen becomes available to the crop and the soil system. Understanding these inputs is crucial for optimizing nutrient management and ensuring adequate nitrogen for crop growth while minimizing environmental losses.

Total N supply is the sum of N from fertilizers, biological fixation, atmospheric deposition, and soil mineralization.

#### 3.1.1. Fertilizers

Fertilizers are a primary and often controlled source of nitrogen input in agricultural systems, applied to meet specific crop nutrient demands. Different fertilizer types have varying nitrogen forms and release characteristics.
*  **Formula per application:**
  `N_supplied (kg N / ha) = Amount_applied (kg / ha) * (Total_N_content (g N / kg)  /  1000)`
*  Contributions are summed for each category:
    *  **Mineral Fertilizers:** Mineral fertilizers providing readily available nitrogen (e.g., urea, ammonium nitrate).
    *  **Manure:** Organic fertilizers derived from animal feces, providing both readily available and slowly mineralizing nitrogen.
    *  **Compost:** Stabilized organic matter, releasing nitrogen slowly over time as it decomposes.
    *  **Other Fertilizers:** Any other types of fertilizers not classified as mineral, manure, or compost.

#### 3.1.2. Biological Fixation

Biological nitrogen fixation is a natural process where atmospheric nitrogen (N2) is converted into plant-available forms (e.g., ammonia) by microorganisms, primarily symbiotic bacteria associated with leguminous crops (e.g., clover, beans, peas). This process significantly contributes to the nitrogen supply in agricultural ecosystems, reducing the need for mineral nitrogen fertilizers.
*  **Source:** The `b_n_fixation` value (kg N / ha for the specific crop) is taken directly from the `CultivationCatalogue` for each cultivation present. This value represents the estimated net nitrogen input from fixation for that crop type.
*  These values are summed if multiple N-fixing crops are involved.

#### 3.1.3. Atmospheric Deposition

Atmospheric deposition refers to the input of nitrogen compounds from the atmosphere to the Earth's surface. This occurs through both wet deposition (e.g., nitrogen dissolved in rain, snow) and dry deposition (e.g., gaseous ammonia, nitric acid vapor, particulate matter). These deposited nitrogen forms can be utilized by plants, thus contributing to the overall nitrogen supply in the field.
*  **Method:**
  1.  The system uses the field's centroid coordinates to pinpoint its geographical location.
  2.  It queries a GeoTIFF raster file for annual total N deposition. This raster dataset provides spatially explicit annual nitrogen deposition rates.
        *  Currently uses data for the Netherlands, year 2022 (`nl/ntot_2022.tiff` from RIVM, via FDM public data URL).
  3.  The annual deposition rate (kg N / ha / year) for the field's specific location is extracted.
  4.  This annual rate is pro-rated for the balance `Time Frame` to reflect the actual period of calculation:
   `Deposition_period (kg N / ha) = Annual_Deposition (kg N / ha / year) * (Days_in_TimeFrame + 1)  /  365`

#### 3.1.4. Soil Mineralization

Soil mineralization is a crucial biological process where organic nitrogen (N) compounds in soil organic matter (SOM) are converted by microorganisms into inorganic, plant-available forms, primarily ammonium (NH4+). This process is a significant natural source of nitrogen for crops, and its rate is influenced by factors such as SOM content, C / N ratio of organic matter, soil temperature, and moisture. The Minip model is an empirical model used to estimate this complex biological process.
*  **Method (Minip Model):**
  1.  The calculation uses soil parameters:
        *  `a_c_of`: Organic carbon content (g C / kg soil).
        *  `a_cn_fr`: C / N ratio (unitless).
        *  `a_density_sa`: Soil bulk density (g / cm³).
  2.  Fixed parameters for the model:
        *  `w_temp_mean`: Average annual temperature = 10.6 °C.
        *  `bouwvoor`: Topsoil depth = 20 cm.
  3.  **Temperature Correction Factor (`temp_corr`):** This factor adjusts the mineralization rate based on the average temperature, reflecting that microbial activity (and thus mineralization) is highly temperature-dependent.
        *  If `-1 < w_temp_mean <= 9` °C:
            `temp_corr = w_temp_mean * 0.1`
        *  If `9 < w_temp_mean <= 27` °C:
            `temp_corr = 2 ^ ((w_temp_mean - 9) / 9)`
        *  If `w_temp_mean > 27` °C, an error is thrown, as the model's applicability range is exceeded.
  4.  **Decomposable Carbon Fraction (`cDec`, g C / kg soil):** This represents the portion of soil organic carbon that is readily available for microbial decomposition and subsequent nitrogen release.
   Let `Tc` be `temp_corr`.
   Let `C_org` be `a_c_of`.
        ```
        b = (Tc * 10 + 17)^(-0.6)
        c = 17^(-0.6)
        d = exp(4.7 * (b - c))
        e = 1 - d
        cDec = (C_org * e)  /  10
        ```
  5.  **Annual N Mineralization Rate (`N_min_annual`, kg N / ha / year):** This is the estimated amount of nitrogen released annually from the soil organic matter.
   Let `CN` be `a_cn_fr`.
   Let `D_bv` be `bouwvoor` (cm).
   Let `rho_b` be `a_density_sa` (g / cm³).
        ```
        f = (1.5 * cDec) / CN
        g = cDec / D_bv
        N_min_annual = (f - g) * 10000 * (D_bv / 100) * rho_b
        ```
   *(Note: The formulas are presented in a simplified text format due to rendering issues with complex mathematical notation in this documentation environment.)*
  6.  This annual rate is then capped (min: 5 kg N / ha / year, max: 250 kg N / ha / year) to ensure realistic agronomic values, preventing extreme estimations.
  7.  The capped annual rate is pro-rated for the balance `Time Frame`:
   `Mineralization_period (kg N / ha) = Capped_Annual_N_Min (kg N / ha / year) * (Days_in_TimeFrame + 1) / 365`

##### 3.1.4.1. Estimation of Missing Soil Parameters

Soil analysis data can sometimes be incomplete. To ensure the Minip model has all necessary inputs, missing parameters are estimated based on established agronomic relationships:
*  **Organic Carbon (`a_c_of`) from SOM (`a_som_loi`):** Soil organic matter (SOM) is largely composed of carbon. This conversion estimates organic carbon content from the loss on ignition (LOI) method for SOM, using a common conversion factor.
  `a_c_of (g C / kg) = a_som_loi (%) * 0.5 * 10`
  (Clamped: 0.1-600 g C / kg).
*  **SOM (`a_som_loi`) from Organic Carbon (`a_c_of`):** The inverse relationship is used to estimate SOM from organic carbon content.
  `a_som_loi (%) = (a_c_of (g C / kg)  /  10) / 0.5`
  (Clamped: 0.5-75%).
*  **C / N Ratio (`a_cn_fr`):** The carbon-to-nitrogen ratio is a key indicator of organic matter quality and decomposition rates. It's calculated from the organic carbon and total nitrogen content.
  `a_cn_fr = a_c_of (g C / kg) / (a_n_rt (mg N / kg) / 1000)`
  (Clamped: 5-40).
*  **Bulk Density (`a_density_sa`, g / cm³):** Bulk density reflects soil compaction and porosity, which influences water and air movement, and root growth. It is estimated based on organic matter content and soil texture (type), as organic matter generally lowers bulk density, and different soil textures have inherent density ranges.
    *  For sandy / loess soils (e.g., "dekzand", "dalgrond", "duinzand", "loess"):
     `a_density_sa = 1 / (a_som_loi (%) * 0.02525 + 0.6541)`
    *  For other soil types:
    Let `L` be `a_som_loi (%)`.
        ```
        a_density_sa = (0.00000067 * L^4) - (0.00007792 * L^3) + (0.00314712 * L^2) - (0.06039523 * L) + 1.33932206
        ```
        (Clamped: 0.5-3.0 g / cm³).

### 3.2. Nitrogen Removal (kg N / ha)

Nitrogen removal accounts for the nitrogen that leaves the field system, primarily through the harvest of crops and the removal of crop residues. Quantifying these outputs is essential for understanding the net nitrogen balance and assessing nutrient cycling efficiency. These are calculated as negative values in the balance equation.

#### 3.2.1. Harvested Products

The harvest of crops is typically the largest pathway for nitrogen removal from agricultural fields. Nitrogen is assimilated by plants during growth and stored in various plant parts, including the economically valuable harvested portion (e.g., grain, tubers, forage).
*  **Formula per harvest:**
  `N_removed (kg N / ha) = Yield (kg / ha) * N_Content_Harvestable (g N / kg) / 1000 * -1`
*  Yield and N content are taken from `HarvestableAnalysis` if available, otherwise from `CultivationCatalogue` defaults. Using actual analysis data provides a more precise estimate of N removal.
*  If a harvest event has multiple analyses (e.g., for different components of the harvested product), their N removal values are averaged.

#### 3.2.2. Crop Residues

Crop residues (e.g., straw, stover, roots) contain significant amounts of nitrogen. Their management is crucial for the field's nitrogen balance. If residues are removed from the field (e.g., for animal feed, bedding, or bioenergy), the nitrogen contained within them is considered a removal from the field system. If residues are left on the field and incorporated into the soil, their nitrogen contributes to the soil organic matter pool and will be subject to mineralization.
*  **Nitrogen Removal Condition:** Nitrogen is considered removed by crop residues only if the `m_cropresidue` flag is true for the cultivation, indicating that residues are indeed taken off the field.
*  **Residue Mass Estimation:**
        1.  Average yield for the cultivation is determined (from actual harvests or catalogue default).
        2.  Harvest Index (`b_lu_hi`) is from `CultivationCatalogue`. The Harvest Index is the ratio of harvested biomass to total above-ground biomass.
        3.  Residue Proportion = `1 - b_lu_hi`. This represents the fraction of total above-ground biomass that remains as residue.
        4.  `Residue_Mass (kg / ha) = Average_Yield (kg / ha) * Residue_Proportion`.   
*  **N Content of Residue:** `b_lu_n_residue` (g N / kg residue) from `CultivationCatalogue`. This value represents the typical nitrogen concentration in the crop residues for a given crop type.
*  **Formula per cultivation:**
  `N_removed_residue (kg N / ha) = Residue_Mass (kg / ha) * N_Content_Residue (g N / kg) / 1000 * -1`

### 3.3. Nitrogen Volatilization (kg N / ha)

Nitrogen volatilization refers to the loss of nitrogen to the atmosphere, primarily in the form of ammonia (NH₃) gas. This process is a significant pathway for nitrogen loss from agricultural systems, reducing the efficiency of nitrogen use and contributing to air pollution. The amount of ammonia volatilized depends on various factors, including the type of fertilizer, application method, environmental conditions, and soil properties.

The calculations for ammonia emissions are derived from the **NEMA model (Nutrient Emission Model for Agriculture)**, a Dutch model used to estimate nutrient losses from agricultural sources.

The total N volatilized is the sum of ammonia emissions from fertilizers and crop residues. Ammonia from grazing is currently not calculated.

#### 3.3.1. Ammonia from Fertilizers

Ammonia emissions from fertilizers are calculated differently depending on the fertilizer type.

*   **Manure, Compost, and Other Organic Fertilizers:**
    For these organic fertilizers, the emission is calculated based on the Total Ammoniacal Nitrogen (TAN) content, as this is the amount of nitrogen that is readily available for volatilization.

    *   **Formula:**
        `NH3 Emission (kg N / ha) = Application Amount (kg / ha) * TAN Content (g N / kg) / 1000 * Emission Factor (fraction)`
        Where:
        *   `Application Amount`: `p_app_amount` (kg / ha) - The total amount of fertilizer applied.
        *   `TAN Content`: `p_nh4_rt` (g N / kg) - The amount of total nitrogen that is in ammoniacal form.
        *   `Emission Factor`: A dimensionless factor representing the proportion of TAN that is volatilized as ammonia. This factor is determined by the application method and the type of land (grassland, cropland, or bare soil) at the time of application.

    *   **Emission Factors for Manure and Compost:**
    
        | Application Method    | Grassland | Cropland | Bare Soil |
        | :-------------------- | :-------- | :------- | :-------- |
        | Broadcasting          | 0.68      | N/A      | 0.69      |
        | Narrowband            | 0.264     | 0.36     | 0.36      |
        | Slotted Coulters      | 0.217     | N/A      | 0.30      |
        | Shallow Injection     | 0.17      | 0.24     | 0.25      |
        | Incorporation         | N/A       | N/A      | 0.22      |
        | Incorporation 2 Tracks| N/A       | N/A      | 0.46      |

        *Note: "N/A" indicates that the method is not typically used or supported for that land type in the calculation model, and will result in an error if attempted.*

*   **Mineral Fertilizers:**
    For mineral fertilizers, the emission is calculated based on the **total nitrogen content (`p_n_rt`)** of the fertilizer and the **emission factor**.

    *   **Formula:**
        `NH3 Emission (kg N / ha) = Application Amount (kg / ha) * Total N Content (g N / kg) * Emission Factor (fraction)`
        Where:
        *   `Application Amount`: `p_app_amount` (kg / ha).
        *   `Total N Content`: `p_n_rt` (fraction).
        *   `Emission Factor`: `p_ef_nh3` (fraction). This factor can be directly provided in the `FertilizerDetail`. If it is not provided, it is calculated using an empirical formula based on the fertilizer's composition:

        `Emission Factor = p_n_org^2 * K_1 + p_no3_rt * p_s_rt * K_2 + p_nh4_rt^2 * K_3`

        Where:
        *   `p_n_org`: Organic nitrogen content (calculated as `p_n_rt - p_no3_rt - p_nh4_rt`).
        *   `p_no3_rt`: Nitrate content.
        *   `p_nh4_rt`: Ammonium content (TAN).
        *   `p_s_rt`: Sulfur content.
        *   `K_1`, `K_2`, `K_3`: Empirical constants.
            *   If an inhibitor is present: `K_1 = 3.166 * 10^-5`
            *   If no inhibitor: `K_1 = 7.021 * 10^-5`
            *   `K_2 = -4.308 * 10^-5`
            *   `K_3 = 2.498 * 10^-4`
        *Note: Currently, the presence of an inhibitor (`p_inhibitor`) is hardcoded to `false` in the calculation.*



#### 3.3.2. Ammonia from Crop Residues

Ammonia emissions from crop residues occur when residues are left on the field and decompose, releasing nitrogen compounds that can volatilize. The calculation of these emissions is based on the amount of nitrogen in the crop residues and a specific emission factor.

*   **Formula per cultivation:**
    `NH3 Emission (kg N / ha) = Residue N Content (kg N / ha) * Emission Factor (fraction)`
    Where:
    *   `Residue N Content`: The amount of nitrogen contained in the crop residues left on the field. This is derived from the `Residue_Mass` (calculated in Section 3.2.2) and the `N_Content_Residue` (`b_lu_n_residue` from `CultivationCatalogue`).
    *   `Emission Factor`: This factor is calculated based on the nitrogen content of the crop residue in g/kg dry matter (`b_lu_n_residue`).

    *   **Emission Factor Formula:**
        `Emission Factor = (0.41 * b_lu_n_residue (g/kg dry matter)) - 5.42`
        Where:
        *   `b_lu_n_residue`: Nitrogen content of the crop residue in grams per kilogram of dry matter (`b_lu_n_residue` from `CultivationCatalogue`).

*Note: Ammonia emissions from crop residues are only calculated if the `m_cropresidue` flag is `false` or `null`, indicating that residues are incorporated into the soil rather than removed.*

#### 3.3.3. Ammonia from Grazing

Ammonia emissions from grazing are currently not calculated in the FDM Calculator and are set to `0`.

## 4. Field and Farm Level Balance

*  **Field Balance:** The individual N supply, removal, and volatilization components (in kg N / ha) are summed for each field to get the net N balance for that field.
*  **Farm Balance:**
    1.  The total N supplied, removed, and volatilized for each field (kg N / ha * field area (ha) = kg N per field) are summed across all fields.
    2.  These total farm-level amounts (in kg N) are then divided by the total farm area (ha) to provide an average farm-level balance in kg N / ha.

## 5. Output

The final output (`NitrogenBalanceNumeric`) provides:
*  Overall farm balance, supply, removal, and volatilization (kg N / ha).
*  A list of balances for each field (`NitrogenBalanceFieldNumeric`), which includes:
    *  Field ID.
    *  Field-specific balance (kg N / ha).
    *  Detailed breakdown of supply (total, fertilizers by type, fixation, deposition, mineralization).
    *  Detailed breakdown of removal (total, harvests, residues).
    *  Detailed breakdown of volatilization (total, ammonia from fertilizers and residues).

All values are rounded numbers.
