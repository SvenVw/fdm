import 'dotenv/config'
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { FdmServer } from './fdm-server'
import * as schema from './db/schema'

describe('FdmServer', () => {
  let FdmServerInstance: FdmServer

  beforeAll(async () => {
    let host = process.env.POSTGRES_HOST
    const port = Number(process.env.POSTGRES_PORT)
    const user = String(process.env.POSTGRES_USER)
    const password = String(process.env.POSTGRES_PASSWORD)
    const db = String(process.env.POSTGRES_DB)
    if (host == null) {
      host = '127.0.0.1'
    }

    // Connect to the database
    FdmServerInstance = new FdmServer(host, port, user, password, db)
    await FdmServerInstance.migrateDatabase()
  })

  beforeEach(async () => {
    // Clean up the database before each test
    await FdmServerInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'))
    await FdmServerInstance.db.delete(schema.fields).where(eq(schema.fields.b_id, 'test-field-id'))
    await FdmServerInstance.db.delete(schema.farmManaging).where(eq(schema.farmManaging.b_id, 'test-field-id'))
  })

  afterEach(async () => {
    // Close the connection to the database
    // await FdmServerInstance.client.close();
  })

  it('should create an instance with correct parameters', () => {
    expect(FdmServerInstance.client).toBeDefined()
    expect(FdmServerInstance.db).toBeDefined()
  })

  it('should add a new farm to the database', async () => {
    const b_id_farm = await FdmServerInstance.addFarm('test-farm-name', 'arable')

    // Retrieve the added farm from the database
    const addedFarm = await FdmServerInstance.db.select().from(schema.farms).where(eq(schema.farms.b_id_farm, b_id_farm))
    expect(addedFarm).toBeDefined()
    expect(addedFarm[0].b_id_farm).toBe(b_id_farm)
    expect(addedFarm[0].b_name_farm).toBe('test-farm-name')
    expect(addedFarm[0].b_sector).toBe('arable')
  })

  it('should get the details of a farm', async () => {
    const b_id_farm = await FdmServerInstance.addFarm('test-farm-name', 'arable')

    const farm = await FdmServerInstance.getFarm(b_id_farm)

    expect(farm).toBeDefined()
    expect(farm.b_id_farm).toBe(b_id_farm)
    expect(farm.b_name_farm).toBe('test-farm-name')
    expect(farm.b_sector).toBe('arable')
  })

  it('should update the details of a farm', async () => {
    const b_id_farm = await FdmServerInstance.addFarm('test-farm-name', 'arable')

    const farm = await FdmServerInstance.updateFarm(b_id_farm, 'test-farm-name-updated', 'diary')

    expect(farm).toBeDefined()
    expect(farm.b_id_farm).toBe(b_id_farm)
    expect(farm.b_name_farm).toBe('test-farm-name-updated')
    expect(farm.b_sector).toBe('diary')
  })

  it('should add a new field to the database', async () => {
    const b_id_farm = await FdmServerInstance.addFarm('test-farm-name', 'arable')
    const b_id = await FdmServerInstance.addField(b_id_farm, 'test-field-name', new Date(), new Date(), 'owner')

    // Retrieve the added field from the database
    const addedField = await FdmServerInstance.db.select().from(schema.fields).where(eq(schema.fields.b_id, b_id))
    expect(addedField).toBeDefined()
    expect(addedField[0].b_id).toBe(b_id)
    expect(addedField[0].b_name).toBe('test-field-name')

    // Retrieve the added farm managing relation from the database
    const addedFarmManaging = await FdmServerInstance.db.select().from(schema.farmManaging).where(eq(schema.farmManaging.b_id, b_id))
    expect(addedFarmManaging).toBeDefined()
    expect(addedFarmManaging[0].b_id).toBe(b_id)
    expect(addedFarmManaging[0].b_id_farm).toBe(b_id_farm)
  })

  it('should get the details of a field', async () => {
    const b_id_farm = await FdmServerInstance.addFarm('test-farm-name', 'arable')
    const b_id = await FdmServerInstance.addField(b_id_farm, 'test-field-name', new Date(), new Date(), 'owner')

    const field = await FdmServerInstance.getField(b_id)

    expect(field).toBeDefined()
    expect(field.b_id).toBe(b_id)
    expect(field.b_name).toBe('test-field-name')
  })

  it('should create a GraphQL server', async () => {
    const app = FdmServerInstance.createGraphQlServer(false)
    expect(app).toBeDefined()
  })

  it('should return a GraphQL schema', async () => {
    const schema = FdmServerInstance.getGraphQlSchema()
    expect(schema).toBeDefined()
  })
})
