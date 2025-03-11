import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import type postgres from "postgres"
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"

export async function runMigration(
    client: ReturnType<typeof postgres>,
    migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations",
) {
    console.log("Migration started ⌛")

    const db: PostgresJsDatabase = drizzle(client)
    try {
        await migrate(db, {
            migrationsFolder: migrationsFolderPath,
            migrationsSchema: "fdm-migrations",
        })
        console.log("Migration completed ✅")
    } catch (error) {
        console.error("Migration failed 🚨:", error)
    } finally {
        await client.end()
    }
}
