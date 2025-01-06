---
title: "Schema"
---

# Farm Data Model (FDM) Database Schema

This document provides a comprehensive overview of the Farm Data Model (FDM) database schema. It details each table, their properties, and columns, explaining their purpose and how they relate to the overall Asset-Action model.

## **`farms`**  
Defined in schema via `fdmSchema.table('farms', ...)`  
**Purpose**: Stores basic information about each farm in the system.

| Column          | Type        | Description                                                       |
|-----------------|------------|-------------------------------------------------------------------|
| **b_id_farm**   | `text`      | Primary key for the farm.                                         |
| **b_name_farm** | `text`      | Name of the farm.                                                 |
| **b_sector**    | `sectorEnum`| Enum-based sector(s), e.g., `'diary'|'arable'|'tree_nursery'|'bulbs'`. |
| **created**     | `timestamp` | Timestamp when this record was created.                   |
| **updated**     | `timestamp` | Automatic update timestamp (if set in Drizzle).                   |

### `sectorEnum`  
Name: `b_sector`  
Possible values: `diary`, `arable`, `tree_nursery`, `bulbs`

## **`farmManaging`**  
**Purpose**: Cross-reference table that links farms to fields and captures specific management details (start date, end date, management type).

| Column             | Type        | Description                                              |
|--------------------|------------|----------------------------------------------------------|
| **b_id**          | `text`      | References a field’s primary key.                        |
| **b_id_farm**     | `text`      | References a farm’s primary key (`farms.b_id_farm`).     |
| **b_manage_start**| `date`      | Date when the farm started managing the field.           |
| **b_manage_end**  | `date`      | Date when the farm stopped managing the field.           |
| **b_manage_type** | `text`      | The kind of management practiced. E.g., lease, owned, etc.|
| **created**       | `timestamp` | Timestamp when this record was created.                  |
| **updated**       | `timestamp` | Timestamp when this record was last updated.             |

---

## **`fields`**  
**Purpose**: Stores information about each field, including geometry and identifiers from external sources.

| Column          | Type            | Description                                                     |
|-----------------|----------------|-----------------------------------------------------------------|
| **b_id**        | `text`          | Primary key for the field (internal ID).                        |
| **b_name**      | `text`          | Name of the field.                                              |
| **b_id_source** | `text`          | External source identifier for this field.                      |
| **b_geometry**  | `geometry(polygon)` | Polygon geometry (e.g., for boundaries). Type coerced with `ST_Geom`. |
| **created**     | `timestamp`     | Timestamp when this record was created.                              |
| **updated**     | `timestamp`     | Timestamp when the record was last updated.                     |

