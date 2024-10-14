import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './db/schema'
import { type FdmLocalType } from './fdm-local.d'

export function createFdmLocal(backend: 'memory://' = 'memory://'): FdmLocalType {

  // Create client
  const client = new PGlite(backend)

  // Create drizzle instance
  const db = drizzle(client, { schema })

  return db
}

export async function migrateFdmLocal(fdm: FdmLocalType, migrationsFolderPath: string = 'node_modules/@nmi/fdm/dist/db/migrations'): Promise<void> {

  // Run migration
  await migrate(fdm, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })
}