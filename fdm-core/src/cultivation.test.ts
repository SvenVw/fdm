import { afterAll, beforeEach, describe, expect, inject, it } from "vitest"
import {
    addCultivation,
    addCultivationToCatalogue,
    buildDateRangeCondition,
    buildDateRangeConditionEnding,
    getCultivation,
    getCultivationPlan,
    getCultivations,
    getCultivationsFromCatalogue,
    isCultivationWithinTimeframe,
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
import {
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
} from "./catalogues"
import { and, gte, isNotNull, lte, or } from "drizzle-orm"
import * as schema from "./db/schema"
import { Timeframe } from "./timeframe"

describe("Cultivation Data Model", () => {
    let fdm: FdmServerType
    let b_lu_catalogue: string
    let b_id_farm: string
    let b_id: string
    let b_lu: string
    let b_lu_start: Date
    let principal_id: string
    let b_lu_source: string

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

        b_lu_source = "custom"
        await enableCultivationCatalogue(
            fdm,
            principal_id,
            b_id_farm,
            b_lu_source,
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
                b_lu_source: b_lu_source,
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
                    b_lu_source: b_lu_source,
                    b_lu_name: "test-name",
                    b_lu_name_en: "test-name-en",
                    b_lu_harvestable: "invalid-value",
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

        it("should get cultivations by field ID within a timeframe", async () => {
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                new Date("2024-03-01"),
            )
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                new Date("2024-05-01"),
                new Date("2024-06-01"),
            )
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                new Date("2024-07-01"),
            )

            const cultivations = await getCultivations(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2024-02-01"), end: new Date("2024-05-03") },
            )
            expect(cultivations.length).toBe(2)
            expect(cultivations[0].b_lu_start).toEqual(new Date("2024-05-01"))
            expect(cultivations[1].b_lu_start).toEqual(new Date("2024-03-01"))

            const cultivations2 = await getCultivations(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2024-04-01"), end: new Date("2024-08-01") },
            )
            expect(cultivations2.length).toBe(2)
            expect(cultivations2[0].b_lu_start).toEqual(new Date("2024-07-01"))
            expect(cultivations2[1].b_lu_start).toEqual(new Date("2024-05-01"))

            const cultivations3 = await getCultivations(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2024-06-01"), end: new Date("2024-06-01") },
            )
            expect(cultivations3.length).toBe(1)
            expect(cultivations3[0].b_lu_start).toEqual(new Date("2024-05-01"))
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
                b_lu_source: b_lu_source,
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
                b_lu_source: b_lu_source,
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
                b_lu_source: b_lu_source,
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
        let b_lu_source: string
        let p_source: string
        let principal_id: string

        beforeEach(async () => {
            const host = inject("host")
            const port = inject("port")
            const user = inject("user")
            const password = inject("password")
            const database = inject("database")
            fdm = createFdmServer(host, port, user, password, database)

            principal_id = createId()

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

            b_lu_source = "custom"
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_id_farm,
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
                b_lu_source: b_lu_source,
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
            const p_name_nl = "Test Fertilizer"
            const p_name_en = "Test Fertilizer (EN)"
            const p_description = "This is a test fertilizer"
            const p_acquiring_amount = 1000
            const p_acquiring_date = new Date()

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

            p_id = await addFertilizer(
                fdm,
                principal_id,
                p_id_catalogue,
                b_id_farm,
                p_acquiring_amount,
                p_acquiring_date,
            )
        })

        it("should get cultivation plan for a farm", async () => {
            const p_app_id1 = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            const p_app_id2 = await addFertilizerApplication(
                fdm,
                principal_id,
                b_id,
                p_id,
                200,
                "broadcasting",
                new Date("2024-04-15"),
            )

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
            )

            expect(cultivationPlan).toBeDefined()
            expect(cultivationPlan.length).toBeGreaterThan(0)

            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(wheatCultivation).toBeDefined()

            expect(wheatCultivation?.fields.length).toBeGreaterThan(0)
            const fieldInPlan = wheatCultivation?.fields.find(
                (f) => f.b_id === b_id,
            )
            expect(fieldInPlan).toBeDefined()

            expect(fieldInPlan?.fertilizer_applications.length).toEqual(2)

            const fertilizerApp1 = fieldInPlan?.fertilizer_applications.find(
                (fa) => fa.p_app_id === p_app_id1,
            )

            //Check for some key fertilizer application details (adapt as needed based on your data)
            expect(fertilizerApp1?.p_app_amount).toEqual(100)
            expect(fertilizerApp1?.p_app_method).toEqual("broadcasting")

            const fertilizerApp2 = fieldInPlan?.fertilizer_applications.find(
                (fa) => fa.p_app_id === p_app_id2,
            )

            //Check for some key fertilizer application details (adapt as needed based on your data)
            expect(fertilizerApp2?.p_app_amount).toEqual(200)
            expect(fertilizerApp2?.p_app_method).toEqual("broadcasting")
        })

        it("should return permission denied if farm does not exist", async () => {
            await expect(
                getCultivationPlan(fdm, principal_id, createId()),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should get cultivation plan for a farm with multiple cultivations and fields", async () => {
            // Add a second cultivation to the catalogue
            const b_lu_catalogue2 = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue2,
                b_lu_source: b_lu_source,
                b_lu_name: "Corn",
                b_lu_name_en: "Corn",
                b_lu_harvestable: "once",
                b_lu_hcat3: "2",
                b_lu_hcat3_name: "test2",
            })

            // Add a second field
            const b_id2 = await addField(
                fdm,
                principal_id,
                b_id_farm,
                "test field 2",
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

            // Add cultivations to both fields, different types
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue, // Wheat
                b_id2,
                new Date("2024-03-01"),
            )
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue2, // Corn
                b_id,
                new Date("2024-05-01"),
            )

            // Add fertilizer applications to both fields and cultivations
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id, // Field 1
                p_id,
                100,
                "broadcasting",
                new Date("2024-03-15"),
            )
            await addFertilizerApplication(
                fdm,
                principal_id,
                b_id2, // Field 2
                p_id,
                200,
                "broadcasting",
                new Date("2024-06-15"),
            )

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(cultivationPlan).toBeDefined()
            expect(cultivationPlan.length).toBe(2) // Expecting 2 types of cultivations (Wheat, Corn)

            // Check Wheat cultivation details
            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(wheatCultivation).toBeDefined()
            expect(wheatCultivation?.fields.length).toBe(2) // Wheat in both fields

            // Check Corn cultivation details
            const cornCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue2,
            )
            expect(cornCultivation).toBeDefined()
            expect(cornCultivation?.fields.length).toBe(1) // Corn only in field 1

            // Verify fertilizer applications - Field 1 (Wheat and Corn)
            const field1InWheatPlan = wheatCultivation?.fields.find(
                (f) => f.b_id === b_id,
            )
            expect(field1InWheatPlan?.fertilizer_applications.length).toEqual(1) // Fertilizer for wheat in field 1

            const field1InCornPlan = cornCultivation?.fields.find(
                (f) => f.b_id === b_id,
            )
            expect(field1InCornPlan?.fertilizer_applications.length).toEqual(1) // Fertilizer for corn in field 1

            // Verify fertilizer applications - Field 2 (Wheat)
            const field2InWheatPlan = wheatCultivation?.fields.find(
                (f) => f.b_id === b_id2,
            )
            expect(field2InWheatPlan?.fertilizer_applications.length).toEqual(1) // Fertilizer for wheat in field 2
        })

        it("should get cultivation plan for a farm when no fertilizer applications are present", async () => {
            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
            )

            expect(cultivationPlan).toBeDefined()
            expect(cultivationPlan.length).toBeGreaterThan(0)

            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(wheatCultivation).toBeDefined()

            expect(wheatCultivation?.fields.length).toBeGreaterThan(0)
            const fieldInPlan = wheatCultivation?.fields.find(
                (f) => f.b_id === b_id,
            )
            expect(fieldInPlan).toBeDefined()

            expect(fieldInPlan?.fertilizer_applications.length).toEqual(0) // No fertilizer applications
        })

        it("should get cultivation plan for a farm within a timeframe", async () => {
            // Add a second cultivation to the catalogue - 'Corn'
            const b_lu_catalogue2 = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue2,
                b_lu_source: b_lu_source,
                b_lu_name: "Corn",
                b_lu_name_en: "Corn",
                b_lu_harvestable: "once",
                b_lu_hcat3: "2",
                b_lu_hcat3_name: "test2",
            })

            // Add a cultivation 'Wheat' within the timeframe
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue, // Wheat
                b_id,
                new Date("2024-03-15"),
            )

            // Add a cultivation 'Corn' outside the timeframe
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue2, // Corn
                b_id,
                new Date("2024-06-15"),
            )

            const timeframe = {
                start: new Date("2024-03-01"),
                end: new Date("2024-04-01"),
            }

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
                timeframe,
            )

            expect(cultivationPlan).toBeDefined()

            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(wheatCultivation).toBeDefined() // Wheat cultivation should be found

            const cornCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue2,
            )
            expect(cornCultivation).toBeUndefined() // Corn cultivation should NOT be found
        })

        it("should get cultivation plan for a farm when timeframe includes all cultivations", async () => {
            // Add a second cultivation to the catalogue - 'Corn'
            const b_lu_catalogue2 = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue2,
                b_lu_source: b_lu_source,
                b_lu_name: "Corn",
                b_lu_name_en: "Corn",
                b_lu_harvestable: "once",
                b_lu_hcat3: "2",
                b_lu_hcat3_name: "test2",
            })

            // Add a cultivation 'Wheat'
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue, // Wheat
                b_id,
                new Date("2024-03-15"),
            )

            // Add a cultivation 'Corn'
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue2, // Corn
                b_id,
                new Date("2024-06-15"),
            )

            const timeframe = {
                start: new Date("2024-01-01"),
                end: new Date("2024-12-31"),
            }

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
                timeframe,
            )

            expect(cultivationPlan).toBeDefined()

            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(wheatCultivation).toBeDefined() // Wheat cultivation should be found

            const cornCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue2,
            )
            expect(cornCultivation).toBeDefined() // Corn cultivation should also be found
        })

        it("should get an empty cultivation plan for a farm when timeframe excludes all cultivations", async () => {
            // Add a second cultivation to the catalogue - 'Corn'
            const b_lu_catalogue2 = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue2,
                b_lu_source: b_lu_source,
                b_lu_name: "Corn",
                b_lu_name_en: "Corn",
                b_lu_harvestable: "once",
                b_lu_hcat3: "2",
                b_lu_hcat3_name: "test2",
            })

            // Add a cultivation 'Wheat' - outside timeframe
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue, // Wheat
                b_id,
                new Date("2024-02-01"),
            )

            // Add a cultivation 'Corn' - also outside timeframe
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue2, // Corn
                b_id,
                new Date("2024-08-01"),
            )

            const timeframe = {
                start: new Date("2025-03-01"),
                end: new Date("2025-04-01"),
            }

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
                timeframe,
            )

            expect(cultivationPlan).toBeDefined()
            expect(cultivationPlan.length).toBe(0) // Expecting empty array as no cultivations within timeframe
        })
    })
})

