import { describe, expect, it, beforeEach} from 'vitest'
import { createFdmLocal, migrateFdmLocal } from './fdm-local'
import { addFarm, getFarm, updateFarm, addField, getField, updateField, getFertilizersFromCatalogue, addFertilizerToCatalogue, addFertilizer, removeFertilizer } from './fdm-crud'

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


    it('should add a new fertilizer to the catalogue', async () => {
      const p_name_nl = 'Test Fertilizer'
      const p_name_en = 'Test Fertilizer (EN)'
      const p_description = 'This is a test fertilizer'
      const p_id_catalogue = await addFertilizerToCatalogue(
        fdm,
        'custom',
        p_name_nl,
        p_name_en,
        p_description,
        {
          p_dm: 37,
          p_om: 20,
          p_a: 30,
          p_hc: 40,
          p_eom: 50,
          p_eoc: 60,
          p_c_rt: 70,
          p_c_of: 80,
          p_c_if: 90,
          p_c_fr: 100,
          p_cn_of: 110,
          p_n_rt: 120,
          p_n_if: 130,
          p_n_of: 140,
          p_n_wc: 150,
          p_p_rt: 160,
          p_k_rt: 170,
          p_mg_rt: 180,
          p_ca_rt: 190,
          p_ne: 200,
          p_s_rt: 210,
          p_s_wc: 220,
          p_cu_rt: 230,
          p_zn_rt: 240,
          p_na_rt: 250,
          p_si_rt: 260,
          p_b_rt: 270,
          p_mn_rt: 280,
          p_ni_rt: 290,
          p_fe_rt: 300,
          p_mo_rt: 310,
          p_co_rt: 320,
          p_as_rt: 330,
          p_cd_rt: 340,
          pr_cr_rt: 350,
          p_cr_vi: 360,
          p_pb_rt: 370,
          p_hg_rt: 380,
          p_cl_rt: 390,
        }
      )
      expect(p_id_catalogue).toBeDefined()

      const fertilizers = await getFertilizersFromCatalogue(fdm)
      expect(fertilizers.length).toBeGreaterThanOrEqual(1)
      const fertilizer = fertilizers.find(
        (f) => f.p_id_catalogue === p_id_catalogue
      )
      expect(fertilizer).toBeDefined()
      expect(fertilizer?.p_name_nl).toBe(p_name_nl)
      expect(fertilizer?.p_name_en).toBe(p_name_en)
      expect(fertilizer?.p_description).toBe(p_description)
    })
    
    it('should add a new fertilizer', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const p_name_nl = 'Test Fertilizer'
      const p_name_en = 'Test Fertilizer (EN)'
      const p_description = 'This is a test fertilizer'
      const p_id_catalogue = await addFertilizerToCatalogue(
        fdm,
        'custom',
        p_name_nl,
        p_name_en,
        p_description,
        {
          p_dm: 37,
          p_om: 20,
          p_a: 30,
          p_hc: 40,
          p_eom: 50,
          p_eoc: 60,
          p_c_rt: 70,
          p_c_of: 80,
          p_c_if: 90,
          p_c_fr: 100,
          p_cn_of: 110,
          p_n_rt: 120,
          p_n_if: 130,
          p_n_of: 140,
          p_n_wc: 150,
          p_p_rt: 160,
          p_k_rt: 170,
          p_mg_rt: 180,
          p_ca_rt: 190,
          p_ne: 200,
          p_s_rt: 210,
          p_s_wc: 220,
          p_cu_rt: 230,
          p_zn_rt: 240,
          p_na_rt: 250,
          p_si_rt: 260,
          p_b_rt: 270,
          p_mn_rt: 280,
          p_ni_rt: 290,
          p_fe_rt: 300,
          p_mo_rt: 310,
          p_co_rt: 320,
          p_as_rt: 330,
          p_cd_rt: 340,
          pr_cr_rt: 350,
          p_cr_vi: 360,
          p_pb_rt: 370,
          p_hg_rt: 380,
          p_cl_rt: 390,
        }
      )

      const p_amount = 1000
      const p_date_acquiring = new Date()
      const p_id = await addFertilizer(
        fdm,
        p_id_catalogue,
        b_id_farm,
        p_amount,
        p_date_acquiring
      )
      expect(p_id).toBeDefined()
    })

    it('should remove a fertilizer', async () => {
      const farmName = 'Test Farm'
      const farmSector = 'diary'
      const b_id_farm = await addFarm(fdm, farmName, farmSector)

      const p_name_nl = 'Test Fertilizer'
      const p_name_en = 'Test Fertilizer (EN)'
      const p_description = 'This is a test fertilizer'
      const p_id_catalogue = await addFertilizerToCatalogue(
        fdm,
        'custom',
        p_name_nl,
        p_name_en,
        p_description,
        {
          p_dm: 37,
          p_om: 20,
          p_a: 30,
          p_hc: 40,
          p_eom: 50,
          p_eoc: 60,
          p_c_rt: 70,
          p_c_of: 80,
          p_c_if: 90,
          p_c_fr: 100,
          p_cn_of: 110,
          p_n_rt: 120,
          p_n_if: 130,
          p_n_of: 140,
          p_n_wc: 150,
          p_p_rt: 160,
          p_k_rt: 170,
          p_mg_rt: 180,
          p_ca_rt: 190,
          p_ne: 200,
          p_s_rt: 210,
          p_s_wc: 220,
          p_cu_rt: 230,
          p_zn_rt: 240,
          p_na_rt: 250,
          p_si_rt: 260,
          p_b_rt: 270,
          p_mn_rt: 280,
          p_ni_rt: 290,
          p_fe_rt: 300,
          p_mo_rt: 310,
          p_co_rt: 320,
          p_as_rt: 330,
          p_cd_rt: 340,
          pr_cr_rt: 350,
          p_cr_vi: 360,
          p_pb_rt: 370,
          p_hg_rt: 380,
          p_cl_rt: 390,
        }
      )

      const p_amount = 1000
      const p_date_acquiring = new Date()
      const p_id = await addFertilizer(
        fdm,
        p_id_catalogue,
        b_id_farm,
        p_amount,
        p_date_acquiring
      )
      expect(p_id).toBeDefined()

      await removeFertilizer(fdm, p_id)

      const fertilizers = await getFertilizersFromCatalogue(fdm)
      expect(fertilizers.length).toBeGreaterThanOrEqual(1)
      const fertilizer = fertilizers.find(
        (f) => f.p_id_catalogue === p_id_catalogue
      )
      expect(fertilizer).toBeDefined()
      expect(fertilizer?.p_name_nl).toBe(p_name_nl)
      expect(fertilizer?.p_name_en).toBe(p_name_en)
      expect(fertilizer?.p_description).toBe(p_description)
    })
  })
})
