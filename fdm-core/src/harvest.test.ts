import { eq } from "drizzle-orm"
import { afterAll, beforeEach, describe, expect, inject, it } from "vitest"
import { enableCultivationCatalogue } from "./catalogues"
import { addCultivation, addCultivationToCatalogue } from "./cultivation"
import * as schema from "./db/schema"
import { addFarm } from "./farm"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { addField } from "./field"
import { addHarvest, getHarvest, getHarvests, updateHarvest } from "./harvest"
import { createId } from "./id"

describe("Harvest Data Model", () => {
    let fdm: FdmServerType
    let b_lu_catalogue: string
    let b_id_farm: string
    let b_id: string
    let b_lu: string
    let b_lu_start: Date
    let principal_id: string
    let b_lu_source: string
    let b_id_harvesting: string

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

        await addCultivationToCatalogue(fdm, {
            b_lu_catalogue,
            b_lu_source: b_lu_source,
            b_lu_name: "test-name",
            b_lu_name_en: "test-name-en",
            b_lu_harvestable: "once",
            b_lu_hcat3: "test-hcat3",
            b_lu_hcat3_name: "test-hcat3-name",
            b_lu_croprotation: "cereal",
            b_lu_harvestcat: "HC050",
            b_lu_dm: 500,
            b_lu_yield: 6000,
            b_lu_hi: 0.4,
            b_lu_n_harvestable: 4,
            b_lu_n_residue: 2,
            b_n_fixation: 0,
            b_lu_rest_oravib: false,
            b_lu_variety_options: null,
            b_lu_start_default: "03-15",
            b_date_harvest_default: "09-15",
        })

        await addCultivationToCatalogue(fdm, {
            b_lu_catalogue: `${b_lu_catalogue}-multiple`,
            b_lu_source: b_lu_source,
            b_lu_name: "test-name-multiple",
            b_lu_name_en: "test-name-en-multiple",
            b_lu_harvestable: "multiple",
            b_lu_hcat3: "test-hcat3-multiple",
            b_lu_hcat3_name: "test-hcat3-name-multiple",
            b_lu_croprotation: "grass",
            b_lu_harvestcat: "HC042",
            b_lu_dm: 500,
            b_lu_yield: 2000,
            b_lu_hi: 0.4,
            b_lu_n_harvestable: 12,
            b_lu_n_residue: 2,
            b_n_fixation: 0,
            b_lu_rest_oravib: false,
            b_lu_variety_options: ["Agria"],
            b_lu_start_default: "03-15",
            b_date_harvest_default: "09-15",
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

    afterAll(async () => {
        // Clean up the database after all tests have run
        // You can add any necessary cleanup logic here
    })

    it("should add a new harvest to a cultivation", async () => {
        const harvestDate = new Date("2024-08-01")
        const yieldValue = 6000

        const newHarvestId = await addHarvest(
            fdm,
            principal_id,
            b_lu,
            harvestDate,
            yieldValue,
        )

        expect(newHarvestId).toBeDefined()

        const harvests = await getHarvests(fdm, principal_id, b_lu)
        const newHarvest = harvests.find(
            (h) => h.b_id_harvesting === newHarvestId,
        )

        expect(newHarvest).toBeDefined()
        expect(newHarvest?.b_lu_harvest_date).toEqual(harvestDate)
        expect(
            newHarvest?.harvestable.harvestable_analyses[0].b_lu_yield,
        ).toEqual(yieldValue)
    })

    it("should retrieve a harvest by its ID", async () => {
        b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )
        const harvest = await getHarvest(fdm, principal_id, b_id_harvesting)
        expect(harvest).toBeDefined()
        expect(harvest.b_id_harvesting).toEqual(b_id_harvesting)
    })

    it("should update an existing harvest", async () => {
        b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )
        const newHarvestDate = new Date("2024-07-15")
        const newYield = 5500
        const newNHarvestable = 1.1
        const newNResidue = 2.2
        const newPHarvestable = 3.3
        const newPResidue = 4.4
        const newKHarvestable = 5.5
        const newKResidue = 6.6

        await updateHarvest(
            fdm,
            principal_id,
            b_id_harvesting,
            newHarvestDate,
            newYield,
            newNHarvestable,
            newNResidue,
            newPHarvestable,
            newPResidue,
            newKHarvestable,
            newKResidue,
        )

        const updatedHarvest = await getHarvest(
            fdm,
            principal_id,
            b_id_harvesting,
        )

        expect(updatedHarvest.b_lu_harvest_date).toEqual(newHarvestDate)
        const analysis = updatedHarvest.harvestable.harvestable_analyses[0]
        expect(analysis.b_lu_yield).toEqual(newYield)
        expect(analysis.b_lu_n_harvestable).toEqual(newNHarvestable)
        expect(analysis.b_lu_n_residue).toEqual(newNResidue)
        expect(analysis.b_lu_p_harvestable).toEqual(newPHarvestable)
        expect(analysis.b_lu_p_residue).toEqual(newPResidue)
        expect(analysis.b_lu_k_harvestable).toEqual(newKHarvestable)
        expect(analysis.b_lu_k_residue).toEqual(newKResidue)
    })

    it("should throw an error when updating a non-existent harvest", async () => {
        const nonExistentHarvestId = createId()
        await expect(
            updateHarvest(
                fdm,
                principal_id,
                nonExistentHarvestId,
                new Date(),
                5000,
            ),
        ).rejects.toThrowError(
            "Principal does not have permission to perform this action",
        )
    })

    it("should throw an error when updating a harvest without permission", async () => {
        b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )
        const other_principal_id = createId()
        await expect(
            updateHarvest(
                fdm,
                other_principal_id,
                b_id_harvesting,
                new Date(),
                5000,
            ),
        ).rejects.toThrowError(
            "Principal does not have permission to perform this action",
        )
    })

    it("should throw an error when updating with an invalid harvest date", async () => {
        b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )
        const invalidHarvestDate = new Date("2023-12-31") // Before sowing date
        await expect(
            updateHarvest(
                fdm,
                principal_id,
                b_id_harvesting,
                invalidHarvestDate,
                5000,
            ),
        ).rejects.toThrowError("Exception for updateHarvest")
    })

    it("should update cultivation end date for 'once' harvestable cultivations", async () => {
        b_id_harvesting = await addHarvest(
            fdm,
            principal_id,
            b_lu,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )
        const newHarvestDate = new Date("2024-08-01")
        await updateHarvest(
            fdm,
            principal_id,
            b_id_harvesting,
            newHarvestDate,
            5000,
        )

        const cultivation = await fdm
            .select()
            .from(schema.cultivationEnding)
            .where(eq(schema.cultivationEnding.b_lu, b_lu))
            .limit(1)

        expect(cultivation[0].b_lu_end).toEqual(newHarvestDate)
    })

    it("should not update cultivation end date for 'multiple' harvestable cultivations", async () => {
        const newHarvestDate = new Date("2024-08-01")
        const b_lu_multiple = await addCultivation(
            fdm,
            principal_id,
            `${b_lu_catalogue}-multiple`,
            b_id,
            b_lu_start,
        )

        const b_id_harvesting_multiple = await addHarvest(
            fdm,
            principal_id,
            b_lu_multiple,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )

        await updateHarvest(
            fdm,
            principal_id,
            b_id_harvesting_multiple,
            newHarvestDate,
            5000,
        )

        const cultivation = await fdm
            .select()
            .from(schema.cultivationEnding)
            .where(eq(schema.cultivationEnding.b_lu, b_lu_multiple))
            .limit(1)

        expect(cultivation[0].b_lu_end).not.toEqual(newHarvestDate)
    })

    it("should throw an error when updating harvest date after terminating date for 'multiple' harvestable cultivations", async () => {
        const b_lu_multiple = await addCultivation(
            fdm,
            principal_id,
            `${b_lu_catalogue}-multiple`,
            b_id,
            b_lu_start,
        )

        const b_id_harvesting_multiple = await addHarvest(
            fdm,
            principal_id,
            b_lu_multiple,
            new Date("2024-07-01"),
            5000,
            1,
            2,
            3,
            4,
            5,
            6,
        )

        // Set a terminating date for the cultivation
        await fdm
            .update(schema.cultivationEnding)
            .set({ b_lu_end: new Date("2024-07-30") })
            .where(eq(schema.cultivationEnding.b_lu, b_lu_multiple))

        const newHarvestDate = new Date("2024-08-01") // After terminating date

        await expect(
            updateHarvest(
                fdm,
                principal_id,
                b_id_harvesting_multiple,
                newHarvestDate,
                5000,
            ),
        ).rejects.toThrowError("Exception for updateHarvest")
    })
})
