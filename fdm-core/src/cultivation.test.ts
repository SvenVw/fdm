import { describe, expect, it, afterAll, beforeEach, beforeAll } from 'vitest'
import { createFdmServer, migrateFdmServer } from './fdm-server'
import { type FdmServerType } from './fdm-server.d'
import { addCultivationToCatalogue, getCultivationsFromCatalogue, addCultivation, removeCultivation, getCultivation, getCultivations, getCultivationPlan } from './cultivation'
import { addFarm } from './farm'
import { addField } from './field'
import { nanoid } from 'nanoid'
import { addFertilizer, addFertilizerApplication, addFertilizerToCatalogue } from './fertilizer'

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

        it('should throw an error when adding a cultivation with an invalid catalogue ID', async () => {
            const invalid_b_lu_catalogue = 'invalid-catalogue-id';
            const b_sowing_date = '2024-01-01';

            await expect(
                addCultivation(fdm, invalid_b_lu_catalogue, b_id, b_sowing_date)
            ).rejects.toThrow('Cultivation in catalogue does not exist');
        });

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

        it('should handle duplicate cultivation gracefully', async () => {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            });

            const b_sowing_date = '2024-01-01';
            await addCultivation(fdm, b_lu_catalogue, b_id, b_sowing_date);

            // Attempt to add the same cultivation again
            await expect(
                addCultivation(fdm, b_lu_catalogue, b_id, b_sowing_date)
            ).rejects.toThrow('Cultivation already exists');
        });

        it('should throw an error when adding a cultivation with an invalid field ID', async () => {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            });

            const b_sowing_date = '2024-01-01';
            const invalid_b_id = 'invalid-field-id';

            await expect(
                addCultivation(fdm, b_lu_catalogue, invalid_b_id, b_sowing_date)
            ).rejects.toThrow('Field does not exist');
        });

        it('should throw an error when adding a cultivation with an invalid sowing date', async () => {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            });

            const invalid_b_sowing_date = 'invalid-date';

            await expect(
                addCultivation(fdm, b_lu_catalogue, b_id, invalid_b_sowing_date)
            ).rejects.toThrow('Invalid sowing date');
        });

        it('should get cultivations by field ID', async () => {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: 'test-source',
                b_lu_name: 'test-name',
                b_lu_name_en: 'test-name-en',
                b_lu_hcat3: 'test-hcat3',
                b_lu_hcat3_name: 'test-hcat3-name'
            })

            await addCultivation(fdm, b_lu_catalogue, b_id, '2024-01-01')
            await addCultivation(fdm, b_lu_catalogue, b_id, '2024-03-01')

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

    describe('Cultivation Plan', () => {
        let b_id_farm: string;
        let b_id: string;
        let b_lu_catalogue: string;
        let b_lu: string;
        let p_id: string;

        beforeEach(async () => {
            b_id_farm = await addFarm(fdm, 'test farm', 'arable');
            b_id = await addField(
                fdm,
                b_id_farm,
                'test field',
                'test source',
                'POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))',
                '2023-01-01',
                '2024-01-01',
                'owner',
            );

            b_lu_catalogue = nanoid()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: 'test',
                b_lu_name: 'Wheat',
                b_lu_name_en: 'Wheat',
                b_lu_hcat3: '1',
                b_lu_hcat3_name: "test"
            })

            b_lu = await addCultivation(fdm, 'wheat', b_id, '2024-03-01')

            // Add fertilizer to catalogue (needed for fertilizer application)
            const p_id_catalogue = nanoid();
            const p_source = 'custom';
            const p_name_nl = 'Test Fertilizer';
            const p_name_en = 'Test Fertilizer (EN)';
            const p_description = 'This is a test fertilizer';
            const p_acquiring_amount = 1000;
            const p_acquiring_date = new Date();

            await addFertilizerToCatalogue(
                fdm, {
                p_id_catalogue,
                p_source,
                p_name_nl,
                p_name_en,
                p_description,
                p_dm: 37,
                p_density: 20,
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
                p_type_manure: true,
                p_type_mineral: false,
                p_type_compost: false
            })

            p_id = await addFertilizer(
                fdm,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date
            );
        });


        it('should get cultivation plan for a farm', async () => {
            const p_app_id1 = await addFertilizerApplication(fdm, b_id, p_id, 100, 'broadcasting', new Date('2024-03-15'));
            const p_app_id2 = await addFertilizerApplication(fdm, b_id, p_id, 200, 'broadcasting', new Date('2024-04-15'));

            const cultivationPlan = await getCultivationPlan(fdm, b_id_farm);

            expect(cultivationPlan).toBeDefined();
            expect(cultivationPlan.length).toBeGreaterThan(0);

            const wheatCultivation = cultivationPlan.find((c) => c.b_lu_catalogue === 'wheat');
            expect(wheatCultivation).toBeDefined();

            expect(wheatCultivation?.fields.length).toBeGreaterThan(0);
            const fieldInPlan = wheatCultivation?.fields.find(f => f.b_id === b_id);
            expect(fieldInPlan).toBeDefined();


            expect(fieldInPlan?.fertilizer_applications.length).toEqual(2);

            const fertilizerApp1 = fieldInPlan!.fertilizer_applications.find(fa => fa.p_app_id === p_app_id1)

            //Check for some key fertilizer application details (adapt as needed based on your data)
            expect(fertilizerApp1!.p_app_amount).toEqual(100)
            expect(fertilizerApp1!.p_app_method).toEqual('broadcasting')


            const fertilizerApp2 = fieldInPlan!.fertilizer_applications.find(fa => fa.p_app_id === p_app_id2)

            //Check for some key fertilizer application details (adapt as needed based on your data)
            expect(fertilizerApp2!.p_app_amount).toEqual(200)
            expect(fertilizerApp2!.p_app_method).toEqual('broadcasting')

        });


        it('should return an empty array if no cultivations are found for the farm', async () => {
            const emptyPlan = await getCultivationPlan(fdm, nanoid()); // Use a non-existent farm ID
            expect(emptyPlan).toEqual([]);
        });


    });
})