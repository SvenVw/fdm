// fdm-local.test.ts
import { afterEach, afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { eq } from 'drizzle-orm'
import { FdmLocal } from './fdm-local'
import * as schema from './db/schema'

describe('FdmLocal', () => {
  let fdmLocalInstance: FdmLocal
  const filePath = './test.db'
  const migrationsFolderPath = 'src/db/migrations'

  beforeAll(async () => {
    // Connect to the database
    fdmLocalInstance = new FdmLocal(true, filePath)
    await fdmLocalInstance.migrateDatabase(migrationsFolderPath)
  })

  beforeEach(async () => {
    // Create a new instance for each test
    fdmLocalInstance = new FdmLocal(true, filePath)
    await fdmLocalInstance.migrateDatabase(migrationsFolderPath)
  })

  afterEach(async () => {
    // Clean up the database after each test
    await fdmLocalInstance.db.delete(schema.farms).where(eq(schema.farms.b_id_farm, 'test-farm-id'))
    await fdmLocalInstance.db.delete(schema.fields).where(eq(schema.fields.b_id, 'test-field-id'))
    await fdmLocalInstance.db.delete(schema.farmManaging).where(eq(schema.farmManaging.b_id, 'test-field-id'))
  })

  afterAll(() => {
    // Delete the database file after all tests
    // rmSync(filePath, {recursive: true, force: true});
  })

  it('should create an instance with correct parameters', () => {
    expect(fdmLocalInstance.client).toBeDefined()
    expect(fdmLocalInstance.db).toBeDefined()
  })

  it('should add a new farm to the database', async () => {
    const b_id_farm = await fdmLocalInstance.addFarm('test-farm-name', 'arable')

    // Retrieve the added farm from the database
    const addedFarm = await fdmLocalInstance.db.select().from(schema.farms).where(eq(schema.farms.b_id_farm, b_id_farm))
    expect(addedFarm).toBeDefined()
    expect(addedFarm[0].b_id_farm).toBe(b_id_farm)
    expect(addedFarm[0].b_name_farm).toBe('test-farm-name')
    expect(addedFarm[0].b_sector).toBe('arable')
  })

  it('should get the details of a farm', async () => {
    const b_id_farm = await fdmLocalInstance.addFarm('test-farm-name', 'arable')

    const farm = await fdmLocalInstance.getFarm(b_id_farm)

    expect(farm).toBeDefined()
    expect(farm.b_id_farm).toBe(b_id_farm)
    expect(farm.b_name_farm).toBe('test-farm-name')
    expect(farm.b_sector).toBe('arable')
  })

  it('should update the details of a farm', async () => {
    const b_id_farm = await fdmLocalInstance.addFarm('test-farm-name', 'arable')

    const farm = await fdmLocalInstance.updateFarm(b_id_farm, 'test-farm-name-updated', 'diary')

    expect(farm).toBeDefined()
    expect(farm.b_id_farm).toBe(b_id_farm)
    expect(farm.b_name_farm).toBe('test-farm-name-updated')
    expect(farm.b_sector).toBe('diary')
  })

  it('should add a new field to the database', async () => {
    const b_id_farm = await fdmLocalInstance.addFarm('test-farm-name', 'arable')
    const b_id = await fdmLocalInstance.addField(b_id_farm, 'test-field-name', new Date(), new Date(), 'owner')

    // Retrieve the added field from the database
    const addedField = await fdmLocalInstance.db.select().from(schema.fields).where(eq(schema.fields.b_id, b_id))
    expect(addedField).toBeDefined()
    expect(addedField[0].b_id).toBe(b_id)
    expect(addedField[0].b_name).toBe('test-field-name')

    // Retrieve the added farm managing relation from the database
    const addedFarmManaging = await fdmLocalInstance.db.select().from(schema.farmManaging).where(eq(schema.farmManaging.b_id, b_id))
    expect(addedFarmManaging).toBeDefined()
    expect(addedFarmManaging[0].b_id).toBe(b_id)
    expect(addedFarmManaging[0].b_id_farm).toBe(b_id_farm)
  })

  it('should get the details of a field', async () => {
    const b_id_farm = await fdmLocalInstance.addFarm('test-farm-name', 'arable')
    const b_id = await fdmLocalInstance.addField(b_id_farm, 'test-field-name', new Date(), new Date(), 'owner')

    const field = await fdmLocalInstance.getField(b_id)

    expect(field).toBeDefined()
    expect(field.b_id).toBe(b_id)
    expect(field.b_name).toBe('test-field-name')
  })

  it('should update the details of a field', async () => {
    const b_id_farm = await fdmLocalInstance.addFarm('test-farm-name', 'arable')
    const b_id = await fdmLocalInstance.addField(b_id_farm, 'test-field-name', new Date(), new Date(), 'owner')

    const updatedField = await fdmLocalInstance.updateField(b_id, 'updated-test-field-name', new Date('2024-03-10'), new Date('2025-03-10'), 'lease')

    expect(updatedField).toBeDefined()
    expect(updatedField.b_id).toBe(b_id)
    expect(updatedField.b_name).toBe('updated-test-field-name')
    expect(updatedField.b_manage_start).toEqual(new Date('2024-03-10'))
    expect(updatedField.b_manage_end).toEqual(new Date('2025-03-10'))
    expect(updatedField.b_manage_type).toBe('lease')
  })
})
