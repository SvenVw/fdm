// import { access, constants } from 'node:fs';
import { afterEach, afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { FdmLocal } from './fdm-local'
import * as schema from './db/schema'
// import {rmSync} from "node:fs";

describe('FdmLocal', () => {
  let FdmLocalInstance: FdmLocal
  const filePath = './test.db'
  const migrationsFolderPath = 'src/db/migrations'

  beforeAll(async () => {
    // Connect to the database
    FdmLocalInstance = new FdmLocal(false, filePath)

    await FdmLocalInstance.migrateDatabase(migrationsFolderPath)
  })

  beforeEach(async () => {
    // Create a new instance for each test
    FdmLocalInstance = new FdmLocal(false, filePath)
    await FdmLocalInstance.migrateDatabase(migrationsFolderPath)
  })

  afterEach(async () => {
    // Clean up the database after each test
    await FdmLocalInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'))

    // Close the connection to the database
    await FdmLocalInstance.client.close()
  })

  afterAll(() => {

    // Delete the database file after all tests
    // rmSync(filePath, {recursive: true, force: true});
  })

  it('should create an instance with correct parameters', () => {
    expect(FdmLocalInstance.client).toBeDefined()
    expect(FdmLocalInstance.db).toBeDefined()
  })
})
