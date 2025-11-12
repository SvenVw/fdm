/**
 * @file This file contains the database migration logic for the FDM.
 *
 * It provides a `runMigration` function that uses Drizzle ORM to apply database migrations.
 */
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import type postgres from "postgres"

/**
 * Runs database migrations using Drizzle ORM.
 *
 * This function applies any pending database migrations to bring the database schema up to date.
 *
 * @param client The postgres client instance.
 * @param migrationsFolderPath The path to the migrations folder.
 * @returns A promise that resolves when the migrations have been successfully applied.
 */
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
    }
}
