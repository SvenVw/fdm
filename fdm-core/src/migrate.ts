import type { PostgresJsDatabase } from "drizzle-orm/postgres-js"
import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import type postgres from "postgres"

/**
 * Runs database migrations safely.
 * 
 * This function ensures that the PostGIS extension is available and visible
 * in the search_path before executing Drizzle migrations. It is designed to be
 * non-destructive and idempotent.
 */
export async function runMigration(
    client: ReturnType<typeof postgres>,
    migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations",
) {
    console.log("Migration started ⌛")

    const db: PostgresJsDatabase = drizzle(client)
    try {
        // 1. Ensure PostGIS extension is enabled (defaults to public or current schema)
        await client`CREATE EXTENSION IF NOT EXISTS postgis;`

        // 2. Dynamically detect where PostGIS is installed
        const postgisSchemaResult = await client`
            SELECT n.nspname 
            FROM pg_extension e 
            JOIN pg_namespace n ON e.extnamespace = n.oid 
            WHERE e.extname = 'postgis';
        `
        const postgisSchema = postgisSchemaResult[0]?.nspname || 'public'

        // 3. Configure search_path for this session to ensure geometry types 
        // and PostGIS functions are visible to the migration and application.
        // We include the detected postgisSchema, public, and fdm.
        await client`SELECT set_config('search_path', ${postgisSchema} || ',public,fdm', false)`

        // 4. Run the migrations
        await migrate(db, {
            migrationsFolder: migrationsFolderPath,
            migrationsSchema: "fdm-migrations",
        })
        
        console.log("Migration completed ✅")
    } catch (error) {
        console.error("Migration failed 🚨:", error)
        throw error
    }
}