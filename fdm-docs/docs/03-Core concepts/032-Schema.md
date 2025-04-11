---
title: "Schema"
---

# Farm Data Model (FDM) Database Schema

This document provides a comprehensive overview of the Farm Data Model (FDM) database schema. It details each schema and table, their properties, and columns, explaining their purpose and how they relate to the overall data structure.

## Schema Overview

The FDM database is organized into three distinct PostgreSQL schemas:

1.  **`fdm`**: Contains the core tables related to farm management, fields, cultivations, fertilizers, soil data, etc.
2.  **`fdm-authn`**: Handles authentication, storing user accounts, sessions, and related information. This schema is largely managed by the [`better-auth`](https://www.better-auth.com/) library.
3.  **`fdm-authz`**: Manages authorization, defining roles, permissions, and maintaining an audit trail.

---

## `fdm` Schema (Core Farm Data)

This schema holds the primary data related to farm operations.

### Farms & Fields

#### **`farms`**
**Purpose**: Stores basic information about each farm entity in the system.

| Column              | Type                        | Constraints | Description                               |
|---------------------|-----------------------------|-------------|-------------------------------------------|
| **b_id_farm**       | `text`                      | Primary Key | Unique identifier for the farm.           |
| **b_name_farm**     | `text`                      |             | Name of the farm.                         |
| **b_businessid_farm**| `text`                     |             | Business ID associated with the farm.     |
| **b_address_farm**  | `text`                      |             | Physical address of the farm.             |
| **b_postalcode_farm**| `text`                    |             | Postal code of the farm address.          |
| **created**         | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()). |
| **updated**         | `timestamp with time zone`  |             | Timestamp when this record was last updated. |

**Indexes:**
*   Unique index on `b_id_farm`.

#### **`fields`**
**Purpose**: Stores information about each agricultural field, including its geometry and identifiers.

| Column          | Type                        | Constraints | Description                                                     |
|-----------------|-----------------------------|-------------|-----------------------------------------------------------------|
| **b_id**        | `text`                      | Primary Key | Unique identifier for the field.                                |
| **b_name**      | `text`                      | Not Null    | Name of the field.                                              |
| **b_geometry**  | `geometry` (Polygon, SRID 4326) |           | Polygon geometry representing the field boundary. See Custom Types section. |
| **b_id_source** | `text`                      |             | Optional identifier from an external data source.               |
| **created**     | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()).        |
| **updated**     | `timestamp with time zone`  |             | Timestamp when this record was last updated.                    |

**Indexes:**
*   Unique index on `b_id`.
*   GIST index on `b_geometry` for spatial queries.

#### **`fieldAcquiring`**
**Purpose**: Tracks the relationship between a farm and a field it manages, including the method and timeframe of acquisition. Replaces the old `farmManaging` concept.

| Column                | Type                        | Constraints                                  | Description                                                              |
|-----------------------|-----------------------------|----------------------------------------------|--------------------------------------------------------------------------|
| **b_id**              | `text`                      | Not Null, Foreign Key (references `fields.b_id`) | Identifier of the field being acquired.                                  |
| **b_id_farm**         | `text`                      | Not Null, Foreign Key (references `farms.b_id_farm`) | Identifier of the farm acquiring the field.                              |
| **b_start**           | `timestamp with time zone`  |                                              | Timestamp indicating the start of the farm's management/acquisition.     |
| **b_acquiring_method**| `acquiringMethodEnum`       | Not Null (default: 'unknown')                | Method by which the farm acquired the field (e.g., 'owner', 'lease'). |
| **created**           | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).                 |
| **updated**           | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                             |

**Constraints:**
*   Primary Key on (`b_id`, `b_id_farm`).

##### `acquiringMethodEnum`
*   **Name**: `b_acquiring_method`
*   **Possible values**: `owner`, `lease`, `unknown`

#### **`fieldDiscarding`**
**Purpose**: Marks when a field is no longer actively managed or used within the system.

