import { beforeEach, describe, expect, inject, it } from "vitest"
import {
    addCultivation,
    addCultivationToCatalogue,
    getCultivation,
} from "./cultivation"
import type * as schema from "./db/schema"
import {
    addHarvest,
    checkHarvestDateCompability,
    getHarvest,
    getHarvestableTypeOfCultivation,
    getHarvests,
    removeHarvest,
} from "./harvest"
import { createId } from "./id"
import { type FdmServerType, addFarm, addField, createFdmServer } from "./index"

describe("harvest", () => {
    let fdm: FdmServerType
    let b_lu_once: schema.cultivationsTypeSelect["b_lu"]
    let b_lu_once_nonexistent: schema.cultivationsTypeSelect["b_lu"]
    let b_lu_multiple: schema.cultivationsTypeSelect["b_lu"]
    let b_id_farm: string
    let b_id: string
    let sowing_date: Date
    let terminating_date: Date
    let principal_id: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
        principal_id = createId()

        // Seed data: Add a cultivation to catalogue
        const b_lu_catalogue_once = createId()
        await addCultivationToCatalogue(fdm, {
            b_lu_catalogue: b_lu_catalogue_once,
            b_lu_source: "source",
            b_lu_name: "test cultivation",
            b_lu_name_en: "test cultivation",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat",
            b_lu_hcat3_name: "hcat name",
        })

        // Seed data: Add cultivation to field
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
            new Date("2025-12-31"),
        )

        // Setup cultivation for crop with b_lu_harvestable once
        sowing_date = new Date("2024-03-10")
        terminating_date = new Date("2024-10-10")
        b_lu_once = await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue_once,
            b_id,
            sowing_date,
            terminating_date,
        )

        const b_lu_catalogue_nonexistent = createId() // New catalogue entry
        await addCultivationToCatalogue(fdm, {
            b_lu_catalogue: b_lu_catalogue_nonexistent,
            b_lu_source: "source_nonexistent", // Different source
            b_lu_name: "test cultivation nonexistent", // Different name
            b_lu_name_en: "test cultivation nonexistent",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat",
            b_lu_hcat3_name: "hcat name",
        })

        b_lu_once_nonexistent = await addCultivation(
            // Assign new b_lu
            fdm,
            principal_id,
            b_lu_catalogue_nonexistent, // Using the new catalogue entry
            b_id,
            sowing_date,
            terminating_date,
        )

        // Add a cultivation that can be harvested multiple times
        const b_lu_catalogue_multiple = createId()
        await addCultivationToCatalogue(fdm, {
            b_lu_catalogue: b_lu_catalogue_multiple,
            b_lu_source: "source_multiple",
            b_lu_name: "test cultivation multiple",
            b_lu_name_en: "test cultivation multiple",
            b_lu_harvestable: "multiple",
            b_lu_hcat3: "hcat_multiple",
            b_lu_hcat3_name: "hcat name multiple",
        })
        b_lu_multiple = await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue_multiple,
            b_id,
            sowing_date,
            terminating_date,
        )
    })

    it("should add a harvest", async () => {
        const harvesting_date = new Date(terminating_date)

        const b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu_multiple,
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
            addHarvest(
                fdm,
                principal_id,
                "non_existing_cultivation",
                harvesting_date,
                1000,
            ),
        ).rejects.toThrowError(
            "Principal does not have permission to perform this action",
        )
    })

    it("should get a harvest", async () => {
        const harvesting_date = terminating_date
        const b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu_multiple,
            harvesting_date,
            1000,
        )

        const harvest = await getHarvest(fdm, principal_id, b_id_harvesting)

        expect(harvest.b_id_harvesting).toEqual(b_id_harvesting)
        expect(harvest.b_harvesting_date).toEqual(harvesting_date)
        expect(
            harvest.harvestables[0].harvestable_analyses[0].b_lu_yield,
        ).toEqual(1000)
    })

    it("should have same date for cultivation harvest as for terminate date when harvestable type is 'once'", async () => {
        const harvesting_date = terminating_date

        const cultivation = await getCultivation(fdm, principal_id, b_lu_once)
        const harvests = await getHarvests(fdm, principal_id, b_lu_once)

        expect(harvests.length).toEqual(1)
        expect(cultivation.b_lu_end?.getTime()).toEqual(
            harvests[0].b_harvesting_date?.getTime(),
        )
        expect(harvests[0].b_harvesting_date).toEqual(harvesting_date)
        expect(
            harvests[0].harvestables[0].harvestable_analyses[0].b_lu_yield,
        ).toEqual(null)
    })

    it("should throw error if harvest does not exist", async () => {
        await expect(
            getHarvest(fdm, principal_id, "non_existing_harvest"),
        ).rejects.toThrowError(
            "Principal does not have permission to perform this action",
        )
    })

    it("should get harvests", async () => {
        const harvesting_date = terminating_date

        await addHarvest(
            fdm,
            principal_id,
            b_lu_multiple,
            harvesting_date,
            1000,
        )

        const harvests = await getHarvests(fdm, principal_id, b_lu_once)
        expect(harvests.length).toBeGreaterThanOrEqual(1)
    })

    it("should remove a harvest", async () => {
        const harvesting_date = terminating_date
        const b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu_multiple,
            harvesting_date,
            1000,
        )

        await removeHarvest(fdm, principal_id, b_id_harvesting)

        await expect(
            getHarvest(fdm, principal_id, b_id_harvesting),
        ).rejects.toThrowError(
            "Principal does not have permission to perform this action",
        )

        const harvests = await getHarvests(fdm, principal_id, b_lu_once)
        expect(harvests.length).toEqual(1)
    })

    it("should throw error if harvest does not exist", async () => {
        const nonExistingHarvestId = createId()
        await expect(
            removeHarvest(fdm, principal_id, nonExistingHarvestId),
        ).rejects.toThrowError(
            "Principal does not have permission to perform this action",
        )
    })

    describe("getHarvestableTypeOfCultivation", () => {
        it("should return the harvestable type of a cultivation", async () => {
            const harvestableType = await getHarvestableTypeOfCultivation(
                fdm,
                b_lu_once,
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
                principal_id,
                b_lu_catalogue,
                b_id,
                sowing_date,
                terminating_date,
            )

            const harvestableType = await getHarvestableTypeOfCultivation(
                fdm,
                newCultivation,
            )
            expect(harvestableType).toEqual("multiple")
        })
    })

    describe("checkHarvestDateCompability", () => {
        it("should return harvestable type if date is compatible", async () => {
            const harvesting_date = new Date(sowing_date)
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
            await addCultivationToCatalogue(fdm, {
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: "source3",
                b_lu_name: "test cultivation 3",
                b_lu_name_en: "test cultivation 3",
                b_lu_hcat3: "hcat3",
                b_lu_hcat3_name: "hcat name3",
                b_lu_harvestable: "none",
            })
            const b_lu_none = await addCultivation(
                fdm,
                principal_id,
                b_lu_catalogue,
                b_id,
                sowing_date,
                terminating_date,
            )

            await expect(
                checkHarvestDateCompability(fdm, b_lu_none, terminating_date),
            ).rejects.toThrowError("Cultivation cannot be harvested")
        })

        it("should throw error if harvest date is before sowing date", async () => {
            const harvesting_date = new Date(sowing_date)
            harvesting_date.setDate(sowing_date.getDate() - 10)

            await expect(
                checkHarvestDateCompability(
                    fdm,
                    b_lu_multiple,
                    harvesting_date,
                ),
            ).rejects.toThrowError("Harvest date must be after sowing date")
        })

        it("should throw error if harvest date is after terminating date for multiple harvests", async () => {
            const harvesting_date = new Date(terminating_date)
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
            const harvesting_date = new Date(terminating_date)

            await expect(
                checkHarvestDateCompability(fdm, b_lu_once, harvesting_date),
            ).rejects.toThrowError("Cultivation can only be harvested once")
        })
    })
})
