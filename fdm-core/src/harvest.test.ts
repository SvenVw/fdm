import { afterAll, beforeEach, describe, expect, inject, it } from "vitest"
import { eq } from "drizzle-orm"
import { addHarvest, getHarvest, removeHarvest, updateHarvest } from "./harvest"
import { createFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"
import { addFarm } from "./farm"
import { addField } from "./field"
import { addCultivation, addCultivationToCatalogue } from "./cultivation"
import { createId } from "./id"
import { enableCultivationCatalogue } from "./catalogues"
import * as schema from "./db/schema"

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
            b_lu_yield: 6000,
            b_lu_hi: 0.4,
            b_lu_n_harvestable: 4,
            b_lu_n_residue: 2,
            b_n_fixation: 0,
        })

        b_lu_start = new Date("2024-01-01")
        b_lu = await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id,
            b_lu_start,
        )

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
    })

    afterAll(async () => {
        // Cleanup created data
    })

    it("should update an existing harvest", async () => {
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
})
