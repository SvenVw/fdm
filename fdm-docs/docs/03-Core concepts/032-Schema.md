---
title: "Schema"
---

# Farm Data Model (FDM) Database Schema

This document provides a comprehensive overview of the Farm Data Model (FDM) database schema. It details each table, their properties, and columns, explaining their purpose and how they relate to the overall Asset-Action model.

### Farms

The `farms` table stores information about individual farms.

| Column        | Data Type    | Description                                           |
|---------------|-------------|-------------------------------------------------------|
| `b_id_farm`   | TEXT         | Unique identifier for the farm.       |
| `b_name_farm` | TEXT         | Name of the farm.                     |
| `b_sector`    | ENUM         | Sector of the farm. Can be one of the values: `diary`, `arable`, `tree_nursery` and `bulbs`                  |
| `created`     | TIMESTAMPTZ  | Timestamp of record created.          |
| `updated`     | TIMESTAMPTZ  | Timestamp of last update of record.   

TODO: Add description of the other tables