describe("getCultivationsFromCatalogue error handling", () => {
    const principal_id = "test-principal"
    const b_id_farm = "test-farm"

    it("should handle database errors", async () => {
        // Create a custom fdm implementation that throws an error
        const mockFdm = {
            select: () => {
                throw new Error("Database error")
            },
        }

        // Act & Assert
        try {
            await getCultivationsFromCatalogue(
                mockFdm as any,
                principal_id,
                b_id_farm,
            )
            // Should not reach here
            expect.fail("Expected an error to be thrown")
        } catch (err: any) {
            // Check that error was handled correctly
            expect(err).toBeDefined()
            expect(err.message).toContain(
                "Exception for getCultivationsFromCatalogue",
            )
            expect(err.context).toEqual({
                principal_id,
                b_id_farm,
            })
        }
    })
})

describe("buildDateRangeCondition", () => {
    it("should return undefined when both dateStart and dateEnd are null or undefined", () => {
        expect(buildDateRangeCondition(null, null)).toBeUndefined()
        expect(buildDateRangeCondition(undefined, undefined)).toBeUndefined()
        expect(buildDateRangeCondition(null, undefined)).toBeUndefined()
        expect(buildDateRangeCondition(undefined, null)).toBeUndefined()
    })

    it("should return gte condition when only dateStart is provided", () => {
        const dateStart = new Date("2024-01-01")
        const result = buildDateRangeCondition(dateStart, null)
        expect(result).toEqual(
            gte(schema.cultivationStarting.b_lu_start, dateStart),
        )
    })

    it("should return lte condition when only dateEnd is provided", () => {
        const dateEnd = new Date("2024-12-31")
        const result = buildDateRangeCondition(null, dateEnd)
        expect(result).toEqual(
            lte(schema.cultivationStarting.b_lu_start, dateEnd),
        )
    })

    it("should return and condition when both dateStart and dateEnd are provided", () => {
        const dateStart = new Date("2024-01-01")
        const dateEnd = new Date("2024-12-31")
        const result = buildDateRangeCondition(dateStart, dateEnd)
        expect(result).toEqual(
            and(
                gte(schema.cultivationStarting.b_lu_start, dateStart),
                lte(schema.cultivationStarting.b_lu_start, dateEnd),
            ),
        )
    })
})

