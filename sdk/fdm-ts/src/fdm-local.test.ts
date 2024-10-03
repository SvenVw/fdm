// import { access, constants } from 'node:fs';
import { afterEach, afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from "drizzle-orm";
import { fdmLocal } from './fdm-local';
import * as schema from './db/schema';
// import {rmSync} from "node:fs";

describe('fdmLocal', () => {
  let fdmLocalInstance: fdmLocal;
  const filePath = './test.db';

  beforeAll(async () => {
    // Connect to the database
    fdmLocalInstance = new fdmLocal(false, filePath);
    await fdmLocalInstance.migrateDatabase()
  })

  beforeEach(async () => {
    // Create a new instance for each test
    fdmLocalInstance = new fdmLocal(false, filePath);
    await fdmLocalInstance.migrateDatabase()
  });

  afterEach(async () => {
    // Clean up the database after each test
    await fdmLocalInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'));

    // Close the connection to the database
    await fdmLocalInstance.client.close();
  });

  afterAll(() => {

    // Delete the database file after all tests
    // rmSync(filePath, {recursive: true, force: true});
  });

  it('should create an instance with correct parameters', () => {
    expect(fdmLocalInstance.client).toBeDefined();
    expect(fdmLocalInstance.db).toBeDefined();
  });

  it('should add a new farm to the database', async () => {
    const farmData: schema.farmsTypeInsert = {
      b_id_farm: 'test-farm-id',
      b_name_farm: 'test-farm-name',
      b_sector: 'arable',
    };

    await fdmLocalInstance.addFarm(farmData);

    // Retrieve the added farm from the database
    const addedFarm = await fdmLocalInstance.db.select().from(schema.farms)
    expect(addedFarm).toBeDefined();
    expect(addedFarm[0].b_id_farm).toBe(farmData.b_id_farm);
    expect(addedFarm[0].b_name_farm).toBe(farmData.b_name_farm);
    expect(addedFarm[0].b_sector).toBe(farmData.b_sector);
  });
});
