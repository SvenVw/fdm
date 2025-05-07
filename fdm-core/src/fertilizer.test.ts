import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    inject,
    it,
} from "vitest"
import {
    disableFertilizerCatalogue,
    enableFertilizerCatalogue,
} from "./catalogues"
import { addFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import {
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
    getFertilizer,
    getFertilizerApplication,
    getFertilizerApplications,
    getFertilizers,
    getFertilizersFromCatalogue,
    removeFertilizer,
    removeFertilizerApplication,
    updateFertilizerApplication,
    updateFertilizerFromCatalogue,
} from "./fertilizer"
import { addField } from "./field"
import { createId } from "./id"

describe("Fertilizer Data Model", () => {
    let fdm: FdmServerType
    let principal_id: string
    let b_id_farm: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        principal_id = "test-principal-id"
        const farmName = "Test Farm"
        const farmBusinessId = "123456"
        const farmAddress = "123 Farm Lane"
        const farmPostalCode = "12345"
        b_id_farm = await addFarm(
            fdm,
            principal_id,
            farmName,
            farmBusinessId,
            farmAddress,
            farmPostalCode,
        )

        await enableFertilizerCatalogue(fdm, principal_id, b_id_farm, b_id_farm)
    })

    afterAll(async () => {})

    describe("Fertilizer CRUD", () => {
        it("should get fertilizers from catalogue", async () => {
            const fertilizers = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(fertilizers).toBeDefined()
        })

        it("should add a new fertilizer to the catalogue", async () => {
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_id_catalogue = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                {
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
                    p_type_compost: false,
                },
            )

            const fertilizers = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(fertilizers.length).toBeGreaterThanOrEqual(1)
            const fertilizer = fertilizers.find(
                (f) => f.p_id_catalogue === p_id_catalogue,
            )
            expect(fertilizer).toBeDefined()
            expect(fertilizer?.p_source).toBe(b_id_farm)
            expect(fertilizer?.p_name_nl).toBe(p_name_nl)
            expect(fertilizer?.p_name_en).toBe(p_name_en)
            expect(fertilizer?.p_description).toBe(p_description)
        })

        it("should add a new fertilizer", async () => {
            // Add fertilizer to catalogue
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_id_catalogue = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                {
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
                    p_type_compost: false,
                },
            )

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()
            const p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )
            expect(p_id).toBeDefined()

            const fertilizer = await getFertilizer(fdm, p_id)
            expect(fertilizer.p_id).toBeDefined()
        })

        it("should get fertilizers by farm ID", async () => {
            // Add fertilizer to catalogue
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_id_catalogue = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                {
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
                    p_type_compost: false,
                },
            )

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()

            // Add two fertilizers to the farm
            await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )
            await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                1500,
                p_acquiring_date,
            )

            const fertilizers = await getFertilizers(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(fertilizers.length).toBe(2)
        })

        it("should remove a fertilizer", async () => {
            // Add fertilizer to catalogue
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_id_catalogue = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                {
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
                    p_type_compost: false,
                },
            )

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()
            const p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )
            expect(p_id).toBeDefined()

            await removeFertilizer(fdm, p_id)

            const fertilizer = await getFertilizer(fdm, p_id)
            expect(fertilizer).toBeUndefined()
        })

        it("should return empty array when no catalogues are enabled", async () => {
            const fertilizersWithEnabledCatalogue =
                await getFertilizersFromCatalogue(fdm, principal_id, b_id_farm)
            expect(fertilizersWithEnabledCatalogue).toBeDefined()

            await disableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_id_farm,
            )

            const fertilizersWithNoCatalogue =
                await getFertilizersFromCatalogue(fdm, principal_id, b_id_farm)
            expect(fertilizersWithNoCatalogue).toEqual([])
            expect(fertilizersWithNoCatalogue.length).toBe(0)
        })
    })

    describe("updateFertilizerFromCatalogue", () => {
        let p_id_catalogue: string

        beforeEach(async () => {
            // Add a fertilizer to the catalogue
            p_id_catalogue = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                {
                    p_name_nl: "Test Fertilizer",
                    p_name_en: "Test Fertilizer (EN)",
                    p_description: "This is a test fertilizer",
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
                    p_type_compost: false,
                },
            )
        })

        it("should update an existing fertilizer in the catalogue", async () => {
            const updatedProperties = {
                p_name_nl: "Updated Test Fertilizer",
                p_description: "This is an updated test fertilizer",
                p_dm: 50,
            }

            await updateFertilizerFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_id_catalogue,
                updatedProperties,
            )

            const fertilizers = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            const updatedFertilizer = fertilizers.find(
                (f) => f.p_id_catalogue === p_id_catalogue,
            )
            expect(updatedFertilizer).toBeDefined()
            expect(updatedFertilizer?.p_name_nl).toBe(
                updatedProperties.p_name_nl,
            )
            expect(updatedFertilizer?.p_description).toBe(
                updatedProperties.p_description,
            )
            expect(updatedFertilizer?.p_dm).toBe(updatedProperties.p_dm)
        })

        it("should throw an error if fertilizer does not exist in catalogue", async () => {
            const nonExistingCatalogueId = createId()
            const updatedProperties = {
                p_name_nl: "Updated Test Fertilizer",
            }

            await expect(
                updateFertilizerFromCatalogue(
                    fdm,
                    principal_id,
                    b_id_farm,
                    nonExistingCatalogueId,
                    updatedProperties,
                ),
            ).rejects.toThrow("Exception for updateFertilizerFromCatalogue")
        })

        it("should update a fertilizer with a subset of properties", async () => {
            const updatedProperties = {
                p_name_nl: "Updated Name Only",
            }

            await updateFertilizerFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_id_catalogue,
                updatedProperties,
            )

            const fertilizers = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            const updatedFertilizer = fertilizers.find(
                (f) => f.p_id_catalogue === p_id_catalogue,
            )
            expect(updatedFertilizer).toBeDefined()
            expect(updatedFertilizer?.p_name_nl).toBe(
                updatedProperties.p_name_nl,
            )
            // Check that other properties remain unchanged
            expect(updatedFertilizer?.p_description).toBe(
                "This is a test fertilizer",
            )
            expect(updatedFertilizer?.p_dm).toBe(37)
        })

        it("should throw an error when updating with invalid principal ID", async () => {
            const updatedProperties = {
                p_name_nl: "Updated Test Fertilizer",
            }
            const invalidPrincipalId = "invalid-principal-id"

            await expect(
                updateFertilizerFromCatalogue(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    p_id_catalogue,
                    updatedProperties,
                ),
            ).rejects.toThrow(
                "Principal does not have permission to perform this action",
            )
        })
        it("should update hash after updating a fertilizer", async () => {
            const updatedProperties = {
                p_name_nl: "Updated Test Fertilizer",
                p_description: "This is an updated test fertilizer",
                p_dm: 50,
            }
            const fertilizersBefore = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            const fertilizerBefore = fertilizersBefore.find(
                (f) => f.p_id_catalogue === p_id_catalogue,
            )
            expect(fertilizerBefore).toBeDefined()
            const hashBefore = fertilizerBefore?.hash
            expect(hashBefore).toBeDefined()
            await updateFertilizerFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_id_catalogue,
                updatedProperties,
            )
            const fertilizersAfter = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            const fertilizerAfter = fertilizersAfter.find(
                (f) => f.p_id_catalogue === p_id_catalogue,
            )
            expect(fertilizerAfter).toBeDefined()
            const hashAfter = fertilizerAfter?.hash
            expect(hashAfter).toBeDefined()

            expect(hashBefore).not.toBe(hashAfter)
        })
        it("should throw an error if updating a fertilizer of another farm", async () => {
            const farmName = "Test Farm 2"
            const farmBusinessId = "98765"
            const farmAddress = "456 Farm Lane"
            const farmPostalCode = "54321"
            const b_id_farm2 = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
            )
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm2,
                b_id_farm2,
            )

            // Add a fertilizer to the catalogue
            const p_id_catalogue2 = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm2,
                {
                    p_name_nl: "Test Fertilizer 2",
                    p_name_en: "Test Fertilizer (EN) 2",
                    p_description: "This is a test fertilizer 2",
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
                    p_type_compost: false,
                },
            )
            const updatedProperties = {
                p_name_nl: "Updated Test Fertilizer",
            }
            await expect(
                updateFertilizerFromCatalogue(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_id_catalogue2,
                    updatedProperties,
                ),
            ).rejects.toThrow("Exception for updateFertilizerFromCatalogue")
        })
    })

    describe("Fertilizer Application", () => {
        let b_id: string
        let p_id: string
        let p_id_catalogue: string

        beforeAll(async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
            )

            b_id = await addField(
                fdm,
                principal_id,
                b_id_farm,
                "test field",
                "test source",
                {
                    type: "Polygon",
                    coordinates: [
                        [
                            [30, 10],
                            [40, 40],
                            [20, 40],
                            [10, 20],
                            [30, 10],
                        ],
                    ],
                },
                new Date("2023-01-01"),
                "owner",
                new Date("2024-01-01"),
            )

            // Add fertilizer to catalogue
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_id_catalogue = await addFertilizerToCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                {
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
                    p_type_compost: false,
                },
            )

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()
            p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )
        })

        afterAll(async () => {
            // Clean up the database after each test (optional)
        })

        it("should add a new fertilizer application", async () => {
            const p_app_date = new Date("2024-03-15")

            const new_p_app_id = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                p_app_date,
            )
            expect(new_p_app_id).toBeDefined()

            const fertilizerApplication = await getFertilizerApplication(
                fdm,
                principal_id,
                new_p_app_id,
            )
            expect(fertilizerApplication).toBeDefined()
            expect(fertilizerApplication?.p_id).toBe(p_id)
            expect(fertilizerApplication?.p_app_amount).toBe(100)
            expect(fertilizerApplication?.p_app_method).toBe("broadcasting")
            expect(fertilizerApplication?.p_app_date).toEqual(p_app_date)
        })

        it("should update a fertilizer application", async () => {
            const p_app_date1 = new Date("2024-03-15")
            const p_app_date2 = new Date("2024-04-20")

            const p_app_id = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                p_app_date1,
            )

            await updateFertilizerApplication(
                fdm,
                principal_id,
                p_app_id,
                p_id,
                200,
                "injection",
                p_app_date2,
            )

            const updatedApplication = await getFertilizerApplication(
                fdm,
                principal_id,
                p_app_id,
            )
            expect(updatedApplication?.p_app_amount).toBe(200)
            expect(updatedApplication?.p_app_method).toBe("injection")
            expect(updatedApplication?.p_app_date).toEqual(p_app_date2)
        })

        it("should remove a fertilizer application", async () => {
            const new_p_app_id = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )

            await removeFertilizerApplication(fdm, principal_id, new_p_app_id)

            await expect(
                getFertilizerApplication(fdm, principal_id, new_p_app_id),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should get a fertilizer application", async () => {
            const p_app_id = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            const fertilizerApplication = await getFertilizerApplication(
                fdm,
                principal_id,
                p_app_id,
            )
            expect(fertilizerApplication).toBeDefined()
            expect(fertilizerApplication?.p_app_id).toBe(p_app_id)
        })

        it("should get fertilizer applications for a field", async () => {
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                150,
                "injection",
                new Date("2024-04-18"),
            )

            const fertilizerApplications = await getFertilizerApplications(
                fdm,
                principal_id,
                b_id,
            )
            expect(fertilizerApplications.length).toBeGreaterThanOrEqual(2)
        })

        it("should get fertilizer applications for a field within a timeframe", async () => {
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                150,
                "injection",
                new Date("2024-04-18"),
            )
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                200,
                "injection",
                new Date("2024-05-20"),
            )

            const timeframe = {
                start: new Date("2024-04-01"),
                end: new Date("2024-05-01"),
            }
            const fertilizerApplications = await getFertilizerApplications(
                fdm,
                principal_id,
                b_id,
                timeframe,
            )
            fertilizerApplications.map((application) => {
                expect(
                    application.p_app_date?.getTime(),
                ).toBeGreaterThanOrEqual(timeframe.start.getTime())
                expect(application.p_app_date?.getTime()).toBeLessThanOrEqual(
                    timeframe.end.getTime(),
                )
            })
        })

        it("should return an empty array if no fertilizer applications are found within a timeframe", async () => {
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )

            const fertilizerApplications = await getFertilizerApplications(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2026-05-01"), end: new Date("2026-06-01") },
            )
            expect(fertilizerApplications.length).toBe(0)
        })

        it("should throw an error if trying to add a fertilizer application to a non-existing field", async () => {
            const invalid_b_id = createId()
            await expect(
                addFertilizerApplication(
                    fdm,
                    principal_id,
                    invalid_b_id,
                    p_id,
                    100,
                    "broadcasting",
                    new Date("2024-03-15"),
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error if trying to add a fertilizer application with a non-existing fertilizer", async () => {
            const invalid_p_id = createId()
            await expect(
                addFertilizerApplication(
                    fdm,
                    principal_id,
                    b_id,
                    invalid_p_id,
                    100,
                    "broadcasting",
                    new Date("2024-03-15"),
                ),
            ).rejects.toThrowError("Exception for addFertilizerApplication")
        })
    })
})