describe("buildDateRangeConditionEnding", () => {
    it("should return undefined when both dateStart and dateEnd are null or undefined", () => {
        expect(buildDateRangeConditionEnding(null, null)).toBeUndefined()
        expect(
            buildDateRangeConditionEnding(undefined, undefined),
        ).toBeUndefined()
        expect(buildDateRangeConditionEnding(null, undefined)).toBeUndefined()
        expect(buildDateRangeConditionEnding(undefined, null)).toBeUndefined()
    })

    it("should return or condition with gte when only dateStart is provided", () => {
        const dateStart = new Date("2024-01-01")
        const result = buildDateRangeConditionEnding(dateStart, null)
        expect(result).toEqual(
            or(
                gte(schema.cultivationEnding.b_lu_end, dateStart),
                and(
                    isNotNull(schema.cultivationEnding.b_lu_end),
                    gte(schema.cultivationStarting.b_lu_start, dateStart),
                ),
            ),
        )
    })

    it("should return or condition with lte when only dateEnd is provided", () => {
        const dateEnd = new Date("2024-12-31")
        const result = buildDateRangeConditionEnding(null, dateEnd)
        expect(result).toEqual(
            or(
                lte(schema.cultivationEnding.b_lu_end, dateEnd),
                and(
                    isNotNull(schema.cultivationEnding.b_lu_end),
                    lte(schema.cultivationStarting.b_lu_start, dateEnd),
                ),
            ),
        )
    })

    it("should return and condition with or conditions when both dateStart and dateEnd are provided", () => {
        const dateStart = new Date("2024-01-01")
        const dateEnd = new Date("2024-12-31")
        const result = buildDateRangeConditionEnding(dateStart, dateEnd)
        expect(result).toEqual(
            and(
                or(
                    gte(schema.cultivationEnding.b_lu_end, dateStart),
                    and(
                        isNotNull(schema.cultivationEnding.b_lu_end),
                        gte(schema.cultivationStarting.b_lu_start, dateStart),
                    ),
                ),
                or(
                    lte(schema.cultivationEnding.b_lu_end, dateEnd),
                    and(
                        isNotNull(schema.cultivationEnding.b_lu_end),
                        lte(schema.cultivationStarting.b_lu_start, dateEnd),
                    ),
                ),
            ),
        )
    })
})