| Column      | Type                        | Constraints                                  | Description                                      |
|-------------|-----------------------------|----------------------------------------------|--------------------------------------------------|
| **b_id**    | `text`                      | Primary Key, Foreign Key (references `fields.b_id`) | Identifier of the field being discarded.         |
| **b_end**   | `timestamp with time zone`  |                                              | Timestamp indicating when the field was discarded. |
| **created** | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()). |
| **updated** | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.     |

---

### Cultivations

#### **`cultivationsCatalogue`**
**Purpose**: A standardized catalogue of possible cultivation types (crops, cover crops, etc.).

| Column              | Type                        | Constraints | Description                                                                        |
|---------------------|-----------------------------|-------------|------------------------------------------------------------------------------------|
| **b_lu_catalogue**  | `text`                      | Primary Key | Unique identifier for the cultivation type in the catalogue.                       |
| **b_lu_source**     | `text`                      | Not Null    | Identifier for the source of this catalogue entry (e.g., 'BRP', 'EuroCrops').      |
| **b_lu_name**       | `text`                      | Not Null    | Name of the cultivation (often in the local language, e.g., Dutch).                |
| **b_lu_name_en**    | `text`                      |             | English name of the cultivation.                                                   |
| **b_lu_harvestable**| `harvestableEnum`           | Not Null    | Indicates if/how the cultivation is typically harvested ('none', 'once', 'multiple'). |
| **b_lu_hcat3**      | `text`                      |             | Hierarchical grouping code (e.g., from EuroCrops).                                 |
| **b_lu_hcat3_name** | `text`                      |             | Human-readable name of the hierarchical grouping.                                  |
| **hash**            | `text`                      |             | A hash value representing the content of the catalogue entry, for change tracking. |
| **created**         | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()).                           |
| **updated**         | `timestamp with time zone`  |             | Timestamp when this record was last updated.                                       |

**Indexes:**
*   Unique index on `b_lu_catalogue`.

##### `harvestableEnum`
*   **Name**: `b_lu_harvestable`
*   **Possible values**: `none`, `once`, `multiple`

#### **`cultivations`**
**Purpose**: Represents an instance of a cultivation being grown, linking it to its catalogue definition.

| Column             | Type                        | Constraints                                                  | Description                                                              |
|--------------------|-----------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------|
| **b_lu**           | `text`                      | Primary Key                                                  | Unique identifier for this specific cultivation instance.                |
| **b_lu_catalogue** | `text`                      | Not Null, Foreign Key (references `cultivationsCatalogue.b_lu_catalogue`) | Links to the type of cultivation in the catalogue.                       |
| **created**        | `timestamp with time zone`  | Not Null                                                     | Timestamp when this record was created (default: now()).                 |
| **updated**        | `timestamp with time zone`  |                                                              | Timestamp when this record was last updated.                             |

**Indexes:**
*   Unique index on `b_lu`.

#### **`cultivationStarting`**
**Purpose**: Records the event of starting a specific cultivation instance on a particular field. Replaces `fieldSowing`.

| Column            | Type                        | Constraints                                  | Description                                                        |
|-------------------|-----------------------------|----------------------------------------------|--------------------------------------------------------------------|
| **b_id**          | `text`                      | Not Null, Foreign Key (references `fields.b_id`) | Identifier of the field where the cultivation is started.          |
| **b_lu**          | `text`                      | Not Null, Foreign Key (references `cultivations.b_lu`) | Identifier of the cultivation instance being started.              |
| **b_lu_start**    | `timestamp with time zone`  |                                              | Timestamp indicating the start of the cultivation (e.g., sowing date). |
| **b_sowing_amount**| `numeric` (custom)         |                                              | Amount of seed/material used for sowing (units may vary).          |
| **b_sowing_method**| `text`                     |                                              | Method used for sowing/planting.                                   |
| **created**       | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).           |
| **updated**       | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                       |

**Constraints:**
*   Primary Key on (`b_id`, `b_lu`).

#### **`cultivationEnding`**
**Purpose**: Marks the end date for a specific cultivation instance.

