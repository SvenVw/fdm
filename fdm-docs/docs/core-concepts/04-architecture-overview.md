---
title: "Architecture Overview"
---

# FDM Architecture Overview

The Farm Data Model (FDM) project is structured as a monorepo, containing several distinct packages that work together to provide a comprehensive solution for farm data management and analysis. Understanding the role of each package is key to effectively using and contributing to FDM.

## Monorepo Structure

The project utilizes `pnpm` workspaces and `turbo` for managing the monorepo. This setup allows for efficient dependency management and task running across multiple packages.

## Key Packages

Here's a breakdown of the main packages within the FDM monorepo:

*   **`fdm-core`**:
    *   **Purpose:** This is the heart of the FDM. It defines the core database schema (using Drizzle ORM), provides functions for interacting with the database (creating farms, fields, adding actions like cultivations and fertilizations), and handles authentication and authorization logic.
    *   **Audience:** Developers building applications on top of FDM, contributors extending the core model.

*   **`fdm-data`**:
    *   **Purpose:** Contains standardized data catalogues, primarily for cultivations and fertilizers. It provides functions to load, manage, and access these catalogues. This ensures consistency in terminology and data values across different FDM instances.
    *   **Audience:** Developers needing access to standardized lists, contributors maintaining or adding to the catalogues.

*   **`fdm-calculator`**:
    *   **Purpose:** Provides calculation logic based on FDM data. This could include nutrient balancing, yield predictions, or other agronomic calculations. It consumes data structured according to `fdm-core`.
    *   **Audience:** Developers or agronomists needing to perform specific calculations based on FDM data.

*   **`fdm-app`**:
    *   **Purpose:** A reference web application built using Remix, demonstrating how to use the FDM packages (`fdm-core`, `fdm-data`, `fdm-calculator`) to build a user-facing farm management tool. It showcases UI components and workflows for interacting with FDM data.
    *   **Audience:** Developers looking for an example implementation, potentially end-users of this specific application (though this documentation primarily targets developers/agronomists using the libraries).

*   **`fdm-docs`**:
    *   **Purpose:** Contains this documentation website, built with Docusaurus.
    *   **Audience:** Anyone looking to learn about, use, or contribute to FDM.

## Interaction Flow

Typically, an application using FDM (like `fdm-app` or a custom application) would:
1.  Use `fdm-core` to connect to the database and manage core entities (farms, fields, users).
2.  Use `fdm-core` functions to record actions (cultivation starting, fertilizer applying, etc.).
3.  Optionally use `fdm-data` to populate selection lists or validate inputs against standardized catalogues (e.g., selecting a fertilizer from the catalogue).
4.  Optionally use `fdm-calculator` to perform calculations based on the data stored via `fdm-core`.

This modular architecture allows developers to pick and choose the components they need for their specific application.