Note: The actual area can be computed on-the-fly using `ST_Area` with Drizzle’s `sql<number>\`\`' usage.

---

## **`cultivationsCatalogue`**  
**Purpose**: Standardized list of cultivation entries (e.g., crop types) that can be applied to fields.

| Column              | Type    | Description                                                      |
|---------------------|--------|------------------------------------------------------------------|
| **b_lu_catalogue**  | `text`  | Primary key representing a unique ID for each cultivation type.  |
| **b_lu_source**     | `text`  | ID of the catalogue source                                |
| **b_lu_name**       | `text`  | Cultivation name in local language.                              |
| **b_lu_name_en**    | `text`  | Cultivation name in English.                                     |
| **b_lu_hcat3**      | `text`  | Hierarchical grouping code according to the [EuroCrops](https://github.com/maja601/EuroCrops) project                                |
| **b_lu_hcat3_name** | `text`  | Human-readable name of the hierarchical grouping.               |
| **created**         | `timestamp` | Timestamp when this record was created.                                             |
| **updated**         | `timestamp` | Timestamp when this record was last updated.                                               |

---

## **`cultivations`**  
**Purpose**: Associates a cultivation record to its base catalogue ID, used to track actual cultivations in the fields.

| Column               | Type    | Description                                                                         |
|----------------------|--------|-------------------------------------------------------------------------------------|
| **b_lu**            | `text`  | Primary key for the actual cultivation instance.                                    |
| **b_lu_catalogue**  | `text`  | References `cultivationsCatalogue.b_lu_catalogue`. 
| **created**         | `timestamp` | Timestamp when this record was created.                                         |
| **updated**         | `timestamp`| Timestamp when this record was last updated.                                            |

---

## 11. **`fieldSowing`**  
**Purpose**: Tracks the sowing events for a cultivation on a specific field, referencing both `fields` and `cultivations`.

| Column             | Type        | Description                                                        |
|--------------------|------------|--------------------------------------------------------------------|
| **b_id**          | `text`      | References `fields.b_id`.                                          |
| **b_lu**          | `text`      | References `cultivations.b_lu`.                                    |
| **b_sowing_date** | `date`      | The date when the cultivation was sown.                            |
| **created**       | `timestamp` | Timestamp when this record was created.                          |
| **updated**       | `timestamp` | Timestamp when this record was last updated.                         |

---

## **`fertilizersCatalogue`**  
**Purpose**: A standardized listing of possible fertilizer products. Contains many numeric fields for nutrient content, composition, etc.

| Column             | Type       | Description                                                                    |
|--------------------|-----------|--------------------------------------------------------------------------------|
| **p_id_catalogue** | `text`     | Primary key for each fertilizer product type.                                  |
| **p_source**       | `text`     | ID of catalogue source.                     |
| **p_name_nl**      | `text`     | Fertilizer name in Dutch.                                  |
| **p_name_en**      | `text`     | Fertilizer name in English.                                                   |
| **p_description**  | `text`     | Additional descriptive text.                                                   |
| **p_dm**, **p_density**, **p_om** ... and many more numeric fields | `number` | Various numeric fields for analyzing the fertilizer’s composition. |
| **p_type_manure**  | `boolean` or `text`| Flags or categories indicating the type of fertilizer (manure, mineral, compost). |
| **created**        | `timestamp`| Timestamp when this record was created.                                                           |
| **updated**        | `timestamp`| Timestamp when this record was last updated.                                                                |

*(There are dozens more columns in this catalogue for macro/micronutrients and heavy metal contents, including `p_n_rt`, `p_k_rt`, `p_ca_rt`, etc.)*

---

## **`fertilizers`**  
**Purpose**: Captures fertilizers that have been acquired or picked for usage.

| Column          | Type    | Description                                     |
|-----------------|--------|-------------------------------------------------|
| **p_id**        | `text`  | Primary key referencing each acquired fertilizer. |
| **created**     | `timestamp` | Timestamp when this record was created.                            |
| **updated**     | `timestamp` | Timestamp when this record was last updated.                            |

---

## **`fertilizerAcquiring`**  
**Purpose**: Tracks the acquisition of fertilizers for a specific farm. Cross-references `fertilizers`.

| Column              | Type        | Description                                                 |
|---------------------|------------|-------------------------------------------------------------|
| **b_id_farm**       | `text`      | References `farms.b_id_farm`.                               |
| **p_id**            | `text`      | References the fertilizer being acquired.                   |
| **p_acquiring_amount** | `number`   | Quantity of fertilizer acquired.                            |
| **p_acquiring_date**   | `date`     | Date the fertilizer was acquired.                           |
| **created**         | `timestamp` | Timestamp when this record was created.                                          |
| **updated**         | `timestamp` | Timestamp when this record was last updated.                                        |

---

## **`fertilizerPicking`**  
**Purpose**: Associates a fertilizer with its corresponding catalogue entry. Suggests that each acquired fertilizer can be assigned a “catalogue type.”

| Column             | Type        | Description                                                      |
|--------------------|------------|------------------------------------------------------------------|
| **p_id**          | `text`      | References `fertilizers.p_id`.                                   |
| **p_id_catalogue**| `text`      | References `fertilizersCatalogue.p_id_catalogue`.                |
| **p_picking_date**| `date`      | Date indicating when the fertilizer was matched/picked.          |
| **created**       | `timestamp` | Timestamp when this record was created.                                             |
| **updated**       | `timestamp` | Timestamp when this record was last updated.                                             |

---

## **`fertilizerApplication`**  
**Purpose**: Logs actual fertilizer application events on fields.

| Column             | Type        | Description                                                  |
|--------------------|------------|--------------------------------------------------------------|
| **p_app_id**       | `text`      | Primary key for the fertilizer application record.          |
| **b_id**           | `text`      | References `fields.b_id` (the field where it was applied).  |
| **p_id**           | `text`      | References `fertilizers.p_id`.                              |
| **p_app_amount**   | `number`    | Quantity of the fertilizer applied (kg / ha).               |
| **p_app_method**   | `text`      | How the fertilizer was applied (spread, injected, etc.).    |
| **p_app_date**     | `date`      | Date the fertilizer was applied.                            |
| **created**        | `timestamp` | Timestamp when this record was created.                                         |
| **updated**        | `timestamp` | Timestamp when this record was last updated.                                         |

---

## **`soilAnalysis`**  
**Purpose**: Captures the results of soil analysis for a particular sampling event.

| Column            | Type        | Description                                                         |
|-------------------|------------|---------------------------------------------------------------------|
| **a_id**          | `text`      | Primary key for the soil analysis record.                           |
| **a_date**        | `date`      | The date the soil analysis was performed.                           |
| **a_source**      | `text`      | Source or entity that provided the soil analysis data.              |
| **a_p_al**        | `number`    | Total Phosphate content extracted with Ammonium Lactate (mg P2O5/100 g)  |
| **a_p_cc**        | `number`    | Phosphor plant available content extracted with CaCl2 (mg P / kg)                           |
| **a_som_loi**     | `number`    | Soil organic matter content (Loss on Ignition) (%)         |
| **b_gwl_class**   | `gwlClassEnum`      | Groundwater classification.                                         |
| **b_soiltype_agr**| `soilTypeEnum`      | Agricultural soil type classification                   |
| **created**       | `timestamp` | Timestamp when this record was created.                                       |
| **updated**       | `timestamp` | Timestamp when this record was last updated.         

### `soiltypeEnum`  
Name: `b_soiltype_agr`  
Possible values: `moerige_klei, rivierklei, dekzand, zeeklei, dalgrond, veen, loess, duinzand', maasklei`         

### `gwlClassEnum`  
Name: `b_gwl_class`  
Possible values: `II, IV, IIIb, V, VI, VII, Vb, -, Va, III, VIII, sVI, I, IIb, sVII, IVu, bVII, sV, sVb, bVI, IIIa`     

---

## **`soilSampling`**  
**Purpose**: Records details of where and how the soil sample was taken, linking it to the field and the corresponding analysis.

| Column             | Type         | Description                                                          |
|--------------------|-------------|----------------------------------------------------------------------|
| **b_id_sampling**  | `text`       | Primary key for the soil sampling event.                             |
| **b_id**           | `text`       | References `fields.b_id`, i.e., which field was sampled.             |
| **a_id**           | `text`       | References `soilAnalysis.a_id`.                                      |
| **b_depth**        | `number`     | Depth (in cm, etc.) from which the sample was taken.                 |
| **b_sampling_date**| `date`       | The date the soil sample was collected.                              |
| **b_sampling_geometry** | (not currently used) | A polygon or point location for the sample.|
| **created**        | `timestamp`  | Timestamp when this record was created.                                       |
| **updated**        | `timestamp`  | Timestamp when this record was last updated.                                       |

---