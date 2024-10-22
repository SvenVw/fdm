import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { type FdmServerType } from './fdm-server.d'
import { sql } from 'drizzle-orm'


describe('Farm Data Model', () => {
  let fdm: FdmServerType

  beforeEach(async () => {
    const host = process.env.POSTGRES_HOST
    const port = Number(process.env.POSTGRES_PORT)
    const user = process.env.POSTGRES_USER
    const password = process.env.POSTGRES_PASSWORD
    const database = process.env.POSTGRES_DB

    fdm = await createFdmServer(
      host,
      port,
      user,
      password,
      database
    )
  })
 
  describe('Database Connection', () => {
    it('should connect to the database', async () => {
      const statement = sql`SELECT 1 + 1`;
      const result = await fdm.execute(statement)
      expect(result).toBeDefined()
    })
  })

  describe('Database Migration', () => {
    it('should migrate the database', async () => {
      const migrationsFolderPath = 'src/db/migrations'
      await migrateFdmServer(fdm, migrationsFolderPath)

      // Add assertion to check if migration was successful
      // For example, check if a specific table exists
      const statement = sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'fdm-dev'
      `
      const tables = await fdm.execute(statement)
      const tableNames = tables.map((row) => row.table_name)
      expect(tableNames).toContain('farms')
    })
  })
})
