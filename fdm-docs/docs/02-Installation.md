---
sidebar_position: 2
title: Installation
---

Welcome to the Farm Data Model (FDM)! FDM provides a standardized schema and tools for managing and analyzing agricultural data. This guide will walk you through the initial setup and introduce you to the core components of the FDM ecosystem.

**Pre-Alpha Software Warning**: FDM is currently in a pre-alpha stage of development. This means the software is still under active development and may have significant changes to its functionality, API, and schema between releases. **Until version 1.0.0, database schema migrations are not provided, and schema updates between versions might break existing databases**. Please use caution and be prepared for potential breaking changes. We encourage you to experiment and provide feedback, but be aware that FDM is not yet ready for production use.

## FDM Packages
FDM consists of several packages, each serving a distinct purpose:

* ``fdm-core``: This is the heart of FDM. It provides the core data schema and the functions to interact with it. It is a TypeScript library that can be integrated into your applications. ``fdm-core`` directly interacts with your database, enabling creation, retrieval, updating, and deletion of farm-related data.

* ``fdm-data``: This package is an extension to ``fdm-core` and offers catalogues with data records. These catalogues can contain sets of fertilizers or cultivations for which an user can choose from. In this way you can choose yourself which list of fertilizers or cultivations you want to use or create your own catalogue easily.

* ``fdm-calculator``: This package will enable domain-specific calculations based on the data stored in the database. Development of this package will start soon.

* ``fdm-app``: This package is a React application that offers a user interface for visualizing and managing farm data based on the FDM schema. It uses fdm-core under the hood to interact with the database.

* ``fdm-docs``: This package houses the documentation for the FDM project, including this getting started guide

## Database Setup
``fdm-core`` currently supports [Drizzle ORM](https://orm.drizzle.team/) and requires a [PostgreSQL-compatible](https://www.postgresql.org/) database. You will need to set up your database and configure the connection details for fdm-core to work correctly. Refer to the specific documentation for ``fdm-core`` to set environment variables of the database URL and configure authentication.

### Usage
After setting up the database, you can integrate ``fdm-core`` into your application to manage your farm data programmatically using its provided functions. You can also explore the ``fdm-app`` for a visual interface to interact with the FDM schema. More detailed instructions and examples for using each package can be found in their respective documentation.

## Installation

The FDM packages are currently not published yet, but you can intall and build from source. Follow these steps to get started:

1. **Clone the Repository:**
```
git clone https://github.com/SvenVw/fdm.git
```
2. **Navigate to the FDM Directory:**
```
cd fdm
```
3. **Install Dependencies:**
```
pnpm install
```

## Contributing
We welcome contributions to the FDM project! Please refer to the contribution guidelines within each package for more details on how to get involved.

### Support and Feedback
For any questions, issues, or feedback, please open an issue on the [FDM GitHub repository](https://github.com/SvenVw/fdm). We appreciate your input as we continue to develop and improve FDM.

## Roadmap
FDM is constantly evolving. Refer to the project's [roadmap](https://github.com/SvenVw/fdm/milestones) for details on upcoming features and planned development.

This getting started guide provides the basic steps to start exploring the FDM. We encourage you to delve deeper into each package's documentation for more detailed instructions and examples. We are excited to see what you build with FDM!