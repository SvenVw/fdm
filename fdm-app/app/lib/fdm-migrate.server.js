import {
    runMigration,
    fdmSchema as schema,
    syncCatalogues,
} from "@svenvw/fdm-core"
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { serverConfig } from "~/lib/config"

// Get credentials to connect to db
const host =
    serverConfig.database.host ??
    (() => {
        throw new Error("POSTGRES_HOST environment variable is required")
    })()
const port =
    serverConfig.database.port ||
    (() => {
        throw new Error("POSTGRES_PORT environment variable is required")
    })()
const user =
    serverConfig.database.user ??
    (() => {
        throw new Error("POSTGRES_USER environment variable is required")
    })()
const password =
    serverConfig.database.password ??
    (() => {
        throw new Error("POSTGRES_PASSWORD environment variable is required")
    })()
const database =
    serverConfig.database.database ??
    (() => {
        throw new Error("POSTGRES_DB environment variable is required")
    })()

const migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations"

const client = postgres({
    host: host,
    port: port,
    user: user,
    password: password,
    database: database,
    max: 1,
})

// Run the schema migrations
await runMigration(client, migrationsFolderPath).catch((error) =>
    console.error("Error in migration process 🚨:", error),
)

// Sync catalogues
const fdm = drizzle(client, {
    mode: "postgres",
    logger: false,
    schema: schema,
})
await syncCatalogues(fdm).catch((error) =>
    console.error("Error in syncing catalogues 🚨:", error),
)

// Close the connection
await client.end()
process.exit(0)
