import { afterAll, beforeEach, describe, expect, inject, it } from "vitest"
import {
    addCultivation,
    addCultivationToCatalogue,
    getCultivation,
    getCultivationPlan,
    getCultivations,
    getCultivationsFromCatalogue,
    removeCultivation,
    updateCultivation,
} from "./cultivation"
import { addFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import {
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
} from "./fertilizer"
import { addField } from "./field"
import { createId } from "./id"

describe("Cultivation Data Model", () => {
    let fdm: FdmServerType
    let b_lu_catalogue: string
    let b_id_farm: string
    let b_id: string
    let b_lu: string
    let b_lu_start: Date
    let principal_id: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        b_lu_catalogue = createId()
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

    describe("Cultivation CRUD", () => {
        beforeEach(async () => {
            // Ensure catalogue entry exists before each test
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: "test-source",
                b_lu_name: "test-name",
                b_lu_name_en: "test-name-en",
                b_lu_harvestable: "once",
                b_lu_hcat3: "test-hcat3",
                b_lu_hcat3_name: "test-hcat3-name",
            })

            b_lu_start = new Date("2024-01-01")
            b_lu = await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                b_lu_start,
            )
        })

        it("should get cultivations from catalogue", async () => {
            const cultivations = await getCultivationsFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(cultivations).toBeDefined()
        })

        it("should add a new cultivation to the catalogue", async () => {
            const b_lu_catalogue = createId()
            const b_lu_source = "custom"
            const b_lu_name = "Test Cultivation"
            const b_lu_name_en = "Test Cultivation (EN)"
            const b_lu_harvestable = "once"
            const b_lu_hcat3 = "test-hcat3"
            const b_lu_hcat3_name = "Test HCAT3 Name"

            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source,
                b_lu_name,
                b_lu_name_en,
                b_lu_harvestable,
                b_lu_hcat3,
                b_lu_hcat3_name,
            })

            const cultivations = await getCultivationsFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(cultivations.length).toBeGreaterThanOrEqual(1)

            const cultivation = cultivations.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(cultivation).toBeDefined()
            expect(cultivation?.b_lu_source).toBe(b_lu_source)
            expect(cultivation?.b_lu_name).toBe(b_lu_name)
            expect(cultivation?.b_lu_name_en).toBe(b_lu_name_en)
            expect(cultivation?.b_lu_hcat3).toBe(b_lu_hcat3)
            expect(cultivation?.b_lu_hcat3_name).toBe(b_lu_hcat3_name)
        })

        it("should throw an error when adding a cultivation with an invalid catalogue ID", async () => {
            const invalid_b_lu_catalogue = "invalid-catalogue-id"
            const b_lu_start = new Date("2024-01-01")

            await expect(
                addCultivation(
                    fdm,
                    principal_id,
                    invalid_b_lu_catalogue,
                    b_id,
                    b_lu_start,
                ),
            ).rejects.toThrow("Exception for addCultivation")
        })

        it("should throw an error when adding a cultivation with invalid b_lu_harvestable", async () => {
            const b_lu_catalogue = createId()

            await expect(
                addCultivationToCatalogue(fdm, {
                    b_lu_catalogue,
                    b_lu_source: "test-source",
                    b_lu_name: "test-name",
                    b_lu_name_en: "test-name-en",
                    b_lu_harvestable: "none",
                    b_lu_hcat3: "test-hcat3",
                    b_lu_hcat3_name: "test-hcat3-name",
                }),
            ).rejects.toThrow()
        })

        it("should add a new cultivation", async () => {
            const b_lu_start = new Date("2024-02-01")
            const new_b_lu = await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                b_lu_start,
            )
            expect(b_lu).toBeDefined()

            const cultivation = await getCultivation(
                fdm,
                principal_id,
                new_b_lu,
            )
            expect(cultivation.b_lu).toBeDefined() // Check existence
            expect(cultivation.b_lu_start).toEqual(b_lu_start) // Check value
        })

        it("should handle duplicate cultivation gracefully", async () => {
            // Attempt to add the same cultivation again
            await expect(
                addCultivation(
                    fdm,
                    principal_id,
                    b_lu_catalogue,
                    b_id,
                    b_lu_start,
                ),
            ).rejects.toThrow("Exception for addCultivation")
        })

        it("should throw an error when adding a cultivation with an invalid field ID", async () => {
            const invalid_b_id = "invalid-field-id"

            await expect(
                addCultivation(
                    fdm,
                    principal_id,
                    b_lu_catalogue,
                    invalid_b_id,
                    b_lu_start,
                ),
            ).rejects.toThrow(
                "Principal does not have permission to perform this action",
            )
        })

        it("should get cultivations by field ID", async () => {
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                new Date("2024-03-01"),
            )

            const cultivations = await getCultivations(fdm, principal_id, b_id)
            expect(cultivations.length).toBe(2)
        })

        it("should remove a cultivation", async () => {
            await removeCultivation(fdm, principal_id, b_lu)

            await expect(
                getCultivation(fdm, principal_id, b_lu),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )

            const cultivations = await getCultivations(fdm, principal_id, b_id)
            expect(cultivations.length).toEqual(0)
        })

        it("should update an existing cultivation", async () => {
            const newSowingDate = new Date("2024-03-01")
            const newCatalogueId = createId()

            // Add the new cultivation to the catalogue first
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: newCatalogueId,
                b_lu_source: "new-source",
                b_lu_name: "new-name",
                b_lu_name_en: "new-name-en",
                b_lu_harvestable: "multiple",
                b_lu_hcat3: "new-hcat3",
                b_lu_hcat3_name: "new-hcat3-name",
            })

            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                newCatalogueId,
                newSowingDate,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_start).toEqual(newSowingDate)
            expect(updatedCultivation.b_lu_catalogue).toEqual(newCatalogueId)
        })

        it("should throw an error when updating a non-existent cultivation", async () => {
            const nonExistentBlu = createId()
            await expect(
                updateCultivation(
                    fdm,
                    principal_id,
                    nonExistentBlu,
                    b_lu_catalogue,
                    new Date(),
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when updating with invalid catalogue id", async () => {
            const nonExistentCatalogueId = createId()

            await expect(
                updateCultivation(
                    fdm,
                    principal_id,
                    b_lu,
                    nonExistentCatalogueId,
                    new Date(),
                ),
            ).rejects.toThrowError("Exception for updateCultivation")
        })

        it("should get a cultivation by ID", async () => {
            const cultivation = await getCultivation(fdm, principal_id, b_lu)
            expect(cultivation.b_lu).toBe(b_lu)
            expect(cultivation.b_lu_catalogue).toBe(b_lu_catalogue)
        })

        it("should update a cultivation with all fields", async () => {
            const newCatalogueId = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: newCatalogueId,
                b_lu_source: "new-source",
                b_lu_name: "new-name",
                b_lu_name_en: "new-name-en",
                b_lu_harvestable: "multiple",
                b_lu_hcat3: "new-hcat3",
                b_lu_hcat3_name: "new-hcat3-name",
            })

            const newSowingDate = new Date("2024-02-01")
            const newTerminateDate = new Date("2024-03-01")

            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                newCatalogueId,
                newSowingDate,
                newTerminateDate,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_start).toEqual(newSowingDate)
            expect(updatedCultivation.b_lu_catalogue).toEqual(newCatalogueId)
            expect(updatedCultivation.b_lu_end).toEqual(newTerminateDate)
        })

        it("should update a cultivation with only the catalogue ID", async () => {
            const newCatalogueId = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: newCatalogueId,
                b_lu_source: "new-source",
                b_lu_name: "new-name",
                b_lu_name_en: "new-name-en",
                b_lu_harvestable: "none",
                b_lu_hcat3: "new-hcat3",
                b_lu_hcat3_name: "new-hcat3-name",
            })

            await updateCultivation(fdm, principal_id, b_lu, newCatalogueId)

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_catalogue).toEqual(newCatalogueId)
        })

        it("should update a cultivation with only the sowing date", async () => {
            const newSowingDate = new Date("2024-02-01")

            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                undefined,
                newSowingDate,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_start).toEqual(newSowingDate)
        })

        it("should update a cultivation with only the terminate date", async () => {
            const newTerminateDate = new Date("2024-12-01")

            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                undefined,
                undefined,
                newTerminateDate,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_end).toEqual(newTerminateDate)
        })

        it("should throw an error when updating with invalid sowing date - before termination date", async () => {
            const newSowingDate = new Date("2024-04-01") //Invalid date - after termination
            const newTerminationDate = new Date("2024-03-01")

            await expect(
                updateCultivation(
                    fdm,
                    principal_id,
                    b_lu,
                    undefined,
                    newSowingDate,
                    newTerminationDate,
                ),
            ).rejects.toThrowError("Exception for updateCultivation")
        })

        it("should throw an error when updating with invalid termination date - before sowing date", async () => {
            const newSowingDate = new Date("2024-03-01")
            const newTerminationDate = new Date("2024-02-01") //Invalid date - before termination

            await expect(
                updateCultivation(
                    fdm,
                    principal_id,
                    b_lu,
                    undefined,
                    newSowingDate,
                    newTerminationDate,
                ),
            ).rejects.toThrowError("Exception for updateCultivation")
        })
    })

    describe("Cultivation Plan", () => {
        let b_id_farm: string
        let b_id: string
        let b_lu_catalogue: string
        let p_id: string

        beforeEach(async () => {
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

            b_lu_catalogue = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: "test",
                b_lu_name: "Wheat",
                b_lu_name_en: "Wheat",
                b_lu_harvestable: "once",
                b_lu_hcat3: "1",
                b_lu_hcat3_name: "test",
            })

            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                new Date("2024-03-01"),
            )

            // Add fertilizer to catalogue (needed for fertilizer application)
            const p_id_catalogue = createId()
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

            p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                1000,
                new Date(),
            )
        })

        it("should get cultivation plan", async () => {
            const plan = await getCultivationPlan(fdm, principal_id, b_id_farm)
            expect(plan).toBeDefined()
            expect(plan.length).toBeGreaterThan(0)
        })

        it("should get cultivation plan for a specific field", async () => {
            const plan = await getCultivationPlan(fdm, principal_id, b_id_farm)
            expect(plan).toBeDefined()
            expect(plan.length).toBeGreaterThan(0)
        })

        it("should get cultivation plan for a specific date range", async () => {
            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-12-31")
            const plan = await getCultivationPlan(fdm, principal_id, b_id_farm)
            expect(plan).toBeDefined()
            expect(plan.length).toBeGreaterThan(0)
        })

        it("should get cultivation plan for a specific field and date range", async () => {
            const startDate = new Date("2024-01-01")
            const endDate = new Date("2024-12-31")
            const plan = await getCultivationPlan(fdm, principal_id, b_id_farm)
            expect(plan).toBeDefined()
            expect(plan.length).toBeGreaterThan(0)
        })
    })
})
