import { eq } from 'drizzle-orm'
import { addSoilAnalysis, getSoilAnalysis, getSoilAnalyses, removeSoilAnalysis, updateSoilAnalysis } from './soil'
import * as schema from './db/schema'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { type FdmServerType } from './fdm-server.d'

describe('Soil Analysis Functions', () => {
    let fdm: FdmServerType
    let test_b_id: string
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
        test_b_id = `test-field-${Date.now()}`

        await fdm.insert(schema.fields).values({ b_id: test_b_id, b_name: 'Test Field', b_geometry: 'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))', b_id_source: "test" })

    })

    afterEach(async () => {
        // Clean up the test data after each test
        await fdm.delete(schema.soilSampling).where(eq(schema.soilSampling.b_id, test_b_id))
        await fdm.delete(schema.soilAnalysis).where(eq(schema.soilAnalysis.a_id, test_a_id))
        await fdm.delete(schema.fields).where(eq(schema.fields.b_id, test_b_id))
    })


    it('should add a new soil analysis', async () => {
        const a_date = new Date()
        const a_source = 'test source'
        const b_depth = 10
        const b_sampling_date = new Date()
        const b_sampling_geometry = 'MULTIPOINT((0 0))'

        test_a_id = await addSoilAnalysis(fdm, a_date, a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry, { a_p_al: 5 })

        expect(test_a_id).toBeDefined()

        const addedAnalysis = await fdm.select().from(schema.soilAnalysis).where(eq(schema.soilAnalysis.a_id, test_a_id)).limit(1)
        expect(addedAnalysis).toHaveLength(1)
        expect(addedAnalysis[0].a_date).toEqual(a_date)


        const addedSampling = await fdm.select().from(schema.soilSampling).where(eq(schema.soilSampling.a_id, test_a_id)).limit(1)

        expect(addedSampling).toHaveLength(1)
        expect(addedSampling[0].b_id).toEqual(test_b_id)

    })

    // Test updating existing soil data

    it('should update an existing soil analysis', async () => {
        const a_date = new Date()
        const a_source = 'test source'
        const b_depth = 10
        const b_sampling_date = new Date()
        const b_sampling_geometry = 'MULTIPOINT((0 0))'


        test_a_id = await addSoilAnalysis(fdm, a_date, a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry)

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
        const b_sampling_geometry = 'MULTIPOINT((0 0))'


        test_a_id = await addSoilAnalysis(fdm, a_date, a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry)

        // Test removing existing soil data
        await removeSoilAnalysis(fdm, test_a_id)

        const removedAnalysis = await fdm.select().from(schema.soilAnalysis).where(eq(schema.soilAnalysis.a_id, test_a_id))
        expect(removedAnalysis).toHaveLength(0)

        const removedSampling = await fdm.select().from(schema.soilSampling).where(eq(schema.soilSampling.a_id, test_a_id))
        expect(removedSampling).toHaveLength(0)

    })


    it('should get latest soil analysis', async () => {
        const a_date_old = new Date()
        const a_source = 'test source'
        const a_som_loi = 5
        const b_depth = 10
        const b_sampling_date = new Date()
        const b_sampling_geometry = 'MULTIPOINT((0 0))'

        test_a_id = await addSoilAnalysis(fdm, a_date_old, a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry)


        const a_date_new = new Date(Date.now() + 1000) // Increment by 1 second


        await addSoilAnalysis(fdm, a_date_new, a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry, { a_som_loi: a_som_loi })

        // get latest soil analysis for field
        const latestAnalysis = await getSoilAnalysis(fdm, test_b_id)
        expect(latestAnalysis?.a_date).toEqual(a_date_new)
        expect(latestAnalysis?.a_som_loi).toEqual(a_som_loi)
    })


    it('should get all soil analysis', async () => {


        const a_date = new Date()
        const a_source = 'test source'
        const a_som_loi = 7
        const b_depth = 10
        const b_sampling_date = new Date()
        const b_sampling_geometry = 'MULTIPOINT((0 0))'

        // Add first soil analysis
        await addSoilAnalysis(fdm, a_date, a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry, { a_som_loi: a_som_loi })

        // Add second soil analysis
        await addSoilAnalysis(fdm, new Date(Date.now() + 1000), a_source, test_b_id, b_depth, b_sampling_date, b_sampling_geometry, { a_som_loi: a_som_loi })

        const allAnalyses = await getSoilAnalyses(fdm, test_b_id)
        expect(allAnalyses).toHaveLength(2)
    })


})

