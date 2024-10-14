import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './db/schema'
import { type FdmLocalType } from './fdm-local.d'

export async function createFdmLocal(backend: 'memory://' = 'memory://', migrationsFolderPath: string = 'node_modules/@nmi/fdm/dist/db/migrations'): Promise<FdmLocalType> {

  // Create client
  const client = new PGlite(backend)

  // Create drizzle instance
  const db = drizzle(client, { schema })

  // Run migration
  await migrate(db, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })

  return db
}