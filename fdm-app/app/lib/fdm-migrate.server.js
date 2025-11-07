/**
 * @file This is a standalone script for running database migrations and synchronizing
 * catalogue data for the Farm Data Model (FDM).
 *
 * It performs two main functions:
 * 1.  **Database Migration**: It connects to the PostgreSQL database using credentials
 *     from environment variables and runs the Drizzle ORM migrations provided by the
 *     `@svenvw/fdm-core` package. This ensures the database schema is up-to-date.
 * 2.  **Catalogue Synchronization**: After migrations, it uses the `syncCatalogues`
 *     function from `@svenvw/fdm-core` to populate or update the catalogue tables
 *     (e.g., `cultivation_catalogue`, `fertilizer_catalogue`) with the latest data.
 *
 * This script is intended to be run as part of a deployment process or manually
 * when setting up or updating the application's database.
 *
 * @packageDocumentation
 */
import {
    runMigration,
    fdmSchema as schema,
    syncCatalogues,
} from "@svenvw/fdm-core"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"

// Retrieve database credentials from environment variables.
const host =
    process.env.POSTGRES_HOST ??
    (() => {
        throw new Error("POSTGRES_HOST environment variable is required")
    })()
const port =
    Number(process.env.POSTGRES_PORT) ||
    (() => {
        throw new Error("POSTGRES_PORT environment variable is required")
    })()
const user =
    process.env.POSTGRES_USER ??
    (() => {
        throw new Error("POSTGRES_USER environment variable is required")
    })()
const password =
    process.env.POSTGRES_PASSWORD ??
    (() => {
        throw new Error("POSTGRES_PASSWORD environment variable is required")
    })()
const database =
    process.env.POSTGRES_DB ??
    (() => {
        throw new Error("POSTGRES_DB environment variable is required")
    })()
const migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations"

const client = postgres({
    host,
    port,
    user,
    password,
    database,
    max: 1,
})

// Run the schema migrations.
await runMigration(client, migrationsFolderPath).catch((error) =>
    console.error("Error in migration process 🚨:", error),
)

// Initialize Drizzle and sync catalogues.
const fdm = drizzle(client, {
    mode: "postgres",
    logger: false,
    schema: schema,
})
await syncCatalogues(fdm).catch((error) =>
    console.error("Error in syncing catalogues 🚨:", error),
)

// Close the database connection and exit.
await client.end()
process.exit(0)
