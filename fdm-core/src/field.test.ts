import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { type FdmServerType } from './fdm-server.d'
import { addFarm } from './farm'
import { addField, getField, updateField } from './field'

describe('Farm Data Model', () => {
  let fdm: FdmServerType

  beforeEach(async () => {
    const host = process.env.POSTGRES_HOST
    const port = Number(process.env.POSTGRES_PORT)
    const user = process.env.POSTGRES_USER
    const password = process.env.POSTGRES_PASSWORD
    const database = process.env.POSTGRES_DB
    const migrationsFolderPath = 'src/db/migrations'

    fdm = await createFdmServer(
      host,
      port,
      user,
      password,
      database
    )

    await migrateFdmServer(fdm, migrationsFolderPath)
  })

  describe('Field CRUD', () => {
    it('should add a new field', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const fieldName = 'Test Field'
      const fieldIDSource = 'test-field-id'
      const fieldGeometry = 'POLYGON((30 10,40 40,20 40,10 20,30 10))'
      const manageStart = new Date('2023-01-01')
      const manageEnd = new Date('2023-12-31')
      const manageType = 'owner'
      const b_id = await addField(fdm, b_id_farm, fieldName, fieldIDSource, fieldGeometry, manageStart, manageEnd, manageType)
      expect(b_id).toBeDefined()

      const field = await getField(fdm, b_id)
      expect(field.b_name).toBe(fieldName)
      expect(field.b_id_farm).toBe(b_id_farm)
      expect(field.b_id_source).toBe(fieldIDSource)
      expect(field.b_geometry).toBe(fieldGeometry)
      expect(field.b_manage_start).toEqual(manageStart)
      expect(field.b_manage_end).toEqual(manageEnd)
      expect(field.b_manage_type).toBe(manageType)
    })

    it('should get a field by ID', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const fieldName = 'Test Field'
      const fieldIDSource = 'test-field-id'
      const fieldGeometry = 'POLYGON((30 10,40 40,20 40,10 20,30 10))'
      const manageStart = new Date('2023-01-01')
      const manageEnd = new Date('2023-12-31')
      const manageType = 'owner'
      const b_id = await addField(fdm, b_id_farm, fieldName, fieldIDSource, fieldGeometry, manageStart, manageEnd, manageType)

      const field = await getField(fdm, b_id)
      expect(field.b_name).toBe(fieldName)
      expect(field.b_id_farm).toBe(b_id_farm)
      expect(field.b_id_source).toBe(fieldIDSource)
      expect(field.b_geometry).toBe(fieldGeometry)
      expect(field.b_manage_start).toEqual(manageStart)
      expect(field.b_manage_end).toEqual(manageEnd)
      expect(field.b_manage_type).toBe(manageType)
    })

    it('should update a field', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const fieldName = 'Test Field'
      const fieldIDSource = 'test-field-id'
      const fieldGeometry = 'POLYGON((30 10,40 40,20 40,10 20,30 10))'
      const manageStart = new Date('2023-01-01')
      const manageEnd = new Date('2023-12-31')
      const manageType = 'owner'
      const b_id = await addField(fdm, b_id_farm, fieldName, fieldIDSource, fieldGeometry, manageStart, manageEnd, manageType)

      const updatedFieldName = 'Updated Test Field'
      const updatedFieldIDSource = 'updated-test-field-id'
      const updatedFieldGeometry = 'POLYGON((30 10,40 40,20 40,10 20,30 10))'
      const updatedManageStart = new Date('2024-01-01')
      const updatedManageEnd = new Date('2024-12-31')
      const updatedManageType = 'lease'
      const updatedField = await updateField(fdm, b_id, updatedFieldName, updatedFieldIDSource, updatedFieldGeometry, updatedManageStart, updatedManageEnd, updatedManageType)
      expect(updatedField.b_name).toBe(updatedFieldName)
      expect(updatedField.b_id_source).toBe(updatedFieldIDSource)
      expect(updatedField.b_geometry).toBe(fieldGeometry)
      expect(updatedField.b_manage_start).toEqual(updatedManageStart)
      expect(updatedField.b_manage_end).toEqual(updatedManageEnd)
      expect(updatedField.b_manage_type).toBe(updatedManageType)
    })
  })
})
