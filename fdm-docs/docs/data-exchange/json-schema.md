---
id: json-schema
title: JSON Exchange Format
sidebar_label: JSON Exchange Format
description: Technical documentation for the Farm Data Model (FDM) JSON schema used for data import and export.
---

# JSON Exchange Format

The Farm Data Model (FDM) provides a standardized, versioned JSON format designed for the complete migration of farm datasets between systems. This format is the primary mechanism for exporting a farm's entire history and state into a single, portable file.

:::info Not an API Reference
This document describes the **data structure** of the FDM JSON files. For documentation on the TypeScript functions and classes used to interact with this data, please see the [API Reference](/api).
:::

## Design Philosophy

The FDM JSON schema follows a **Relational-Flat** approach. While the data is stored in a relational database (PostgreSQL), the JSON format flattens these relationships into collections to simplify serialization and validation while preserving relational integrity through stable identifiers.

### Key Principles

1.  **Atomicity**: An import is an "all-or-nothing" operation executed within a single database transaction.
2.  **Stable Identifiers**: The JSON uses NanoIDs (16-character custom alphanumeric strings) from the source system to link entities (e.g., linking a `cultivation` to a `field`).
3.  **Schema-First Validation**: Every file is validated against a machine-readable JSON Schema (Draft 2019-09) before any processing begins.
4.  **Versioned Transformations**: The system supports backward compatibility by transforming older schema versions (e.g., v21) into the current version (e.g., v22) in-memory.

---

## File Structure

A valid FDM exchange file is a JSON object containing a `meta` header, a single `farm` object, and multiple arrays for related data entities.

### 1. Metadata (`meta`)

The metadata block defines the schema version and provenance of the data. This is critical for the import engine to determine which transformation pipeline to use.

```json
{
  "meta": {
    "version": "22",
    "exportedAt": "2026-02-06T12:00:00Z",
    "source": "FDM Core v0.29.0"
  }
}
```

### 2. The Farm Entity (`farm`)

The root object representing the farm. This contains high-level administrative data.

| Property | Type | Description |
| :--- | :--- | :--- |
| `b_id_farm` | `string (NanoID)` | Unique identifier (16 chars) for the farm in the source system. |
| `b_name_farm` | `string` | The display name of the farm. |
| `b_businessid_farm` | `string` | Official business registration ID (e.g., KVK/RVO number). |

### 3. Data Collections

Related entities are grouped into arrays at the root level of the JSON object. All of the following collections are mandatory in an exchange file (though they can be empty arrays `[]`).

*   **`fields`**: The spatial boundaries (Polygon) and names of farm fields.
*   **`field_acquiring`**: Records of when and how a farm started managing a specific field.
*   **`field_discarding`**: Records of when a field was removed from farm management.
*   **`fertilizers_catalogue`**: Definitions of fertilizer products (composition, nutrients).
*   **`fertilizer_acquiring`**: Records of fertilizer batches being brought onto the farm.
*   **`fertilizer_picking`**: Links between farm fertilizer instances and the master catalogue.
*   **`fertilizer_applying`**: Logs of fertilizer applications to specific fields.
*   **`fertilizer_catalogue_enabling`**: Which fertilizer catalogue sources are active for the farm.
*   **`cultivations_catalogue`**: Standardized definitions of crops and cover crops.
*   **`cultivations`**: Specific instances of crops being grown.
*   **`cultivation_starting`**: Sowing/planting records (links a crop to a field and date).
*   **`cultivation_ending`**: Termination records for crops.
*   **`cultivation_harvesting`**: Links between a crop instance and a harvest event.
*   **`cultivation_catalogue_selecting`**: Which crop catalogue sources are active for the farm.
*   **`harvestables`**: Metadata for products obtained from harvest.
*   **`harvestable_sampling`**: Links between harvestable products and lab analysis.
*   **`harvestable_analyses`**: The actual laboratory results for harvested products.
*   **`soil_analysis`**: Laboratory results for soil samples (pH, nutrients, etc.).
*   **`soil_sampling`**: Records of where and when soil samples were taken.
*   **`derogations`**: Definitions of special regulatory permissions by year.
*   **`derogation_applying`**: Records of the farm making use of specific derogations.
*   **`organic_certifications`**: Definitions of organic status certificates.
*   **`organic_certifications_holding`**: Records of the farm holding specific certificates.
*   **`intending_grazing`**: Annual declarations of grazing intent.

#### Example: Fields Collection
Defines the spatial boundaries and metadata for agricultural parcels.

```json
"fields": [
  {
    "b_id": "8d3e9b2acdfghjkm",
    "b_name": "East Polder",
    "b_geometry": {
      "type": "Polygon",
      "coordinates": [[[4.5, 52.1], ...]]
    },
    "b_bufferstrip": false
  }
]
```

#### Other Collections
A typical export includes many other collections, such as:
*   `soil_analyses`: Historical and current soil test results.
*   `cultivations`: Records of crops grown on fields.
*   `fertilizer_applications`: Logs of nutrient applications.
*   `catalogues_private`: Custom fertilizers or crops defined by the user.

---

## Relationships & ID Mapping

One of the most important aspects of the FDM JSON format is how it handles relationships. Because FDM generates fresh identifiers for every import to avoid collisions, an internal translation process is required.

### Internal Mapping (Transient)
The mapping process is **strictly internal and transient**. It exists only in-memory during the import transaction and is never returned to the user or stored permanently.

#### The ID Mapping Process
When you import an FDM JSON file:
1.  **Read**: The system reads the original NanoIDs (e.g., `b_id_farm`) from the JSON.
2.  **Map**: As each entity is created in the target database, it receives a **new** NanoID.
3.  **Link**: The system maintains an internal, temporary map of `Old_NanoID -> New_NanoID`.
4.  **Resolve**: When importing dependent data (like a field belonging to a farm), the system uses the map to replace the old reference with the new one.
5.  **Discard**: Once the import transaction is committed, the mapping is discarded.

This "translation" ensures that the exported file is completely self-contained and allows you to import the same farm multiple times (as distinct "clones") without ID collisions.

---

## Technical Specification

### Schema Location
The official JSON Schemas are located in the `fdm-core` package:
`fdm-core/schemas/v{VERSION}.json`

### Validation Rules
*   **No Extra Properties**: The schema sets `additionalProperties: false` on all objects to prevent data drift and ensure strict adherence to the model.
*   **Geospatial Data**: Geometries must follow the GeoJSON specification (standard WGS84 / EPSG:4326).
*   **Date-Times**: All timestamps must be in ISO 8601 format (e.g., `2026-02-06T14:30:00Z`).

---

## Example Snippet

Below is a truncated example of a valid FDM Exchange file:

```json
{
  "meta": {
    "version": "22",
    "exportedAt": "2026-02-06T10:00:00Z",
    "source": "FDM-App v1.2.0"
  },
  "farm": {
    "b_id_farm": "D7Wbcdfghjkmnpqr",
    "b_name_farm": "Demo Farm",
    "b_businessid_farm": "NL87654321"
  },
  "fields": [
    {
      "b_id": "kmnpqrtwza6789BC",
      "b_name": "Field A1",
      "b_geometry": {
        "type": "Polygon",
        "coordinates": [[[5.12, 52.01], [5.13, 52.01], [5.13, 52.02], [5.12, 52.02], [5.12, 52.01]]]
      },
      "b_bufferstrip": true
    }
  ],
  "soil_analyses": []
}
```
