import { eq, sql } from "drizzle-orm"
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest"
import {
    enableCultivationCatalogue,
    enableFertilizerCatalogue,
} from "./catalogues"
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
import * as schema from "./db/schema"
import { addFarm } from "./farm"
import type { FdmType } from "./fdm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import {
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
} from "./fertilizer"
import { addField } from "./field"
import { addHarvest } from "./harvest"
import { createId } from "./id"

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
            "nl_01",
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
                b_lu_croprotation: "cereal",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: ["variety1", "variety2"],
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
                b_lu_croprotation: "cereal",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: ["variety1", "variety2"],
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
                    b_lu_harvestable: "invalid-value" as any,
                    b_lu_hcat3: "test-hcat3",
                    b_lu_hcat3_name: "test-hcat3-name",
                    b_lu_croprotation: "cereal",
                    b_lu_yield: 6000,
                    b_lu_hi: 0.4,
                    b_lu_n_harvestable: 4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                    b_lu_rest_oravib: false,
                    b_lu_variety_options: null,
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

        it("should return a validation error if start and end date are the same", async () => {
            await expect(
                addCultivation(
                    fdm,
                    principal_id,
                    b_lu_catalogue,
                    b_id,
                    new Date("2023-06-15T00:00:00.000Z"),
                    new Date("2023-06-15T00:00:00.000Z"),
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
                new Date("2023-05-01"),
                new Date("2023-06-01"),
            )
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
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                new Date("2025-05-01"),
                new Date("2025-06-01"),
            )

            const cultivations = await getCultivations(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2024-02-01"), end: new Date("2024-05-03") },
            )
            expect(cultivations.length).toBe(3)
            expect(cultivations[0].b_lu_start).toEqual(new Date("2024-05-01"))
            expect(cultivations[1].b_lu_start).toEqual(new Date("2024-03-01"))

            const cultivations2 = await getCultivations(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2024-04-01"), end: new Date("2024-08-01") },
            )
            expect(cultivations2.length).toBe(4)
            expect(cultivations2[0].b_lu_start).toEqual(new Date("2024-07-01"))
            expect(cultivations2[1].b_lu_start).toEqual(new Date("2024-05-01"))

            const cultivations3 = await getCultivations(
                fdm,
                principal_id,
                b_id,
                { start: new Date("2024-06-01"), end: new Date("2024-06-01") },
            )
            expect(cultivations3.length).toBe(3)
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

        it("should remove a cultivation and its associated harvests", async () => {
            // Add a harvest to the cultivation using the addHarvest function
            const harvestDate = new Date("2024-01-15")
            await addHarvest(fdm, principal_id, b_lu, harvestDate, 1000) // Add a dummy yield value

            // Verify the harvest exists
            const harvestsBeforeDelete = await fdm
                .select()
                .from(schema.cultivationHarvesting)
                .where(eq(schema.cultivationHarvesting.b_lu, b_lu))
            expect(harvestsBeforeDelete.length).toBe(1)

            // Remove the cultivation
            await removeCultivation(fdm, principal_id, b_lu)

            // Verify the cultivation is removed
            await expect(
                getCultivation(fdm, principal_id, b_lu),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )

            // Verify the associated harvest is also removed
            const harvestsAfterDelete = await fdm
                .select()
                .from(schema.cultivationHarvesting)
                .where(eq(schema.cultivationHarvesting.b_lu, b_lu))
            expect(harvestsAfterDelete.length).toBe(0)

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
                b_lu_croprotation: "cereal",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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
                b_lu_croprotation: "cereal",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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
                true,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_start).toEqual(newSowingDate)
            expect(updatedCultivation.b_lu_catalogue).toEqual(newCatalogueId)
            expect(updatedCultivation.b_lu_end).toEqual(newTerminateDate)
            expect(updatedCultivation.m_cropresidue).toEqual(true)
        })

        it("should update a cultivation with only the catalogue ID", async () => {
            const newCatalogueId = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: newCatalogueId,
                b_lu_source,
                b_lu_name: "test",
                b_lu_name_en: "test",
                b_lu_harvestable: "once",
                b_lu_hcat3: "00000",
                b_lu_hcat3_name: "test",
                b_lu_croprotation: "cereal",
                b_lu_yield: 10000,
                b_lu_hi: 0.35,
                b_lu_n_harvestable: 8,
                b_lu_n_residue: 5,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
            })

            await updateCultivation(fdm, principal_id, b_lu, newCatalogueId)

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_catalogue).toEqual(newCatalogueId)
            expect(updatedCultivation.b_lu_end).toBeNull()
            expect(updatedCultivation.m_cropresidue).toBeNull()
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
                false,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_end).toEqual(newTerminateDate)
            expect(updatedCultivation.m_cropresidue).toEqual(false)
        })

        it("should update a cultivation with only the crop residue", async () => {
            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                undefined,
                undefined,
                undefined,
                true,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.m_cropresidue).toEqual(true)
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

        it("should add a new cultivation with a variety", async () => {
            const b_lu_start = new Date("2024-02-01")
            const b_lu_variety = "variety1"
            const new_b_lu = await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                b_lu_start,
                undefined,
                undefined,
                b_lu_variety,
            )
            expect(new_b_lu).toBeDefined()

            const cultivation = await getCultivation(
                fdm,
                principal_id,
                new_b_lu,
            )
            expect(cultivation.b_lu).toBeDefined() // Check existence
            expect(cultivation.b_lu_start).toEqual(b_lu_start) // Check value
            expect(cultivation.b_lu_variety).toEqual(b_lu_variety)
        })

        it("should throw an error when adding a cultivation with an invalid variety", async () => {
            const b_lu_start = new Date("2024-02-01")
            const invalidVariety = "invalid-variety"
            await expect(
                addCultivation(
                    fdm,
                    principal_id,
                    b_lu_catalogue,
                    b_id,
                    b_lu_start,
                    undefined,
                    undefined,
                    invalidVariety,
                ),
            ).rejects.toThrowError("Exception for addCultivation")
        })

        it("should throw an error when updating with an invalid variety", async () => {
            const invalidVariety = "invalid-variety"
            await expect(
                updateCultivation(
                    fdm,
                    principal_id,
                    b_lu,
                    undefined,
                    undefined,
                    undefined,
                    undefined,
                    invalidVariety,
                ),
            ).rejects.toThrowError("Exception for updateCultivation")
        })

        it("should update an existing cultivation with a variety", async () => {
            const newVariety = "variety1"
            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                undefined,
                undefined,
                undefined,
                undefined,
                newVariety,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_variety).toEqual(newVariety)
        })

        it("should clear an existing variety from a cultivation", async () => {
            // First, add a cultivation with a variety
            const variety = "variety1"
            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                undefined,
                undefined,
                undefined,
                undefined,
                variety,
            )

            const cultivationWithVariety = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(cultivationWithVariety.b_lu_variety).toEqual(variety)

            // Now, clear the variety
            await updateCultivation(
                fdm,
                principal_id,
                b_lu,
                undefined,
                undefined,
                undefined,
                undefined,
                null,
            )

            const updatedCultivation = await getCultivation(
                fdm,
                principal_id,
                b_lu,
            )
            expect(updatedCultivation.b_lu_variety).toBeNull()
        })

        it("should add a new cultivation to the catalogue with variety options", async () => {
            const b_lu_catalogue = createId()
            const b_lu_variety_options = ["v1", "v2"]

            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue,
                b_lu_source: b_lu_source,
                b_lu_name: "Test Cultivation",
                b_lu_name_en: "Test Cultivation (EN)",
                b_lu_harvestable: "once",
                b_lu_hcat3: "test-hcat3",
                b_lu_hcat3_name: "Test HCAT3 Name",
                b_lu_croprotation: "cereal",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: b_lu_variety_options,
            })

            const cultivations = await getCultivationsFromCatalogue(
                fdm,
                principal_id,
                b_id_farm,
            )

            const cultivation = cultivations.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(cultivation).toBeDefined()
            expect(cultivation?.b_lu_variety_options).toEqual(
                b_lu_variety_options,
            )
        })
    })

    describe("Cultivation Plan", () => {
        let b_id_farm: string
        let b_id: string
        let b_lu_catalogue: string
        let p_id: string
        let b_lu_source: string
        let fdm: FdmType
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
                "nl_01",
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
                b_lu_croprotation: "cereal",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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
                    p_app_method_options: null,
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
                    p_cr_rt: 350,
                    p_cr_vi: 360,
                    p_pb_rt: 370,
                    p_hg_rt: 380,
                    p_no3_rt: 400,
                    p_nh4_rt: 410,
                    p_cl_rt: 390,
                    p_ef_nh3: null,
                    p_type: "manure",
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
                b_lu_croprotation: "maize",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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
                "nl_01",
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
                b_lu_croprotation: "maize",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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
                b_lu_croprotation: "maize",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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

        it("should get cultivation plan for a farm when cultivation has only start date and is before timeframe", async () => {
            // Add a cultivation that starts before the timeframe and has no end date
            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue, // Wheat
                b_id,
                new Date("2022-06-15"),
            )

            const timeframe = {
                start: new Date("2023-01-01"),
                end: new Date("2023-12-31"),
            }

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
                timeframe,
            )

            expect(cultivationPlan).toBeDefined()
            expect(cultivationPlan.length).toBe(1)
            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )
            expect(wheatCultivation).toBeDefined() // Wheat cultivation should be found
        })

        it("should correctly calculate the total area of a cultivation across multiple fields", async () => {
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
                "nl_01",
                new Date("2024-01-01"),
            )

            await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue, // Wheat
                b_id2,
                new Date("2024-03-01"),
            )

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
            )

            const wheatCultivation = cultivationPlan.find(
                (c) => c.b_lu_catalogue === b_lu_catalogue,
            )

            const field1 = await fdm
                .select({
                    b_area: sql<number>`ROUND((ST_Area(b_geometry::geography)/10000)::NUMERIC, 2)::FLOAT`,
                })
                .from(schema.fields)
                .where(eq(schema.fields.b_id, b_id))

            const field2 = await fdm
                .select({
                    b_area: sql<number>`ROUND((ST_Area(b_geometry::geography)/10000)::NUMERIC, 2)::FLOAT`,
                })
                .from(schema.fields)
                .where(eq(schema.fields.b_id, b_id2))

            const totalArea = field1[0].b_area + field2[0].b_area

            expect(wheatCultivation?.b_area).toBeCloseTo(totalArea, 2)
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
                b_lu_croprotation: "maize",
                b_lu_yield: 6000,
                b_lu_hi: 0.4,
                b_lu_n_harvestable: 4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
                b_lu_rest_oravib: false,
                b_lu_variety_options: null,
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
                start: new Date("2021-03-01"),
                end: new Date("2022-04-01"),
            }

            const cultivationPlan = await getCultivationPlan(
                fdm,
                principal_id,
                b_id_farm,
                timeframe,
            )

            expect(cultivationPlan).toBeDefined()
            expect(cultivationPlan.length).toBe(0)
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
        } as any // Cast to any to satisfy the FdmServerType interface for mocking purposes

        // Act & Assert
        try {
            await getCultivationsFromCatalogue(mockFdm, principal_id, b_id_farm)
            // Should not reach here
            expect.fail("Expected an error to be thrown")
        } catch (err) {
            type ErrorWithContext = Error & {
                context: { principal_id: string; b_id_farm: string }
            }
            const e = err as ErrorWithContext
            // Check that error was handled correctly
            expect(e).toBeDefined()
            expect(e.message).toContain(
                "Exception for getCultivationsFromCatalogue",
            )
            expect(e.context).toEqual({
                principal_id,
                b_id_farm,
            })
        }
    })
})

