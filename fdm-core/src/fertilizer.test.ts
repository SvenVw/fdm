import {
    afterAll,
    beforeAll,
    beforeEach,
    describe,
    expect,
    inject,
    it,
} from "vitest"
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
} from "./fertilizer"
import { addField } from "./field"
import { createId } from "./id"

describe("Fertilizer Data Model", () => {
    let fdm: FdmServerType
    let p_id_catalogue: string
    let principal_id: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        p_id_catalogue = createId()
        principal_id = "test-principal-id"
    })

    afterAll(async () => {})

    describe("Fertilizer CRUD", () => {
        it("should get fertilizers from catalogue", async () => {
            const fertilizers = await getFertilizersFromCatalogue(fdm)
            expect(fertilizers).toBeDefined()
        })

        it("should add a new fertilizer to the catalogue", async () => {
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            // const p_id_catalogue = 'test-fertilizer-id' // Use a predefined ID for testing
            await addFertilizerToCatalogue(fdm, {
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
                p_type_compost: false,
            })

            const fertilizers = await getFertilizersFromCatalogue(fdm)
            expect(fertilizers.length).toBeGreaterThanOrEqual(1)
            const fertilizer = fertilizers.find(
                (f) => f.p_id_catalogue === p_id_catalogue,
            )
            expect(fertilizer).toBeDefined()
            expect(fertilizer?.p_source).toBe(p_source)
            expect(fertilizer?.p_name_nl).toBe(p_name_nl)
            expect(fertilizer?.p_name_en).toBe(p_name_en)
            expect(fertilizer?.p_description).toBe(p_description)
        })

        it("should add a new fertilizer", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            // Add fertilizer to catalogue
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            await addFertilizerToCatalogue(fdm, {
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
                p_type_compost: false,
            })

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()
            const p_id = await addFertilizer(
                fdm,
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
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            // Add fertilizer to catalogue
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            await addFertilizerToCatalogue(fdm, {
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
                p_type_compost: false,
            })

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()

            // Add two fertilizers to the farm
            await addFertilizer(
                fdm,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )
            await addFertilizer(
                fdm,
                p_id_catalogue,
                b_id_farm,
                1500,
                p_acquiring_date,
            )

            const fertilizers = await getFertilizers(fdm, b_id_farm)
            expect(fertilizers.length).toBe(2)
        })

        it("should remove a fertilizer", async () => {
            const farmName = "Test Farm"
            const farmBusinessId = "123456"
            const farmAddress = "123 Farm Lane"
            const farmPostalCode = "12345"
            const b_id_farm = await addFarm(
                fdm,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            // Add fertilizer to catalogue
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            await addFertilizerToCatalogue(fdm, {
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
                p_type_compost: false,
            })

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()
            const p_id = await addFertilizer(
                fdm,
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
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
                principal_id,
            )

            b_id = await addField(
                fdm,
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
            p_id_catalogue = createId()
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            await addFertilizerToCatalogue(fdm, {
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
                p_type_compost: false,
            })

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()
            p_id = await addFertilizer(
                fdm,
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
                b_id,
                p_id,
                100,
                "broadcasting",
                p_app_date,
            )
            expect(new_p_app_id).toBeDefined()

            const fertilizerApplication = await getFertilizerApplication(
                fdm,
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
                b_id,
                p_id,
                100,
                "broadcasting",
                p_app_date1,
            )

            await updateFertilizerApplication(
                fdm,
                p_app_id,
                b_id,
                p_id,
                200,
                "injection",
                p_app_date2,
            )

            const updatedApplication = await getFertilizerApplication(
                fdm,
                p_app_id,
            )
            expect(updatedApplication?.p_app_amount).toBe(200)
            expect(updatedApplication?.p_app_method).toBe("injection")
            expect(updatedApplication?.p_app_date).toEqual(p_app_date2)
        })

        it("should remove a fertilizer application", async () => {
            const new_p_app_id = await addFertilizerApplication(
                fdm,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )

            await removeFertilizerApplication(fdm, new_p_app_id)

            const deletedApplication = await getFertilizerApplication(
                fdm,
                new_p_app_id,
            )
            expect(deletedApplication).toBeNull()
        })

        it("should get a fertilizer application", async () => {
            const p_app_id = await addFertilizerApplication(
                fdm,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            const fertilizerApplication = await getFertilizerApplication(
                fdm,
                p_app_id,
            )
            expect(fertilizerApplication).toBeDefined()
            expect(fertilizerApplication?.p_app_id).toBe(p_app_id)
        })

        it("should get fertilizer applications for a field", async () => {
            await addFertilizerApplication(
                fdm,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            await addFertilizerApplication(
                fdm,
                b_id,
                p_id,
                150,
                "injection",
                new Date("2024-04-18"),
            )

            const fertilizerApplications = await getFertilizerApplications(
                fdm,
                b_id,
            )
            expect(fertilizerApplications.length).toBeGreaterThanOrEqual(2)
        })
    })
})
