import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import * as schema from './db/schema'
import { type FdmServerType } from './fdm-server.d'

export function createFdmServer(host: string | undefined, port: number | undefined, user: string | undefined, password: string | (() => string | Promise<string>) | undefined, database: string | undefined): FdmServerType {

  // Create drizzle instance
  const db = drizzle({
    connection : {
      user : user,
      password : password,
      host : host,
      port : port,
      database : database
    },
    logger: false,
    schema: schema
  })
  
  return db
}

export async function migrateFdmServer(fdm: FdmServerType, migrationsFolderPath: string = 'node_modules/@nmi/fdm/dist/db/migrations'): Promise<void> {

  // Run migration
  await migrate(fdm, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })
}