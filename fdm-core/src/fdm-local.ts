import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmLocalType } from "./fdm-local.d"

export function createFdmLocal(
    backend: "memory://" = "memory://",
): FdmLocalType {
    try {
        // Create drizzle instance
        const db = drizzle({
            connection: {
                dataDir: backend,
            },
            logger: false,
            schema: schema,
        })

        // Attach the client to the drizzle instance for closing
        // @ts-ignore
        db.$client = db._.session.client

        return db
    } catch (err) {
        throw handleError(err, "Exception for createFdmLocal", { backend })
    }
}

export async function migrateFdmLocal(
    fdm: FdmLocalType,
    migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations",
): Promise<void> {
    try {
        // Run migration
        await migrate(fdm, {
            migrationsFolder: migrationsFolderPath,
            migrationsSchema: "fdm-migrations",
        })
    } catch (err) {
        throw handleError(err, "Exception for migrateFdmLocal", {
            migrationsFolderPath,
        })
    }
}