| Column      | Type                        | Constraints                                  | Description                                                     |
|-------------|-----------------------------|----------------------------------------------|-----------------------------------------------------------------|
| **b_lu**    | `text`                      | Primary Key, Foreign Key (references `cultivations.b_lu`) | Identifier of the cultivation instance ending.                  |
| **b_lu_end**| `timestamp with time zone`  |                                              | Timestamp indicating the end of the cultivation (e.g., final harvest, termination). |
| **created** | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).        |
| **updated** | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                    |

#### **`cultivationCatalogueSelecting`**
**Purpose**: Indicates which cultivation catalogues are actively selected or used by a specific farm.

| Column        | Type                        | Constraints                                  | Description                                                     |
|---------------|-----------------------------|----------------------------------------------|-----------------------------------------------------------------|
| **b_id_farm** | `text`                      | Not Null, Foreign Key (references `farms.b_id_farm`) | Identifier of the farm selecting the catalogue source.          |
| **b_lu_source**| `text`                     | Not Null                                     | Identifier of the cultivation catalogue source being selected. |
| **created**   | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).        |
| **updated**   | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                    |

**Constraints:**
*   Primary Key on (`b_id_farm`, `b_lu_source`).

---

### Harvestables

#### **`harvestables`**
**Purpose**: Represents a potential or actual harvestable product derived from a cultivation.

| Column             | Type                        | Constraints | Description                                      |
|--------------------|-----------------------------|-------------|--------------------------------------------------|
| **b_id_harvestable**| `text`                     | Primary Key | Unique identifier for the harvestable product.   |
| **created**        | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()). |
| **updated**        | `timestamp with time zone`  |             | Timestamp when this record was last updated.     |

**Indexes:**
*   Unique index on `b_id_harvestable`.

#### **`harvestableAnalyses`**
**Purpose**: Stores the results of analyses performed on harvested products.

| Column                      | Type                        | Constraints | Description                                                                 |
|-----------------------------|-----------------------------|-------------|-----------------------------------------------------------------------------|
| **b_id_harvestable_analysis**| `text`                     | Primary Key | Unique identifier for the harvest analysis record.                          |
| **b_lu_yield**              | `numeric` (custom)         |             | Measured yield of the harvestable product (units may vary, e.g., kg/ha).    |
| **b_lu_n_harvestable**      | `numeric` (custom)         |             | Nitrogen content in the harvested portion.                                  |
| **b_lu_n_residue**          | `numeric` (custom)         |             | Nitrogen content in the crop residue.                                       |
| **b_lu_p_harvestable**      | `numeric` (custom)         |             | Phosphorus content in the harvested portion.                                |
| **b_lu_p_residue**          | `numeric` (custom)         |             | Phosphorus content in the crop residue.                                     |
| **b_lu_k_harvestable**      | `numeric` (custom)         |             | Potassium content in the harvested portion.                                 |
| **b_lu_k_residue**          | `numeric` (custom)         |             | Potassium content in the crop residue.                                      |
| **created**                 | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()).                    |
| **updated**                 | `timestamp with time zone`  |             | Timestamp when this record was last updated.                                |

**Indexes:**
*   Unique index on `b_id_harvestable_analysis`.

#### **`harvestableSampling`**
**Purpose**: Links a harvestable product instance to its analysis results, recording the sampling date.

| Column                      | Type                        | Constraints                                                  | Description                                                              |
|-----------------------------|-----------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------|
| **b_id_harvestable**        | `text`                      | Not Null, Foreign Key (references `harvestables.b_id_harvestable`) | Identifier of the harvestable product sampled.                           |
| **b_id_harvestable_analysis**| `text`                     | Not Null, Foreign Key (references `harvestableAnalyses.b_id_harvestable_analysis`) | Identifier of the analysis performed on the sample.                      |
| **b_sampling_date**         | `timestamp with time zone`  |                                                              | Timestamp when the harvestable product was sampled for analysis.         |
| **created**                 | `timestamp with time zone`  | Not Null                                                     | Timestamp when this record was created (default: now()).                 |
| **updated**                 | `timestamp with time zone`  |                                                              | Timestamp when this record was last updated.                             |