describe("buildCultivationTimeframeCondition", () => {
    let fdm: FdmType
    let principal_id: string
    let b_id_farm: string
    let b_id: string
    let b_lu_catalogue: string
    let b_lu_source: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        principal_id = createId()
        b_id_farm = await addFarm(
            fdm,
            principal_id,
            "Test Farm",
            "123456",
            "123 Farm Lane",
            "12345",
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
            "nl_01",
            new Date("2024-01-01"),
        )
        b_lu_source = "custom"
        b_lu_catalogue = createId()
        await enableCultivationCatalogue(
            fdm,
            principal_id,
            b_id_farm,
            b_lu_source,
        )
        await addCultivationToCatalogue(fdm, {
            b_lu_catalogue,
            b_lu_source,
            b_lu_name: "Wheat",
            b_lu_name_en: "Wheat",
            b_lu_harvestable: "once",
            b_lu_hcat3: "1",
            b_lu_hcat3_name: "test",
            b_lu_croprotation: "cereal",
            b_lu_yield: 6000,
            b_lu_hi: 0.4,
            b_lu_n_harvestable: 4,
            b_lu_n_residue: 2,
            b_n_fixation: 0,
            b_lu_rest_oravib: false,
            b_lu_variety_options: null,
        })
    })

    // Test cases for buildCultivationTimeframeCondition (via getCultivations)
    it("should include cultivation if start date is within timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2023-06-15T00:00:00.000Z"),
            new Date("2024-01-15T00:00:00.000Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if end date is within timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2022-12-15T00:00:00.000Z"),
            new Date("2023-06-15T00:00:00.000Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if it spans the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2022-06-15T00:00:00.000Z"),
            new Date("2024-06-15T00:00:00.000Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should exclude cultivation if it is entirely before the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2022-01-01T00:00:00.000Z"),
            new Date("2022-12-31T23:59:59.999Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(0)
    })

    it("should exclude cultivation if it is entirely after the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2024-01-01T00:00:00.000Z"),
            new Date("2024-12-31T23:59:59.999Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(0)
    })

    it("should include cultivation if start date is at the beginning of the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2023-01-01T00:00:00.000Z"),
            new Date("2023-06-15T00:00:00.000Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if start date is at the end of the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2023-12-31T23:59:59.999Z"),
            new Date("2024-06-15T00:00:00.000Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if end date is at the beginning of the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2022-06-15T00:00:00.000Z"),
            new Date("2023-01-01T00:00:00.000Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if end date is at the end of the timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2023-06-15T00:00:00.000Z"),
            new Date("2023-12-31T23:59:59.999Z"),
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if it has only start date and is within timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2023-06-15T00:00:00.000Z"),
            null as any,
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should include cultivation if it has only start date and is before timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2022-06-15T00:00:00.000Z"),
            null as any,
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(1)
    })

    it("should exclude cultivation if it has only start date and is after timeframe", async () => {
        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            new Date("2024-06-15T00:00:00.000Z"),
            null as any,
        )
        const timeframe = {
            start: new Date("2023-01-01T00:00:00.000Z"),
            end: new Date("2023-12-31T23:59:59.999Z"),
        }
        const cultivations = await getCultivations(
            fdm,
            principal_id,
            b_id,
            timeframe,
        )
        expect(cultivations.length).toBe(0)
    })
})
