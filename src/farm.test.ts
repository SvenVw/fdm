import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmLocal, migrateFdmLocal } from './fdm-local'
import { addFarm, getFarm, updateFarm } from './farm'

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
})
