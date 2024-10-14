import postgres from 'postgres'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from './db/schema'
import { type FdmServerType } from './fdm-server.d'

export async function createFdmServer(host: string | undefined, port: number| undefined, user: string | undefined, password: string | (() => string | Promise<string>) | undefined, database: string | undefined, migrationsFolderPath: string = 'node_modules/@nmi/fdm/dist/db/migrations'): Promise<FdmServerType> {

    // Create client
    const client = postgres({
        host,
        port,
        user,
        password,
        database,
        max: 1
    })

    // Create drizzle instance
    const db = drizzle(client, { schema })

    // Run migration
    await migrate(db, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })

    return db
}
