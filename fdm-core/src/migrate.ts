import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import postgres from "postgres"

export async function runMigration(
    host: string,
    port: number,
    user: string,
    password: string,
    database: string,
    migrationsFolderPath: string,
) {
    console.log("Migration started ⌛")

    const client = postgres({
        host,
        port,
        user,
        password,
        database,
        max: 1,
    })

    const db = drizzle(client)
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
