---
title: "Contributing"
sidebar_position: 9 # Keep it towards the end
---

# Contributing to FDM

We welcome contributions to the Farm Data Model (FDM) project! Whether you're a developer, agronomist, or simply an interested user, your contributions can help improve FDM for everyone.

This guide focuses on contributions to the codebase and documentation within the FDM monorepo.

## Getting Started with Development

### Prerequisites
*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (Check `.node-version` or `package.json` engines field for recommended version)
*   [pnpm](https://pnpm.io/) (Enable corepack via `corepack enable` if needed)
*   [Docker](https://www.docker.com/) and Docker Compose (for running a local PostgreSQL database if you don't have one)

### Setup
1.  **Fork & Clone:** Fork the main [SvenVw/fdm](https://github.com/SvenVw/fdm) repository on GitHub and clone your fork locally.
    ```bash
    git clone https://github.com/SvenVw/fdm.git
    cd fdm
    ```
2.  **Install Dependencies:** Install all dependencies for the entire monorepo using pnpm from the root directory.
    ```bash
    pnpm install
    ```
3.  **Setup Environment Variables:** Each package might require its own `.env` file. Copy the `.env.example` file in the respective package directory (e.g., `fdm-core/.env.example`) to `.env` and fill in the necessary values. For `fdm-core`, you'll need database credentials. You can use the provided `docker-compose.yml` at the root to easily spin up a PostgreSQL instance:
    ```bash
    docker compose up -d # Starts postgres in the background
    ```
    Then configure `fdm-core/.env` accordingly (usually defaults match the docker-compose setup).

## Development Workflow

### Running Tasks with Turbo
This monorepo uses [Turborepo](https://turbo.build/repo) to manage tasks. Common tasks can be run from the root directory:

*   **Build all packages:** `turbo run build`
*   **Run tests for all packages:** `turbo run test`
*   **Lint all packages:** `turbo run lint` (or specific lint command if defined)
*   **Format all packages:** `turbo run format` (using Biome)
*   **Develop `fdm-app` (example):** `turbo run dev --filter=fdm-app`
*   **Develop `fdm-docs`:** `turbo run watch-docs --filter=fdm-docs`

Refer to the `turbo.json` file and individual `package.json` scripts for more details on available tasks.

### Code Style & Linting
We use [Biome](https://biomejs.dev/) for formatting and linting. Please ensure your code adheres to the configured style.

*   **Check formatting and linting:** `turbo run lint` (or `pnpm biome check .` from root)
*   **Apply formatting and safe fixes:** `turbo run format` (or `pnpm biome format --write .` and `pnpm biome check --apply .` from root)

It's recommended to set up Biome integration in your editor for automatic formatting on save.

### Testing
Each package should have its own tests (usually using Vitest).

*   **Run all tests:** `turbo run test`
*   **Run tests for a specific package:** `turbo run test --filter=fdm-core`

Please add tests for any new features or bug fixes.

### Branching Strategy
*   Create a new branch for your changes from the `main` or `development` branch.
*   Use a descriptive branch name (e.g., `feat/add-soil-texture-calc`, `fix/farm-creation-bug`, `docs/update-contributing-guide`).

### Committing Changes & Changesets
Follow conventional commit message standards (e.g., `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`).

If your changes affect any of the published packages (`fdm-core`, `fdm-data`, `fdm-calculator`, `fdm-app`, `fdm-docs`) and should trigger a version bump and changelog entry, you **must** add a changeset:

1.  Run `pnpm changeset` from the root directory.
2.  Follow the prompts to select the packages that changed, the type of change (patch, minor, major), and write a concise summary of the change. This summary will be used in the changelogs.
3.  Commit the generated Markdown file in the `.changeset` directory along with your code changes.

Changes that don't require a version bump (e.g., fixing typos in internal comments, CI/CD adjustments) do not need a changeset.

### Creating a Pull Request
1.  Push your branch to your fork on GitHub.
2.  Create a Pull Request (PR) from your branch to the `development` branch of the `SvenVw/fdm` repository.
3.  Fill in the PR template, clearly describing the changes, the motivation, and linking any relevant issues.
4.  Ensure all automated checks (linting, testing, building) pass.
5.  The maintainers will review your PR, provide feedback, and merge it once approved.

## Reporting Bugs & Requesting Features

*   **Bugs:** Please report bugs via [GitHub Issues](https://github.com/SvenVw/fdm/issues). Include a clear description, steps to reproduce, expected vs. actual behavior, and environment details.
*   **Features:** Suggest new features or ideas via [GitHub Discussions](https://github.com/SvenVw/fdm/discussions/categories/ideas).

Thank you for contributing to FDM!