**Constraints:**
*   Primary Key on (`b_id_harvestable`, `b_id_harvestable_analysis`).

#### **`cultivationHarvesting`**
**Purpose**: Records a specific harvesting event, linking the cultivation instance to the resulting harvestable product.

| Column             | Type                        | Constraints                                                  | Description                                                              |
|--------------------|-----------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------|
| **b_id_harvesting**| `text`                     | Primary Key                                                  | Unique identifier for this harvesting event.                             |
| **b_id_harvestable**| `text`                     | Not Null, Foreign Key (references `harvestables.b_id_harvestable`) | Identifier of the harvestable product obtained from this event.          |
| **b_lu**           | `text`                      | Not Null, Foreign Key (references `cultivations.b_lu`)       | Identifier of the cultivation instance that was harvested.               |
| **b_lu_harvest_date**| `timestamp with time zone` |                                                              | Timestamp when the harvesting event occurred.                            |
| **created**        | `timestamp with time zone`  | Not Null                                                     | Timestamp when this record was created (default: now()).                 |
| **updated**        | `timestamp with time zone`  |                                                              | Timestamp when this record was last updated.                             |

---

### Fertilizers

#### **`fertilizersCatalogue`**
**Purpose**: A standardized catalogue of fertilizer products, detailing their composition and properties.

| Column             | Type                        | Constraints | Description                                                                    |
|--------------------|-----------------------------|-------------|--------------------------------------------------------------------------------|
| **p_id_catalogue** | `text`                      | Primary Key | Unique identifier for the fertilizer type in the catalogue.                    |
| **p_source**       | `text`                      | Not Null    | Identifier for the source of this catalogue entry (e.g., 'SRM', 'NMI').        |
| **p_name_nl**      | `text`                      | Not Null    | Name of the fertilizer (often in Dutch).                                       |
| **p_name_en**      | `text`                      |             | English name of the fertilizer.                                                |
| **p_description**  | `text`                      |             | Additional descriptive text about the fertilizer.                              |
| **p_dm**           | `numeric` (custom)         |             | Dry Matter content (%).                                                        |
| **p_density**      | `numeric` (custom)         |             | Density (e.g., kg/m³).                                                         |
| **p_om**           | `numeric` (custom)         |             | Organic Matter content (%).                                                    |
| ... *(many more nutrient columns like p_n_rt, p_p_rt, p_k_rt, etc.)* | `numeric` (custom) |           | Content of various macro/micro-nutrients and elements.                       |
| **p_type_manure**  | `boolean`                   |             | Flag indicating if it's a manure type fertilizer.                              |
| **p_type_mineral** | `boolean`                   |             | Flag indicating if it's a mineral type fertilizer.                             |
| **p_type_compost** | `boolean`                   |             | Flag indicating if it's a compost type fertilizer.                             |
| **hash**           | `text`                      |             | A hash value representing the content of the catalogue entry, for change tracking. |
| **created**        | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()).                       |
| **updated**        | `timestamp with time zone`  |             | Timestamp when this record was last updated.                                   |

**Indexes:**
*   Unique index on `p_id_catalogue`.

#### **`fertilizers`**
**Purpose**: Represents an instance of a fertilizer product (e.g., a specific batch or acquisition).

| Column      | Type                        | Constraints | Description                                      |
|-------------|-----------------------------|-------------|--------------------------------------------------|
| **p_id**    | `text`                      | Primary Key | Unique identifier for this fertilizer instance.  |
| **created** | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()). |
| **updated** | `timestamp with time zone`  |             | Timestamp when this record was last updated.     |

**Indexes:**
*   Unique index on `p_id`.

#### **`fertilizerAcquiring`**
**Purpose**: Tracks the acquisition of a specific fertilizer instance by a farm.

