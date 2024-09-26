import 'dotenv/config'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { eq } from "drizzle-orm";
import { fdmServer } from './fdm-server';
import * as schema from './db/schema';

describe('fdmServer', () => {
  let fdmServerInstance: fdmServer;

  beforeAll(async () => {
    // Connect to the database
    fdmServerInstance = new fdmServer(process.env.POSTGRES_HOST, Number(process.env.POSTGRES_PORT), process.env.POSTGRES_USER, process.env.POSTGRES_PASSWORD, process.env.POSTGRES_DB);
  })

  afterEach(async () => {
    // Clean up the database after each test
    await fdmServerInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'));
  });

  it('should create an instance with correct parameters', () => {
    expect(fdmServerInstance.client).toBeDefined();
    expect(fdmServerInstance.db).toBeDefined();
  });

  it('should add a new farm to the database', async () => {
    const farmData: schema.farmsTypeInsert = {
      b_id_farm: 'test-farm-id',
      b_name_farm: 'test-farm-name',
      b_sector: 'arable',
    };

    await fdmServerInstance.addFarm(farmData);

    // Retrieve the added farm from the database
    const addedFarm = await fdmServerInstance.db.query.farms.findFirst({
      where: eq(schema.farms.b_id_farm, farmData.b_id_farm),
    });
    expect(addedFarm).toBeDefined();
    expect(addedFarm?.b_id_farm).toBe(farmData.b_id_farm);
    expect(addedFarm?.b_name_farm).toBe(farmData.b_name_farm);
    expect(addedFarm?.b_sector).toBe(farmData.b_sector);
  });
});
