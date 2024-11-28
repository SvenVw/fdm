import { describe, expect, it, afterAll, beforeEach } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { type FdmServerType } from './fdm-server.d'
import { addCultivationToCatalogue, getCultivationsFromCatalogue, addCultivation, removeCultivation, getCultivation, getCultivations, getCultivationPlan } from './cultivation'
import { addFarm } from './farm'
import { addField } from './field'
import { nanoid } from 'nanoid'

describe('Cultivation Data Model', () => {
    let fdm: FdmServerType
    let b_lu_catalogue: string
    let b_id_farm: string
    let b_id: string

    beforeEach(async () => {
        const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_USER', 'POSTGRES_PASSWORD', 'POSTGRES_DB'];
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(`Missing required environment variable: ${envVar}`);
            }
        }

        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
        if (Number.isNaN(port)) {
            throw new Error('POSTGRES_PORT must be a valid number');
        }
        const user = process.env.POSTGRES_USER
        const password = process.env.POSTGRES_PASSWORD
        const database = process.env.POSTGRES_DB
        const migrationsFolderPath = 'src/db/migrations'

        fdm = await createFdmServer(host, port, user, password, database)
        await migrateFdmServer(fdm, migrationsFolderPath)

        b_lu_catalogue = nanoid()
        b_id_farm = await addFarm(fdm, 'test farm', 'arable')
        b_id = await addField(
            fdm,
            b_id_farm,
            'test field',
            'test source',
            'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
            '2023-01-01',
            '2023-12-31',
            'owner'
        )
    })

    afterAll(async () => {
        // No specific afterAll tasks needed for this suite. Individual tests handle necessary cleanup.
    })

    describe('Cultivation CRUD', () => {
        it('should get cultivations from catalogue', async () => {
            const cultivations = await getCultivationsFromCatalogue(fdm)
            expect(cultivations).toBeDefined()
        })

        it('should add a new cultivation to the catalogue', async () => {
            const b_lu_source = 'custom'
            const b_lu_name = 'Test Cultivation'
            const b_lu_name_en = 'Test Cultivation (EN)'
            const b_lu_hcat3 = 'test-hcat3'
            const b_lu_hcat3_name = 'Test HCAT3 Name'

            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue, b_lu_source, b_lu_name, b_lu_name_en, b_lu_hcat3, b_lu_hcat3_name
            })

            const cultivations = await getCultivationsFromCatalogue(fdm)
            expect(cultivations.length).toBeGreaterThanOrEqual(1)

            const cultivation = cultivations.find((c) => c.b_lu_catalogue === b_lu_catalogue)
            expect(cultivation).toBeDefined()
            expect(cultivation?.b_lu_source).toBe(b_lu_source)
            expect(cultivation?.b_lu_name).toBe(b_lu_name)
            expect(cultivation?.b_lu_name_en).toBe(b_lu_name_en)
            expect(cultivation?.b_lu_hcat3).toBe(b_lu_hcat3)
            expect(cultivation?.b_lu_hcat3_name).toBe(b_lu_hcat3_name)
        })


        it('should add a new cultivation', async () => {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            })

            const b_sowing_date = '2024-01-01'
            const b_lu = await addCultivation(fdm, b_lu_catalogue, b_id, b_sowing_date)
            expect(b_lu).toBeDefined()

            const cultivation = await getCultivation(fdm, b_lu)
            expect(cultivation.b_lu).toBeDefined() // Check existence
            expect(cultivation.b_sowing_date).toEqual(b_sowing_date) // Check value

        })



        it('should get cultivations by field ID', async () => {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            })


            const b_sowing_date = '2024-01-01'
            await addCultivation(fdm, b_lu_catalogue, b_id, b_sowing_date)
            await addCultivation(fdm, b_lu_catalogue, b_id, b_sowing_date)

            const cultivations = await getCultivations(fdm, b_id)
            expect(cultivations.length).toBe(2)
        })

        it('should remove a cultivation', async () => {

            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            })

            const b_sowing_date = '2024-01-01'
            const b_lu = await addCultivation(fdm, b_lu_catalogue, b_id, b_sowing_date)


            await removeCultivation(fdm, b_lu)

            await expect(getCultivation(fdm, b_lu)).rejects.toThrowError('Cultivation does not exist')
        })


    })

    describe('getCultivationPlan', () => {
        it('should return an empty array if no cultivations are found', async () => {
            const cultivationPlan = await getCultivationPlan(fdm, b_id_farm);
            expect(cultivationPlan).toEqual([]);
        });

        it('should return a cultivation plan with unique cultivations and their fields', async () => {
            const catalogueItem1 = nanoid()
            const catalogueItem2 = nanoid()


            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: catalogueItem1,
                b_lu_source: 'test-source-1',
                b_lu_name: 'test-name-1',
                b_lu_name_en: 'test-name-en-1',
                b_lu_hcat3: 'test-hcat3-1',
                b_lu_hcat3_name: 'test-hcat3-name-1'
            })
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: catalogueItem2,
                b_lu_source: 'test-source-2',
                b_lu_name: 'test-name-2',
                b_lu_name_en: 'test-name-en-2',
                b_lu_hcat3: 'test-hcat3-2',
                b_lu_hcat3_name: 'test-hcat3-name-2'
            })


            const b_sowing_date = '2024-01-01'
            await addCultivation(fdm, catalogueItem1, b_id, b_sowing_date)            
            const b_id2 = await addField(
                fdm,
                b_id_farm,
                'test field 2',
                'test source 2',
                'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
                '2023-01-01',
                '2023-12-31',
                'owner'
            )
            await addCultivation(fdm, catalogueItem1, b_id2, b_sowing_date)
            await addCultivation(fdm, catalogueItem2, b_id, b_sowing_date)


            const cultivationPlan = await getCultivationPlan(fdm, b_id_farm);

            expect(cultivationPlan.length).toBe(2);


            const cultivation1 = cultivationPlan.find(item => item.b_lu_catalogue === catalogueItem1);
            expect(cultivation1).toBeDefined();
            expect(cultivation1?.fields.length).toBe(2);

            const cultivation2 = cultivationPlan.find(item => item.b_lu_catalogue === catalogueItem2);
            expect(cultivation2).toBeDefined();
            expect(cultivation2?.fields.length).toBe(1);

        });
    });
})