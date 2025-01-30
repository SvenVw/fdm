import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import * as schema from "./db/schema"
import type { FdmServerType } from "./fdm-server.d"
import { handleError } from "./error"

export function createFdmServer(
    host: string | undefined,
    port: number | undefined,
    user: string | undefined,
    password: string | (() => string | Promise<string>) | undefined,
    database: string | undefined,
): FdmServerType {
    try {
        // Create drizzle instance
        const db = drizzle({
            connection: {
                user: user,
                password: password,
                host: host,
                port: port,
                database: database,
            },
            logger: false,
            schema: schema,
        })

        return db
    } catch (err) {
        throw handleError(err, "Exception for createFdmServer")
    }
}

export async function migrateFdmServer(
    fdm: FdmServerType,
    migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations",
): Promise<void> {
    try {
        // Run migration
        await migrate(fdm, {
            migrationsFolder: migrationsFolderPath,
            migrationsSchema: "fdm-migrations",
        })
    } catch (err) {
        throw handleError(err, "Exception for migrateFdmServer", {
            migrationsFolderPath,
        })
    }
}
