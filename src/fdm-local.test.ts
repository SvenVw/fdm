import { describe, expect, it, beforeEach} from 'vitest'
import { createFdmLocal, migrateFdmLocal } from './fdm-local'
import { addFarm, getFarm, updateFarm, addField, getField, updateField, getFertilizersFromCatalogue } from './fdm-crud'

describe('Farm Data Model', () => {
  let fdm: ReturnType<typeof createFdmLocal>

  beforeEach(async () => {
    const backend = 'memory://'
    const migrationsFolderPath = 'src/db/migrations'
    fdm = await createFdmLocal(
      backend
    )
    await migrateFdmLocal(fdm, migrationsFolderPath)
  })

  describe('Farm CRUD', () => {
    it('should add a new farm', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)
      expect(b_id_farm).toBeDefined()

      const farm = await getFarm(fdm, b_id_farm)
      expect(farm.b_name_farm).toBe(farmName)
      expect(farm.b_sector).toBe(farmSector)
    })

    it('should get a farm by ID', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const farm = await getFarm(fdm, b_id_farm)
      expect(farm.b_name_farm).toBe(farmName)
      expect(farm.b_sector).toBe(farmSector)
    })

    it('should update a farm', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const updatedFarmName = 'Updated Test Farm'
      const updatedFarmSector = 'arable'
      const updatedFarm = await updateFarm(fdm, b_id_farm, updatedFarmName, updatedFarmSector)
      expect(updatedFarm.b_name_farm).toBe(updatedFarmName)
      expect(updatedFarm.b_sector).toBe(updatedFarmSector)
    })
  })

  describe('Field CRUD', () => {
    it('should add a new field', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const fieldName = 'Test Field'
      const manageStart = new Date('2023-01-01')
      const manageEnd = new Date('2023-12-31')
      const manageType = 'owner'
      const b_id = await addField(fdm, b_id_farm, fieldName, manageStart, manageEnd, manageType)
      expect(b_id).toBeDefined()

      const field = await getField(fdm, b_id)
      expect(field.b_name).toBe(fieldName)
      expect(field.b_id_farm).toBe(b_id_farm)
      expect(field.b_manage_start).toEqual(manageStart)
      expect(field.b_manage_end).toEqual(manageEnd)
      expect(field.b_manage_type).toBe(manageType)
    })

    it('should get a field by ID', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const fieldName = 'Test Field'
      const manageStart = new Date('2023-01-01')
      const manageEnd = new Date('2023-12-31')
      const manageType = 'owner'
      const b_id = await addField(fdm, b_id_farm, fieldName, manageStart, manageEnd, manageType)

      const field = await getField(fdm, b_id)
      expect(field.b_name).toBe(fieldName)
      expect(field.b_id_farm).toBe(b_id_farm)
      expect(field.b_manage_start).toEqual(manageStart)
      expect(field.b_manage_end).toEqual(manageEnd)
      expect(field.b_manage_type).toBe(manageType)
    })

    it('should update a field', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const fieldName = 'Test Field'
      const manageStart = new Date('2023-01-01')
      const manageEnd = new Date('2023-12-31')
      const manageType = 'owner'
      const b_id = await addField(fdm, b_id_farm, fieldName, manageStart, manageEnd, manageType)

      const updatedFieldName = 'Updated Test Field'
      const updatedManageStart = new Date('2024-01-01')
      const updatedManageEnd = new Date('2024-12-31')
      const updatedManageType = 'lease'
      const updatedField = await updateField(fdm, b_id, updatedFieldName, updatedManageStart, updatedManageEnd, updatedManageType)
      expect(updatedField.b_name).toBe(updatedFieldName)
      expect(updatedField.b_manage_start).toEqual(updatedManageStart)
      expect(updatedField.b_manage_end).toEqual(updatedManageEnd)
      expect(updatedField.b_manage_type).toBe(updatedManageType)
    })
  })

  describe('Fertilizers CRUD', () => {
    it('should get fertilizers from catalogue', async () => {
      const fertilizers = await getFertilizersFromCatalogue(fdm)
      expect(fertilizers).toBeDefined()
    })
  })
})
