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
    let b_id_farm: string
    let b_id: string
    let p_id: string
    let p_id_catalogue: string
    let principal_id: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        const farmName = "Test Farm"
        const farmBusinessId = "123456"
        const farmAddress = "123 Farm Lane"
        const farmPostalCode = "12345"
        principal_id = createId()
        b_id_farm = await addFarm(
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
            new Date("2023-12-31"),
        )
    })

    afterAll(async () => {
        // No specific afterAll tasks needed for this suite. Individual tests handle necessary cleanup.
    })

    describe("Fertilizer CRUD", () => {
        beforeEach(async () => {
            // Ensure catalogue entry exists before each test
            p_id_catalogue = createId()
            const p_source = "test-source"
            const p_name_nl = "test-name"
            const p_name_en = "test-name-en"
            const p_description = "This is a test fertilizer"
            const p_dm = 37
            const p_density = 20
            const p_om = 20
            const p_a = 30
            const p_hc = 40
            const p_eom = 50
            const p_eoc = 60
            const p_c_rt = 70
            const p_c_of = 80
            const p_c_if = 90
            const p_c_fr = 100
            const p_cn_of = 110
            const p_n_rt = 120
            const p_n_if = 130
            const p_n_of = 140
            const p_n_wc = 150
            const p_p_rt = 160
            const p_k_rt = 170
            const p_mg_rt = 180
            const p_ca_rt = 190
            const p_ne = 200
            const p_s_rt = 210
            const p_s_wc = 220
            const p_cu_rt = 230
            const p_zn_rt = 240
            const p_na_rt = 250
            const p_si_rt = 260
            const p_b_rt = 270
            const p_mn_rt = 280
            const p_ni_rt = 290
            const p_fe_rt = 300
            const p_mo_rt = 310
            const p_co_rt = 320
            const p_as_rt = 330
            const p_cd_rt = 340
            const pr_cr_rt = 350
            const p_cr_vi = 360
            const p_pb_rt = 370
            const p_hg_rt = 380
            const p_cl_rt = 390
            const p_type_manure = true
            const p_type_mineral = false
            const p_type_compost = false

            await addFertilizerToCatalogue(fdm, {
                p_id_catalogue,
                p_source,
                p_name_nl,
                p_name_en,
                p_description,
                p_dm,
                p_density,
                p_om,
                p_a,
                p_hc,
                p_eom,
                p_eoc,
                p_c_rt,
                p_c_of,
                p_c_if,
                p_c_fr,
                p_cn_of,
                p_n_rt,
                p_n_if,
                p_n_of,
                p_n_wc,
                p_p_rt,
                p_k_rt,
                p_mg_rt,
                p_ca_rt,
                p_ne,
                p_s_rt,
                p_s_wc,
                p_cu_rt,
                p_zn_rt,
                p_na_rt,
                p_si_rt,
                p_b_rt,
                p_mn_rt,
                p_ni_rt,
                p_fe_rt,
                p_mo_rt,
                p_co_rt,
                p_as_rt,
                p_cd_rt,
                pr_cr_rt,
                p_cr_vi,
                p_pb_rt,
                p_hg_rt,
                p_cl_rt,
                p_type_manure,
                p_type_mineral,
                p_type_compost,
            })

            p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                1000,
                new Date(),
            )
        })

        it("should get fertilizers from catalogue", async () => {
            const fertilizers = await getFertilizersFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(fertilizers).toBeDefined()
        })

        it("should add a new fertilizer to the catalogue", async () => {
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_dm = 37
            const p_density = 20
            const p_om = 20
            const p_a = 30
            const p_hc = 40
            const p_eom = 50
            const p_eoc = 60
            const p_c_rt = 70
            const p_c_of = 80
            const p_c_if = 90
            const p_c_fr = 100
            const p_cn_of = 110
            const p_n_rt = 120
            const p_n_if = 130
            const p_n_of = 140
            const p_n_wc = 150
            const p_p_rt = 160
            const p_k_rt = 170
            const p_mg_rt = 180
            const p_ca_rt = 190
            const p_ne = 200
            const p_s_rt = 210
            const p_s_wc = 220
            const p_cu_rt = 230
            const p_zn_rt = 240
            const p_na_rt = 250
            const p_si_rt = 260
            const p_b_rt = 270
            const p_mn_rt = 280
            const p_ni_rt = 290
            const p_fe_rt = 300
            const p_mo_rt = 310
            const p_co_rt = 320
            const p_as_rt = 330
            const p_cd_rt = 340
            const pr_cr_rt = 350
            const p_cr_vi = 360
            const p_pb_rt = 370
            const p_hg_rt = 380
            const p_cl_rt = 390
            const p_type_manure = true
            const p_type_mineral = false
            const p_type_compost = false

            await addFertilizerToCatalogue(fdm, {
                p_id_catalogue,
                p_source,
                p_name_nl,
                p_name_en,
                p_description,
                p_dm,
                p_density,
                p_om,
                p_a,
                p_hc,
                p_eom,
                p_eoc,
                p_c_rt,
                p_c_of,
                p_c_if,
                p_c_fr,
                p_cn_of,
                p_n_rt,
                p_n_if,
                p_n_of,
                p_n_wc,
                p_p_rt,
                p_k_rt,
                p_mg_rt,
                p_ca_rt,
                p_ne,
                p_s_rt,
                p_s_wc,
                p_cu_rt,
                p_zn_rt,
                p_na_rt,
                p_si_rt,
                p_b_rt,
                p_mn_rt,
                p_ni_rt,
                p_fe_rt,
                p_mo_rt,
                p_co_rt,
                p_as_rt,
                p_cd_rt,
                pr_cr_rt,
                p_cr_vi,
                p_pb_rt,
                p_hg_rt,
                p_cl_rt,
                p_type_manure,
                p_type_mineral,
                p_type_compost,
            })

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
                principal_id,
                farmName,
                farmBusinessId,
                farmAddress,
                farmPostalCode,
            )

            // Add fertilizer to catalogue
            const p_source = "custom"
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_dm = 37
            const p_density = 20
            const p_om = 20
            const p_a = 30
            const p_hc = 40
            const p_eom = 50
            const p_eoc = 60
            const p_c_rt = 70
            const p_c_of = 80
            const p_c_if = 90
            const p_c_fr = 100
            const p_cn_of = 110
            const p_n_rt = 120
            const p_n_if = 130
            const p_n_of = 140
            const p_n_wc = 150
            const p_p_rt = 160
            const p_k_rt = 170
            const p_mg_rt = 180
            const p_ca_rt = 190
            const p_ne = 200
            const p_s_rt = 210
            const p_s_wc = 220
            const p_cu_rt = 230
            const p_zn_rt = 240
            const p_na_rt = 250
            const p_si_rt = 260
            const p_b_rt = 270
            const p_mn_rt = 280
            const p_ni_rt = 290
            const p_fe_rt = 300
            const p_mo_rt = 310
            const p_co_rt = 320
            const p_as_rt = 330
            const p_cd_rt = 340
            const pr_cr_rt = 350
            const p_cr_vi = 360
            const p_pb_rt = 370
            const p_hg_rt = 380
            const p_cl_rt = 390
            const p_type_manure = true
            const p_type_mineral = false
            const p_type_compost = false

            await addFertilizerToCatalogue(fdm, {
                p_id_catalogue,
                p_source,
                p_name_nl,
                p_name_en,
                p_description,
                p_dm,
                p_density,
                p_om,
                p_a,
                p_hc,
                p_eom,
                p_eoc,
                p_c_rt,
                p_c_of,
                p_c_if,
                p_c_fr,
                p_cn_of,
                p_n_rt,
                p_n_if,
                p_n_of,
                p_n_wc,
                p_p_rt,
                p_k_rt,
                p_mg_rt,
                p_ca_rt,
                p_ne,
                p_s_rt,
                p_s_wc,
                p_cu_rt,
                p_zn_rt,
                p_na_rt,
                p_si_rt,
                p_b_rt,
                p_mn_rt,
                p_ni_rt,
                p_fe_rt,
                p_mo_rt,
                p_co_rt,
                p_as_rt,
                p_cd_rt,
                pr_cr_rt,
                p_cr_vi,
                p_pb_rt,
                p_hg_rt,
                p_cl_rt,
                p_type_manure,
                p_type_mineral,
                p_type_compost,
            })

            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()

            const new_p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )

            expect(new_p_id).toBeDefined()
            expect(new_p_id).not.toBe(p_id)
        })

        it("should handle duplicate fertilizer gracefully", async () => {
            // Attempt to add the same fertilizer again
            await expect(
                addFertilizer(
                    fdm,
                    principal_id,
                    p_id_catalogue,
                    b_id_farm,
                    1000,
                    new Date(),
                ),
            ).rejects.toThrow("Exception for addFertilizer")
        })

        it("should add a fertilizer application", async () => {
            const p_app_amount = 100
            const p_app_method = "broadcasting"
            const p_app_date = new Date()

            const p_app_id = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                p_app_amount,
                p_app_method,
                p_app_date,
            )

            expect(p_app_id).toBeDefined()
        })

        it("should handle duplicate fertilizer application gracefully", async () => {
            const p_app_amount = 100
            const p_app_method = "broadcasting"
            const p_app_date = new Date()

            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                p_app_amount,
                p_app_method,
                p_app_date,
            )

            // Attempt to add the same fertilizer application again
            await expect(
                addFertilizerApplication(
                    fdm,
                    principal_id,
                    b_id,
                    p_id,
                    p_app_amount,
                    p_app_method,
                    p_app_date,
                ),
            ).rejects.toThrow("Exception for addFertilizerApplication")
        })
    })
})
