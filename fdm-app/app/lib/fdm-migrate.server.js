import { runMigration, syncCatalogues } from "@svenvw/fdm-core"

// Get credentials to connect to db
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

runMigration(host, port, user, password, database, migrationsFolderPath).catch(
    (error) => console.error("Error in migration process 🚨:", error),
)
