// import { access, constants } from 'node:fs';
import { afterEach, afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from "drizzle-orm";
import { fdmLocal } from './fdm-local';
import * as schema from './db/schema';
import { unlinkSync } from 'fs';

describe('fdmLocal', () => {
  let fdmLocalInstance: fdmLocal;
  const filePath = './test.db';

  beforeAll(async () => {
    // Connect to the database
    fdmLocalInstance = new fdmLocal(true, filePath);
  })

  afterEach(async () => {
    // Clean up the database after each test
    await fdmLocalInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'));

    // Close the connection to the database
    await fdmLocalInstance.client.close();
  });

  afterAll(async () => {
    // Delete the database file after all tests
    unlinkSync(filePath);
  });

  it('should create an instance with correct parameters', () => {
    expect(fdmLocalInstance.client).toBeDefined();
    expect(fdmLocalInstance.db).toBeDefined();
  });

  // it('should add a new farm to the database', async () => {
  //   const farmData: schema.farmsTypeInsert = {
  //     b_id_farm: 'test-farm-id',
  //     b_name_farm: 'test-farm-name',
  //     b_sector: 'arable',
  //   };

  //   await fdmLocalInstance.addFarm(farmData);

  //   // Retrieve the added farm from the database
  //   const addedFarm = await fdmLocalInstance.db.query.farms.findFirst({
  //     where: (farms) => farms.b_id_farm === farmData.b_id_farm,
  //   });

  //   expect(addedFarm).toBeDefined();
  //   expect(addedFarm?.b_id_farm).toBe(farmData.b_id_farm);
  //   expect(addedFarm?.b_name_farm).toBe(farmData.b_name_farm);
  //   expect(addedFarm?.b_sector).toBe(farmData.b_sector);
  // });
});
