import { eq } from 'drizzle-orm'
import { addSoilAnalysis, getSoilAnalysis, getSoilAnalyses, removeSoilAnalysis, updateSoilAnalysis } from './soil'
import * as schema from './db/schema'
import { beforeEach, describe, expect, it } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { type FdmServerType } from './fdm-server.d'
import { addField } from './field'
import { addFarm } from './farm'

describe('Soil Analysis Functions', () => {
    let fdm: FdmServerType
    let b_id: string
    let test_a_id: string

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

        // Create test field and analyses before each test
        const farmName = 'Test Farm'
        const farmSector = 'diary'
        const b_id_farm = await addFarm(fdm, farmName, farmSector)

        const fieldName = 'Test Field'
        const fieldIDSource = 'test-field-id'
        const fieldGeometry = 'POLYGON((30 10,40 40,20 40,10 20,30 10))'
        const manageStart = '2023-01-01'
        const manageEnd = '2023-12-31'
        const manageType = 'owner'
        b_id = await addField(fdm, b_id_farm, fieldName, fieldIDSource, fieldGeometry, manageStart, manageEnd, manageType)

    })

    it('should add a new soil analysis', async () => {
        const a_date = new Date()
        const a_source = 'test source'
        const b_depth = 10
        const b_sampling_date = new Date()
        // const b_sampling_geometry = 'MULTIPOINT((0 0))'
        const a_p_al = 5
        const a_p_cc = 5
        const b_soiltype_agr = 'rivierklei'
        const b_gwl_class = 'II'

        test_a_id = await addSoilAnalysis(fdm, a_date, a_source, b_id, b_depth, b_sampling_date, { a_p_al: a_p_al, a_p_cc: a_p_cc, b_soiltype_agr: b_soiltype_agr, b_gwl_class: b_gwl_class })

        expect(test_a_id).toBeDefined()

        const addedAnalysis = await fdm.select().from(schema.soilAnalysis).where(eq(schema.soilAnalysis.a_id, test_a_id)).limit(1)
        expect(addedAnalysis).toHaveLength(1)
        expect(addedAnalysis[0].a_date).toEqual(a_date)
        expect(addedAnalysis[0].a_source).toEqual(a_source)
        expect(addedAnalysis[0].a_p_al).toEqual(a_p_al)
        expect(addedAnalysis[0].a_p_cc).toEqual(a_p_cc)
        expect(addedAnalysis[0].b_soiltype_agr).toEqual(b_soiltype_agr)
        expect(addedAnalysis[0].b_gwl_class).toEqual(b_gwl_class)


        const addedSampling = await fdm.select().from(schema.soilSampling).where(eq(schema.soilSampling.a_id, test_a_id)).limit(1)

        expect(addedSampling).toHaveLength(1)
        expect(addedSampling[0].b_id).toEqual(b_id)

    })

    // Test updating existing soil data

    it('should update an existing soil analysis', async () => {
        const a_date = new Date()
        const a_source = 'test source'
        const b_depth = 10
        const b_sampling_date = new Date()
        // const b_sampling_geometry = 'MULTIPOINT((0 0))'


        test_a_id = await addSoilAnalysis(fdm, a_date, a_source, b_id, b_depth, b_sampling_date)

        // Test updating existing soil data
        const updated_a_source = 'updated test source'
        await updateSoilAnalysis(fdm, test_a_id, { a_source: updated_a_source })

        const updatedAnalysis = await fdm.select().from(schema.soilAnalysis).where(eq(schema.soilAnalysis.a_id, test_a_id)).limit(1)
        expect(updatedAnalysis[0].a_source).toEqual(updated_a_source)

    })

    // Test removing existing soil data
    it('should remove an existing soil analysis', async () => {
        const a_date = new Date()
        const a_source = 'test source'
        const b_depth = 10
        const b_sampling_date = new Date()
        // const b_sampling_geometry = 'MULTIPOINT((0 0))'


        test_a_id = await addSoilAnalysis(fdm, a_date, a_source, b_id, b_depth, b_sampling_date)

        // Test removing existing soil data
        await removeSoilAnalysis(fdm, test_a_id)

        const removedAnalysis = await fdm.select().from(schema.soilAnalysis).where(eq(schema.soilAnalysis.a_id, test_a_id))
        expect(removedAnalysis).toHaveLength(0)

        const removedSampling = await fdm.select().from(schema.soilSampling).where(eq(schema.soilSampling.a_id, test_a_id))
        expect(removedSampling).toHaveLength(0)

    })


    it('should get latest soil analysis', async () => {
        const a_date_old = new Date('2024-01-02T00:00:00Z'); 
        const a_source = 'test source'
        const a_som_loi = 5
        const b_depth = 10
        const b_sampling_date_old = new Date('2024-01-01T00:00:00Z'); 
        // const b_sampling_geometry = 'MULTIPOINT((0 0))'

        test_a_id = await addSoilAnalysis(fdm, a_date_old, a_source, b_id, b_depth, b_sampling_date_old)

        const b_sampling_date_new = new Date(b_sampling_date_old.getTime() + 5000); // Add 5 seconds

        await addSoilAnalysis(fdm, a_date_old, a_source, b_id, b_depth, b_sampling_date_new, { a_som_loi: a_som_loi })

        const allAnalyses = await getSoilAnalyses(fdm, b_id)
        expect(allAnalyses).toHaveLength(2)

        // get latest soil analysis for field
        const latestAnalysis = await getSoilAnalysis(fdm, b_id)
        expect(latestAnalysis?.a_date).toEqual(a_date_old)
        expect(latestAnalysis?.b_sampling_date).toEqual(b_sampling_date_new)
        expect(latestAnalysis?.a_som_loi).toEqual(a_som_loi)
    })


    it('should get all soil analysis', async () => {

        const a_date = new Date()
        const a_source = 'test source'
        const a_som_loi = 7
        const b_depth = 10
        const b_sampling_date = new Date()
        // const b_sampling_geometry = 'MULTIPOINT((0 0))'

        // Add first soil analysis
        await addSoilAnalysis(fdm, a_date, a_source, b_id, b_depth, b_sampling_date, { a_som_loi: a_som_loi })

        // Add second soil analysis
        await addSoilAnalysis(fdm, new Date(Date.now() + 1000), a_source, b_id, b_depth, b_sampling_date, { a_som_loi: a_som_loi })

        const allAnalyses = await getSoilAnalyses(fdm, b_id)
        expect(allAnalyses).toHaveLength(2)
    })


})

