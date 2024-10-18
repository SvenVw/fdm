import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmLocal, migrateFdmLocal } from './fdm-local'
import { type FdmLocalType } from './fdm-local.d'
import { sql } from 'drizzle-orm'


describe('Farm Data Model', () => {
  let fdm: FdmLocalType

  beforeEach(async () => {
    fdm = await createFdmLocal(
     'memory://'
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
      await migrateFdmLocal(fdm, migrationsFolderPath)

      // Add assertion to check if migration was successful
      // For example, check if a specific table exists
      const statement = sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'fdm-dev'
      `
      const tables = await fdm.execute(statement)
      const tableNames = tables.rows.map((row) => row.table_name)
      expect(tableNames).toContain('farms')
    })
  })
})
