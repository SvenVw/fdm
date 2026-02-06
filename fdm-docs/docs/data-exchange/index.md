---
id: index
title: Data Exchange
sidebar_label: Overview
description: Overview of data import and export capabilities in the Farm Data Model.
---

# Data Exchange

The Farm Data Model (FDM) is designed to be an open and interoperable system. We provide several mechanisms for moving data in and out of the platform, ensuring that farm data is never locked into a single vendor or installation.

## Core Exchange Mechanisms

### 1. JSON Exchange Format
The primary method for complete farm migrations. This format captures the entire state of a farm—including its fields, historical cultivations, soil analyses, and custom catalogues—allowing it to be exported and then imported into any FDM-compatible system.

*   [**JSON Schema Reference**](./json-schema): Technical details on the JSON structure, versioning, and validation.

### 2. Standardized Catalogues
FDM uses standardized catalogues for fertilizers, crops, and soil parameters. This ensures that data exported from one system can be accurately interpreted by another.

### 3. API Integration
For real-time data access and programmatic interactions, FDM provides a robust set of core functions and service layers.

*   [**API Reference**](/api): Documentation for the TypeScript packages (`fdm-core`, `fdm-calculator`, etc.).

## Use Cases

Currently, the data exchange format is primarily used for:

*   **Farm Migration**: Moving a farm's data from one FDM-compatible application to another.
*   **Backup & Archiving**: Creating a point-in-time snapshot of a farm's complete record.

### Future Potential

While the format is designed for broad interoperability, the following are currently conceptual or in early-stage development:

*   **Third-Party Analysis**: Exporting data for use in external specialized agricultural models or research tools.
*   **Regulatory Interoperability**: Synchronizing data with government registries or supply chain partners.

## Compliance & Standards

FDM strives to align with international standards for agricultural data exchange where possible, including:
*   **GeoJSON**: For all spatial and geometric data.
*   **ISO 8601**: For all date and time representations.
*   **NanoID**: For stable, collision-resistant identifiers (16-character custom alphabet).