| Column               | Type                        | Constraints                                  | Description                                                 |
|----------------------|-----------------------------|----------------------------------------------|-------------------------------------------------------------|
| **b_id_farm**        | `text`                      | Not Null, Foreign Key (references `farms.b_id_farm`) | Identifier of the farm acquiring the fertilizer.            |
| **p_id**             | `text`                      | Not Null, Foreign Key (references `fertilizers.p_id`) | Identifier of the fertilizer instance being acquired.       |
| **p_acquiring_amount**| `numeric` (custom)         |                                              | Quantity of fertilizer acquired (in kg).                    |
| **p_acquiring_date** | `timestamp with time zone`  |                                              | Timestamp when the fertilizer was acquired.                 |
| **created**          | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).    |
| **updated**          | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                |

#### **`fertilizerPicking`**
**Purpose**: Links a specific fertilizer instance to its corresponding entry in the `fertilizersCatalogue`.

| Column             | Type                        | Constraints                                                  | Description                                                              |
|--------------------|-----------------------------|--------------------------------------------------------------|--------------------------------------------------------------------------|
| **p_id**           | `text`                      | Not Null, Foreign Key (references `fertilizers.p_id`)        | Identifier of the fertilizer instance.                                   |
| **p_id_catalogue** | `text`                      | Not Null, Foreign Key (references `fertilizersCatalogue.p_id_catalogue`) | Identifier of the catalogue entry matching this fertilizer instance. |
| **p_picking_date** | `timestamp with time zone`  |                                                              | Timestamp when this fertilizer instance was matched to a catalogue entry. |
| **created**        | `timestamp with time zone`  | Not Null                                                     | Timestamp when this record was created (default: now()).                 |
| **updated**        | `timestamp with time zone`  |                                                              | Timestamp when this record was last updated.                             |

#### **`fertilizerApplying`** (formerly `fertilizerApplication`)
**Purpose**: Logs the event of applying a specific fertilizer instance to a field.

| Column         | Type                        | Constraints                                  | Description                                                              |
|----------------|-----------------------------|----------------------------------------------|--------------------------------------------------------------------------|
| **p_app_id**   | `text`                      | Primary Key                                  | Unique identifier for this application event.                            |
| **b_id**       | `text`                      | Not Null, Foreign Key (references `fields.b_id`) | Identifier of the field where the fertilizer was applied.                |
| **p_id**       | `text`                      | Not Null, Foreign Key (references `fertilizers.p_id`) | Identifier of the fertilizer instance applied.                           |
| **p_app_amount**| `numeric` (custom)         |                                              | Amount of fertilizer applied (typically kg/ha).                          |
| **p_app_method**| `applicationMethodEnum`     |                                              | Method used for application (e.g., 'injection', 'spraying').           |
| **p_app_date** | `timestamp with time zone`  |                                              | Timestamp when the application occurred.                                 |
| **created**    | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).                 |
| **updated**    | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                             |

**Indexes:**
*   Unique index on `p_app_id`.

##### `applicationMethodEnum`
*   **Name**: `p_app_method`
*   **Possible values**: `slotted coulter`, `incorporation`, `injection`, `spraying`, `broadcasting`, `spoke wheel`, `pocket placement`

#### **`fertilizerCatalogueEnabling`**
**Purpose**: Indicates which fertilizer catalogue sources are actively enabled or used by a specific farm.

| Column      | Type                        | Constraints                                  | Description                                                        |
|-------------|-----------------------------|----------------------------------------------|--------------------------------------------------------------------|
| **b_id_farm**| `text`                     | Not Null, Foreign Key (references `farms.b_id_farm`) | Identifier of the farm enabling the catalogue source.              |
| **p_source** | `text`                      | Not Null                                     | Identifier of the fertilizer catalogue source being enabled.       |
| **created** | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).           |
| **updated** | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                       |

**Constraints:**
*   Primary Key on (`b_id_farm`, `p_source`).

---

### Soil

#### **`soilAnalysis`**
**Purpose**: Stores the results of a soil analysis.

