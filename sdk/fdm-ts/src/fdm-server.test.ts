import 'dotenv/config'
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { eq } from "drizzle-orm";
import { fdmServer } from './fdm-server';
import * as schema from './db/schema';

describe('fdmServer', () => {
  let fdmServerInstance: fdmServer;

  beforeAll(async () => {

    let host = process.env.POSTGRES_HOST
    const port = Number(process.env.POSTGRES_PORT)
    const user = String(process.env.POSTGRES_USER)
    const password = String(process.env.POSTGRES_PASSWORD)
    const db  = String(process.env.POSTGRES_DB)
    if (!host) {
      host = '127.0.0.1'
    }
    
    // Connect to the database
    fdmServerInstance = new fdmServer(host, port, user, password, db);
    await fdmServerInstance.migrateDatabase()
  })

  afterEach(async () => {
    // Clean up the database after each test
    await fdmServerInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'));
  });

  it('should create an instance with correct parameters', () => {
    expect(fdmServerInstance.client).toBeDefined();
    expect(fdmServerInstance.db).toBeDefined();
  });

  it('should return a GraphQL schema', () => {
    const schemaGraphQl = fdmServerInstance.getGraphQlSchema()
    console.log(schemaGraphQl)
    expect(schemaGraphQl).toBeDefined()
  });

  it('should add a new farm to the database', async () => {
    const farmData: schema.farmsTypeInsert = {
      b_id_farm: 'test-farm-id',
      b_name_farm: 'test-farm-name',
      b_sector: 'arable',
    };

    await fdmServerInstance.addFarm(farmData);

    // Retrieve the added farm from the database
    const addedFarm = await fdmServerInstance.db.select().from(schema.farms)
    expect(addedFarm).toBeDefined();
    expect(addedFarm[0].b_id_farm).toBe(farmData.b_id_farm);
    expect(addedFarm[0].b_name_farm).toBe(farmData.b_name_farm);
    expect(addedFarm[0].b_sector).toBe(farmData.b_sector);
  });
});
