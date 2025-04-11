---
sidebar_position: 2 # Or adjust as needed based on final structure
title: Installation
---

# Installation

This guide covers how to install the Farm Data Model (FDM) packages for use in your own projects, and how to set up the monorepo for contributing to FDM development.

**Pre-Alpha Software Warning**: FDM is currently in a pre-alpha stage of development. This means the software is still under active development and may have significant changes to its functionality, API, and schema between releases. **Until version 1.0.0, database schema migrations are not provided, and schema updates between versions might break existing databases**. Please use caution and be prepared for potential breaking changes. We encourage you to experiment and provide feedback, but be aware that FDM is not yet ready for production use.

## Using FDM Packages

To use the FDM libraries (like `@svenvw/fdm-core`, `@svenvw/fdm-data`, etc.) in your project:

### Prerequisites
*   [Node.js](https://nodejs.org/) (Check `package.json` engines field in the specific package for recommended version)
*   A package manager like [pnpm](https://pnpm.io/), npm, or yarn.
*   For `@svenvw/fdm-core`: A running [PostgreSQL-compatible](https://www.postgresql.org/) database.

### Installation
Install the desired packages using your package manager. For example, using pnpm:

```bash
# Install the core library
pnpm add @svenvw/fdm-core

# Install the data catalogues library
pnpm add @svenvw/fdm-data

# Install the calculator library
pnpm add @svenvw/fdm-calculator 
```
*(Note: Replace `@svenvw/...` with the actual published package names if they differ).*

### Setup
*   **Database:** Ensure your PostgreSQL database is running.
*   **Environment Variables:** Configure the necessary environment variables, especially the database connection string for `@svenvw/fdm-core`. Refer to the "Setup Connection" guide in the "Getting Started" section for details.

## Contributing to FDM

If you want to contribute to the development of FDM itself:

### Prerequisites
*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (Check `.node-version` or root `package.json` engines field)
*   [pnpm](https://pnpm.io/) (Corepack recommended: `corepack enable`)
*   [Docker](https://www.docker.com/) & Docker Compose (Optional, for easy local database setup)

### Setup
1.  **Fork & Clone:** Fork the main [SvenVw/fdm](https://github.com/SvenVw/fdm) repository and clone your fork.
    ```bash
    git clone https://github.com/YOUR_USERNAME/fdm.git
    cd fdm
    ```
2.  **Install Dependencies:** Use pnpm from the monorepo root.
    ```bash
    pnpm install
    ```
3.  **Environment & Database:** Set up required `.env` files (copy from `.env.example` in package directories) and ensure a PostgreSQL database is running and configured (e.g., using `docker compose up -d` from the root).

For detailed development workflows (building, testing, linting, changesets), please refer to the **Contributing** guide.