| Column            | Type                        | Constraints | Description                                                         |
|-------------------|-----------------------------|-------------|---------------------------------------------------------------------|
| **a_id**          | `text`                      | Primary Key | Unique identifier for the soil analysis record.                     |
| **a_date**        | `timestamp with time zone`  |             | Timestamp indicating when the analysis was performed or reported.   |
| **a_source**      | `text`                      |             | Source or laboratory that performed the analysis.                   |
| **a_p_al**        | `numeric` (custom)         |             | P-Al value (Phosphate extracted with Ammonium Lactate).             |
| **a_p_cc**        | `numeric` (custom)         |             | P-CaCl2 value (Plant-available Phosphorus extracted with CaCl2).    |
| **a_som_loi**     | `numeric` (custom)         |             | Soil Organic Matter content determined by Loss on Ignition (%).     |
| **b_gwl_class**   | `gwlClassEnum`              |             | Groundwater level classification.                                   |
| **b_soiltype_agr**| `soiltypeEnum`              |             | Agricultural soil type classification.                              |
| **created**       | `timestamp with time zone`  | Not Null    | Timestamp when this record was created (default: now()).            |
| **updated**       | `timestamp with time zone`  |             | Timestamp when this record was last updated.                        |

##### `soiltypeEnum`
*   **Name**: `b_soiltype_agr`
*   **Possible values**: `moerige_klei`, `rivierklei`, `dekzand`, `zeeklei`, `dalgrond`, `veen`, `loess`, `duinzand`, `maasklei`

##### `gwlClassEnum`
*   **Name**: `b_gwl_class`
*   **Possible values**: `II`, `IV`, `IIIb`, `V`, `VI`, `VII`, `Vb`, `-`, `Va`, `III`, `VIII`, `sVI`, `I`, `IIb`, `sVII`, `IVu`, `bVII`, `sV`, `sVb`, `bVI`, `IIIa`

#### **`soilSampling`**
**Purpose**: Records the details of a soil sampling event, linking a field location to a soil analysis.

| Column                | Type                        | Constraints                                  | Description                                                              |
|-----------------------|-----------------------------|----------------------------------------------|--------------------------------------------------------------------------|
| **b_id_sampling**     | `text`                      | Primary Key                                  | Unique identifier for the soil sampling event.                           |
| **b_id**              | `text`                      | Not Null, Foreign Key (references `fields.b_id`) | Identifier of the field where the sample was taken.                      |
| **a_id**              | `text`                      | Not Null, Foreign Key (references `soilAnalysis.a_id`) | Identifier of the analysis performed on this sample.                   |
| **b_depth**           | `numeric` (custom)         |                                              | Depth at which the soil sample was taken (units may vary, e.g., cm).   |
| **b_sampling_date**   | `timestamp with time zone`  |                                              | Timestamp when the sample was collected.                                 |
| **b_sampling_geometry**| `geometry` (MultiPoint, SRID 4326) |      | MultiPoint geometry representing the location(s) where the sample(s) were taken. See Custom Types section. |
| **created**           | `timestamp with time zone`  | Not Null                                     | Timestamp when this record was created (default: now()).                 |
| **updated**           | `timestamp with time zone`  |                                              | Timestamp when this record was last updated.                             |

---

## `fdm-authn` Schema (Authentication)

This schema handles user authentication, sessions, accounts, and related functionalities.