describe("isCultivationWithinTimeframe", () => {
    const timeframe: Timeframe = {
        start: new Date("2023-01-01T00:00:00.000Z"),
        end: new Date("2023-12-31T23:59:59.999Z"),
    }

    it("should return true if start date is within timeframe", () => {
        const b_lu_start = new Date("2023-06-15T00:00:00.000Z")
        const b_lu_end = new Date("2024-01-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if end date is within timeframe", () => {
        const b_lu_start = new Date("2022-12-15T00:00:00.000Z")
        const b_lu_end = new Date("2023-06-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if cultivation spans the timeframe", () => {
        const b_lu_start = new Date("2022-06-15T00:00:00.000Z")
        const b_lu_end = new Date("2024-06-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return false if cultivation is entirely before the timeframe", () => {
        const b_lu_start = new Date("2022-01-01T00:00:00.000Z")
        const b_lu_end = new Date("2022-12-31T23:59:59.999Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(false)
    })

    it("should return false if cultivation is entirely after the timeframe", () => {
        const b_lu_start = new Date("2024-01-01T00:00:00.000Z")
        const b_lu_end = new Date("2024-12-31T23:59:59.999Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(false)
    })

    it("should return true if start date is at the beginning of the timeframe", () => {
        const b_lu_start = new Date("2023-01-01T00:00:00.000Z")
        const b_lu_end = new Date("2023-06-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if start date is at the end of the timeframe", () => {
        const b_lu_start = new Date("2023-12-31T23:59:59.999Z")
        const b_lu_end = new Date("2024-06-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if end date is at the beginning of the timeframe", () => {
        const b_lu_start = new Date("2022-06-15T00:00:00.000Z")
        const b_lu_end = new Date("2023-01-01T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if end date is at the end of the timeframe", () => {
        const b_lu_start = new Date("2023-06-15T00:00:00.000Z")
        const b_lu_end = new Date("2023-12-31T23:59:59.999Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if cultivation has only start date and is within timeframe", () => {
        const b_lu_start = new Date("2023-06-15T00:00:00.000Z")
        const b_lu_end = null
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return false if cultivation has only start date and is before timeframe", () => {
        const b_lu_start = new Date("2022-06-15T00:00:00.000Z")
        const b_lu_end = null
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(false)
    })

    it("should return false if cultivation has only start date and is after timeframe", () => {
        const b_lu_start = new Date("2024-06-15T00:00:00.000Z")
        const b_lu_end = null
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(false)
    })

    it("should return false if cultivation has no start date", () => {
        const b_lu_start = null
        const b_lu_end = new Date("2023-06-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(false)
    })

    it("should return true if start and end date are the same as the start of the timeframe", () => {
        const b_lu_start = new Date("2023-01-01T00:00:00.000Z")
        const b_lu_end = new Date("2023-01-01T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if start and end date are the same as the end of the timeframe", () => {
        const b_lu_start = new Date("2023-12-31T23:59:59.999Z")
        const b_lu_end = new Date("2023-12-31T23:59:59.999Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })

    it("should return true if start and end date are the same and within the timeframe", () => {
        const b_lu_start = new Date("2023-06-15T00:00:00.000Z")
        const b_lu_end = new Date("2023-06-15T00:00:00.000Z")
        expect(
            isCultivationWithinTimeframe(b_lu_start, b_lu_end, timeframe),
        ).toBe(true)
    })
})
