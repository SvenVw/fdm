import 'dotenv/config'
import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { addFarm, getFarm, updateFarm } from './farm'
import { type FdmServerType } from './fdm-server.d'

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
})
