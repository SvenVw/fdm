import 'dotenv/config'
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
})
