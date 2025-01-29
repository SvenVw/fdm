import { drizzle } from "drizzle-orm/pglite"
import { migrate } from "drizzle-orm/pglite/migrator"
import * as schema from "./db/schema"
import type { FdmLocalType } from "./fdm-local.d"

export function createFdmLocal(
    backend: "memory://" = "memory://",
): FdmLocalType {
    // Create drizzle instance
    const db = drizzle({
        connection: {
            dataDir: backend,
        },
        logger: false,
        schema: schema,
    })

    return db
}

export async function migrateFdmLocal(
    fdm: FdmLocalType,
    migrationsFolderPath = "node_modules/@svenvw/fdm-core/dist/db/migrations",
): Promise<void> {
    // Run migration
    await migrate(fdm, {
        migrationsFolder: migrationsFolderPath,
        migrationsSchema: "fdm-migrations",
    })
}