**Note:** This schema is largely defined and managed by the [`better-auth`](https://www.better-auth.com/) library. While the specific table structures are documented here for completeness, refer to the `better-auth` documentation for the most detailed information on its implementation and usage.

#### **`user`**
**Purpose**: Stores user account information.

| Column          | Type        | Constraints          | Description                                      |
|-----------------|-------------|----------------------|--------------------------------------------------|
| **id**          | `text`      | Primary Key          | Unique identifier for the user.                  |
| **name**        | `text`      | Not Null             | User's display name.                             |
| **email**       | `text`      | Not Null, Unique     | User's email address.                            |
| **emailVerified**| `boolean`  | Not Null             | Flag indicating if the email address is verified. |
| **image**       | `text`      |                      | URL to the user's profile image.                 |
| **createdAt**   | `timestamp` | Not Null             | Timestamp when the user account was created.     |
| **updatedAt**   | `timestamp` | Not Null             | Timestamp when the user account was last updated. |
| **firstname**   | `text`      |                      | User's first name.                               |
| **surname**     | `text`      |                      | User's surname.                                  |
| **lang**        | `text`      | Not Null             | User's preferred language code (e.g., 'en', 'nl'). |
| **farm_active** | `text`      |                      | Identifier of the user's currently active farm.  |

#### **`session`**
**Purpose**: Stores active user sessions.

| Column      | Type        | Constraints                               | Description                                      |
|-------------|-------------|-------------------------------------------|--------------------------------------------------|
| **id**      | `text`      | Primary Key                               | Unique identifier for the session.               |
| **expiresAt**| `timestamp` | Not Null                                  | Timestamp when the session expires.              |
| **token**   | `text`      | Not Null, Unique                          | The session token.                               |
| **createdAt**| `timestamp` | Not Null                                  | Timestamp when the session was created.          |
| **updatedAt**| `timestamp` | Not Null                                  | Timestamp when the session was last updated.     |
| **ipAddress**| `text`      |                                           | IP address associated with the session.          |
| **userAgent**| `text`      |                                           | User agent string of the client.                 |
| **userId**  | `text`      | Not Null, Foreign Key (references `user.id`, onDelete: cascade) | Identifier of the user associated with the session. |

#### **`account`**
**Purpose**: Links user accounts to external authentication providers (e.g., OAuth providers) or stores credentials for password-based login.

| Column                 | Type        | Constraints                               | Description                                                                 |
|------------------------|-------------|-------------------------------------------|-----------------------------------------------------------------------------|
| **id**                 | `text`      | Primary Key                               | Unique identifier for the account link.                                     |
| **accountId**          | `text`      | Not Null                                  | The user's ID as provided by the external provider or internal system.      |
| **providerId**         | `text`      | Not Null                                  | Identifier of the authentication provider (e.g., 'google', 'credentials'). |
| **userId**             | `text`      | Not Null, Foreign Key (references `user.id`, onDelete: cascade) | Identifier of the FDM user associated with this account.                    |
| **accessToken**        | `text`      |                                           | Access token provided by the OAuth provider.                                |
| **refreshToken**       | `text`      |                                           | Refresh token provided by the OAuth provider.                               |
| **idToken**            | `text`      |                                           | ID token provided by the OAuth provider.                                    |
| **accessTokenExpiresAt**| `timestamp` |                                           | Timestamp when the access token expires.                                    |
| **refreshTokenExpiresAt**| `timestamp`|                                           | Timestamp when the refresh token expires (if applicable).                   |
| **scope**              | `text`      |                                           | Scope granted by the OAuth provider.                                        |
| **password**           | `text`      |                                           | Hashed password for credentials-based authentication.                       |
| **createdAt**          | `timestamp` | Not Null                                  | Timestamp when the account link was created.                                |
| **updatedAt**          | `timestamp` | Not Null                                  | Timestamp when the account link was last updated.                           |

#### **`verification`**
**Purpose**: Stores tokens used for verification purposes (e.g., email verification, password reset).

| Column      | Type        | Constraints | Description                                      |
|-------------|-------------|-------------|--------------------------------------------------|
| **id**      | `text`      | Primary Key | Unique identifier for the verification record.   |
| **identifier**| `text`     | Not Null    | Identifier associated with the verification (e.g., email). |
| **value**   | `text`      | Not Null    | The verification token or code.                  |
| **expiresAt**| `timestamp` | Not Null    | Timestamp when the verification token expires.   |
| **createdAt**| `timestamp` |             | Timestamp when the verification record was created. |
| **updatedAt**| `timestamp` |             | Timestamp when the verification record was last updated. |

#### **`rateLimit`**
**Purpose**: Used for tracking and enforcing rate limits on certain actions.

| Column       | Type    | Constraints | Description                                      |
|--------------|---------|-------------|--------------------------------------------------|
| **id**       | `text`  | Primary Key | Unique identifier for the rate limit record.     |
| **key**      | `text`  |             | Key identifying the resource being rate-limited. |
| **count**    | `integer`|            | Current count of requests for the key.           |
| **lastRequest**| `bigint`|            | Timestamp (as number/epoch) of the last request. |

---

## `fdm-authz` Schema (Authorization)

This schema manages roles, permissions, and auditing for authorization purposes.

#### **`role`**
**Purpose**: Defines roles assigned to principals (users) for specific resources.

| Column             | Type                        | Constraints | Description                                                                 |
|--------------------|-----------------------------|-------------|-----------------------------------------------------------------------------|
| **role_id**        | `text`                      | Primary Key | Unique identifier for the role assignment.                                  |
| **resource**       | `text`                      | Not Null    | Type of the resource (e.g., 'farm', 'field').                               |
| **resource_id**    | `text`                      | Not Null    | Identifier of the specific resource instance.                               |
| **principal_id**   | `text`                      | Not Null    | Identifier of the principal (user) being assigned the role.                 |
| **role**           | `text`                      | Not Null    | The role being assigned (e.g., 'admin', 'viewer').                          |
| **created**        | `timestamp with time zone`  | Not Null    | Timestamp when the role assignment was created (default: now()).            |
| **deleted**        | `timestamp with time zone`  |             | Timestamp when the role assignment was revoked (soft delete).               |

**Indexes:**
*   Composite index on (`resource`, `resource_id`, `principal_id`, `role`, `deleted`).

#### **`audit`**
**Purpose**: Logs authorization checks (audit trail) to record who attempted what action on which resource.

| Column                 | Type                        | Constraints | Description                                                                 |
|------------------------|-----------------------------|-------------|-----------------------------------------------------------------------------|
| **audit_id**           | `text`                      | Primary Key | Unique identifier for the audit log entry.                                  |
| **audit_timestamp**    | `timestamp with time zone`  | Not Null    | Timestamp when the audit event occurred (default: now()).                   |
| **audit_origin**       | `text`                      | Not Null    | System or component originating the audit log (e.g., 'api', 'app').         |
| **principal_id**       | `text`                      | Not Null    | Identifier of the principal (user) performing the action.                   |
| **target_resource**    | `text`                      | Not Null    | Type of the resource being acted upon.                                      |
| **target_resource_id** | `text`                      | Not Null    | Identifier of the specific resource instance being acted upon.              |
| **granting_resource**  | `text`                      | Not Null    | Type of the resource through which access was potentially granted.          |
| **granting_resource_id**| `text`                     | Not Null    | Identifier of the specific granting resource instance.                      |
| **action**             | `text`                      | Not Null    | The action being attempted (e.g., 'read', 'update', 'delete').              |
| **allowed**            | `boolean`                   | Not Null    | Whether the action was allowed based on authorization rules.                |
| **duration**           | `integer`                   | Not Null    | Duration of the authorization check in milliseconds.                        |

---

## Custom Types

These custom types are defined in `schema-custom-types.ts` to handle specific data representations.

#### **`numericCasted`**
*   **Purpose**: A workaround for Drizzle ORM potentially returning `numeric` SQL types as strings. This custom type ensures that numeric values are correctly parsed as numbers (`float`) in the application layer.
*   **SQL Type**: `numeric` or `numeric(precision, scale)`
*   **Application Type**: `number`

#### **`geometry`**
*   **Purpose**: Handles PostGIS `geometry` types, allowing storage and retrieval of GeoJSON-like data.
*   **SQL Type**: `geometry` (optionally constrained, e.g., `geometry(Polygon, 4326)`)
*   **Application Type**: GeoJSON `Geometry` object (e.g., `Polygon`, `MultiPoint`).
*   **Dependencies**: Requires the PostGIS extension enabled in the PostgreSQL database.
*   **Current Implementation**: The provided code in `schema-custom-types.ts` includes parsing logic primarily for `Polygon` and `MultiPoint` types when reading from the database (especially from hexewkb format). Writing uses `ST_GeomFromGeoJSON`. Support for other geometry types might be limited or require additional parsing logic.
*   **SRID**: Assumes SRID 4326 (WGS 84).
