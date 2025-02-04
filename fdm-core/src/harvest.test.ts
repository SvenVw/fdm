import { addFarm, addField, createFdmServer, type FdmServerType } from "./index"
import {
    addCultivation,
    addCultivationToCatalogue,
    getCultivationsFromCatalogue,
} from "./cultivation"
import {
    addHarvest,
    checkHarvestDateCompability,
    getHarvest,
    getHarvestableTypeOfCultivation,
    getHarvests,
} from "./harvest"
import type * as schema from "./db/schema"
import { beforeEach, describe, expect, inject, it } from "vitest"
import { createId } from "./id"

describe("harvest", () => {
    let fdm: FdmServerType
    let b_lu: schema.cultivationsTypeSelect["b_lu"]
    let b_id_farm: string
    let b_id: string
    let sowing_date: Date
    let terminating_date: Date

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        // Seed data: Add a cultivation to catalogue
        const catalogue = await getCultivationsFromCatalogue(fdm)
        if (catalogue.length === 0) {
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: createId(),
                b_lu_source: "source",
                b_lu_name: "test cultivation",
                b_lu_name_en: "test cultivation",
                b_lu_harvestable: "once",
                b_lu_hcat3: "hcat",
                b_lu_hcat3_name: "hcat name",
            })
        }

        const catalogueAfter = await getCultivationsFromCatalogue(fdm)

        // Seed data: Add cultivation to field
        const farmName = "Test Farm"
        const farmBusinessId = "123456"
        const farmAddress = "123 Farm Lane"
        const farmPostalCode = "12345"
        b_id_farm = await addFarm(
            fdm,
            farmName,
            farmBusinessId,
            farmAddress,
            farmPostalCode,
        )

        b_id = await addField(
            fdm,
            b_id_farm,
            "test field",
            "test source",
            "POLYGON((0 0, 1 0, 1 1, 0 1, 0 0))",
            new Date("2023-01-01"),
            "owner",
            new Date("2023-12-31"),
        )

        const sowing_date = new Date()
        terminating_date = new Date()
        terminating_date.setDate(sowing_date.getDate() + 100) // Terminate 100 days after sowing
        b_lu = await addCultivation(
            fdm,
            catalogueAfter[0].b_lu_catalogue,
            b_id,
            sowing_date,
            terminating_date,
        )
    })

    it("should add a harvest", async () => {
        const harvesting_date = new Date(terminating_date)

        const b_id_harvesting = await addHarvest(
            fdm,
            b_lu,
            harvesting_date,
            1000,
            20,
            10,
            15,
            5,
            12,
            3,
        )
        expect(b_id_harvesting).toBeDefined()
    })

    it("should throw error if cultivation does not exist", async () => {
        const harvesting_date = new Date(terminating_date)
        await expect(
            addHarvest(fdm, "non_existing_cultivation", harvesting_date, 1000),
        ).rejects.toThrowError("Exception for addHarvest")
    })

    it("should get a harvest", async () => {
        const harvesting_date = terminating_date
        const b_id_harvesting = await addHarvest(
            fdm,
            b_lu,
            harvesting_date,
            1000,
        )

        const harvest = await getHarvest(fdm, b_id_harvesting)

        expect(harvest.b_id_harvesting).toEqual(b_id_harvesting)
        expect(harvest.b_harvesting_date).toEqual(harvesting_date)
        expect(
            harvest.harvestable[0].harvestableAnalysis[0].b_lu_yield,
        ).toEqual(1000)
    })

    it("should throw error if harvest does not exist", async () => {
        await expect(
            getHarvest(fdm, "non_existing_harvest"),
        ).rejects.toThrowError("Exception for getHarvest")
    })

    it("should get harvests", async () => {
        const harvesting_date = terminating_date

        await addHarvest(fdm, b_lu, harvesting_date, 1000)

        const harvests = await getHarvests(fdm, b_lu)
        expect(harvests.length).toBeGreaterThanOrEqual(1)
    })

    describe("getHarvestableTypeOfCultivation", () => {
        it("should return the harvestable type of a cultivation", async () => {
            const harvestableType = await getHarvestableTypeOfCultivation(
                fdm,
                b_lu,
            )
            expect(harvestableType).toEqual("once") // Based on the seeded cultivation
        })

        it("should throw an error if the cultivation does not exist", async () => {
            await expect(
                getHarvestableTypeOfCultivation(
                    fdm,
                    "non_existing_cultivation",
                ),
            ).rejects.toThrowError("Cultivation does not exist")
        })

        it("should handle different harvestable types", async () => {
            // Add a new cultivation with a different harvestable type
            const b_lu_catalogue = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: "source2",
                b_lu_name: "test cultivation 2",
                b_lu_name_en: "test cultivation 2",
                b_lu_harvestable: "multiple", // Different harvestable type
                b_lu_hcat3: "hcat2",
                b_lu_hcat3_name: "hcat name2",
            })

            const newCultivation = await addCultivation(
                fdm,
                b_lu_catalogue,
                b_id,
                new Date("2024-03-01"),
                new Date("2024-10-12"),
            )

            const harvestableType = await getHarvestableTypeOfCultivation(
                fdm,
                newCultivation,
            )
            expect(harvestableType).toEqual("multiple")
        })
    })

    describe("checkHarvestDateCompability", () => {
        let sowing_date: Date
        let terminating_date: Date
        let b_lu_multiple: schema.cultivationsTypeSelect["b_lu"]

        beforeEach(async () => {
            sowing_date = new Date("2024-03-10")
            terminating_date = new Date()
            terminating_date.setDate(sowing_date.getDate() + 100)

            // Add a cultivation that can be harvested multiple times
            const b_lu_catalogue = createId()
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: "source_multiple",
                b_lu_name: "test cultivation multiple",
                b_lu_name_en: "test cultivation multiple",
                b_lu_harvestable: "multiple",
                b_lu_hcat3: "hcat_multiple",
                b_lu_hcat3_name: "hcat name multiple",
            })
            b_lu_multiple = await addCultivation(
                fdm,
                b_lu_catalogue,
                b_id,
                sowing_date,
                terminating_date,
            )
        })
        it("should return harvestable type if date is compatible", async () => {
            const harvesting_date = new Date()
            harvesting_date.setDate(sowing_date.getDate() + 50)
            const harvestableType = await checkHarvestDateCompability(
                fdm,
                b_lu_multiple,
                harvesting_date,
            )
            expect(harvestableType).toEqual("multiple")
        })

        it("should throw error if cultivation cannot be harvested", async () => {
            const b_lu_catalogue = createId()
            const sowing_date = new Date("2024-03-10")
            const terminating_date = new Date("2024-10-01")
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: "source3",
                b_lu_name: "test cultivation 3",
                b_lu_name_en: "test cultivation 3",
                b_lu_hcat3: "hcat3",
                b_lu_hcat3_name: "hcat name3",
                b_lu_harvestable: "none",
            })
            const nonHarvestableCultivation = await addCultivation(
                fdm,
                b_lu_catalogue,
                b_id,
                sowing_date,
                terminating_date,
            )

            await expect(
                checkHarvestDateCompability(
                    fdm,
                    nonHarvestableCultivation,
                    new Date("2024-08-10"),
                ),
            ).rejects.toThrowError("Cultivation cannot be harvested")
        })

        it("should throw error if harvest date is before sowing date", async () => {
            const harvesting_date = new Date(
                new Date().setDate(sowing_date.getDate() - 10),
            )

            await expect(
                checkHarvestDateCompability(fdm, b_lu, harvesting_date),
            ).rejects.toThrowError("Harvest date must be after sowing date")
        })

        it("should throw error if harvest date is after terminating date for multiple harvests", async () => {
            const harvesting_date = new Date()
            harvesting_date.setDate(terminating_date.getDate() + 10)

            await expect(
                checkHarvestDateCompability(
                    fdm,
                    b_lu_multiple,
                    harvesting_date,
                ),
            ).rejects.toThrowError(
                "Harvest date must be before terminating date for this cultivation",
            )
        })

        it("should throw error if already harvested and only one harvest allowed", async () => {
            const harvesting_date = new Date()
            harvesting_date.setDate(sowing_date.getDate() + 50)
            await addHarvest(fdm, b_lu, harvesting_date, 1000)

            await expect(
                checkHarvestDateCompability(fdm, b_lu, harvesting_date),
            ).rejects.toThrowError("Cultivation can only be harvested once")
        })
    })
})
