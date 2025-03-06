import { describe, it, expect, beforeEach, inject } from "vitest"
import { createFdmServer } from "./fdm-server"
import * as schema from "./db/schema"
import {
    getEnabledFertilizerCatalogues,
    getEnabledCultivationCatalogues,
    enableFertilizerCatalogue,
    enableCultivationCatalogue,
    disableFertilizerCatalogue,
    disableCultivationCatalogue,
    isFertilizerCatalogueEnabled,
    isCultivationCatalogueEnabled,
    syncCatalogues,
} from "./catalogues"
import type { FdmType } from "./fdm"
import { eq, isNotNull } from "drizzle-orm"
import {
    getCultivationCatalogue,
    getFertilizersCatalogue,
} from "@svenvw/fdm-data"
import { addFarm } from "./farm"

describe("Catalogues", () => {
    let fdm: FdmType
    let principal_id: string
    let b_id_farm: string

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
        principal_id = "test_principal"

        // Create a test farm
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
    })

    describe("Fertilizer Catalogues", () => {
        it("should enable and check fertilizer catalogue", async () => {
            const p_source = "test_source"

            // Initially should not be enabled
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_source,
                ),
            ).toBe(false)

            // Enable the catalogue
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Should now be enabled
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_source,
                ),
            ).toBe(true)

            // Should appear in enabled catalogues list
            const enabledCatalogues = await getEnabledFertilizerCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(enabledCatalogues).toContain(p_source)
        })

        it("should disable fertilizer catalogue", async () => {
            const p_source = "test_source"

            // Enable the catalogue
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_source,
                ),
            ).toBe(true)

            // Disable the catalogue
            await disableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Should no longer be enabled
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_source,
                ),
            ).toBe(false)

            // Should not appear in enabled catalogues list
            const enabledCatalogues = await getEnabledFertilizerCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(enabledCatalogues).not.toContain(p_source)
        })

        it("should handle multiple fertilizer catalogues", async () => {
            const sources = ["source1", "source2", "source3"]

            // Enable multiple catalogues
            for (const source of sources) {
                await enableFertilizerCatalogue(
                    fdm,
                    principal_id,
                    b_id_farm,
                    source,
                )
            }

            // Check all are enabled
            const enabledCatalogues = await getEnabledFertilizerCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(enabledCatalogues).toHaveLength(sources.length)
            expect(enabledCatalogues).toEqual(expect.arrayContaining(sources))
        })
    })

    describe("Cultivation Catalogues", () => {
        it("should enable and check cultivation catalogue", async () => {
            const b_lu_source = "test_source"

            // Initially should not be enabled
            expect(
                await isCultivationCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    b_lu_source,
                ),
            ).toBe(false)

            // Enable the catalogue
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Should now be enabled
            expect(
                await isCultivationCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    b_lu_source,
                ),
            ).toBe(true)

            // Should appear in enabled catalogues list
            const enabledCatalogues = await getEnabledCultivationCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(enabledCatalogues).toContain(b_lu_source)
        })

        it("should disable cultivation catalogue", async () => {
            const b_lu_source = "test_source"

            // Enable the catalogue
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )
            expect(
                await isCultivationCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    b_lu_source,
                ),
            ).toBe(true)

            // Disable the catalogue
            await disableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Should no longer be enabled
            expect(
                await isCultivationCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    b_lu_source,
                ),
            ).toBe(false)

            // Should not appear in enabled catalogues list
            const enabledCatalogues = await getEnabledCultivationCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(enabledCatalogues).not.toContain(b_lu_source)
        })

        it("should handle multiple cultivation catalogues", async () => {
            const sources = ["source1", "source2", "source3"]

            // Enable multiple catalogues
            for (const source of sources) {
                await enableCultivationCatalogue(
                    fdm,
                    principal_id,
                    b_id_farm,
                    source,
                )
            }

            // Check all are enabled
            const enabledCatalogues = await getEnabledCultivationCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )
            expect(enabledCatalogues).toHaveLength(sources.length)
            expect(enabledCatalogues).toEqual(expect.arrayContaining(sources))
        })
    })
})

describe("Catalogues syncing", () => {
    let fdm: FdmType

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
    })

    it("should sync catalogues", async () => {
        await syncCatalogues(fdm)

        // Check if catalogue data is similiar to fdm-data
        const srmCatalogue = await fdm
            .select()
            .from(schema.fertilizersCatalogue)

        const srmCatalogueOriginal = getFertilizersCatalogue("srm")
        expect(srmCatalogue.length).toBeGreaterThan(srmCatalogueOriginal.length)

        const brpCatalogue = await fdm
            .select()
            .from(schema.cultivationsCatalogue)
        expect(brpCatalogue.length).toBeGreaterThan(0)

        const brpCatalogueOriginal = getCultivationCatalogue("brp")
        expect(brpCatalogue.length).toBeGreaterThan(brpCatalogueOriginal.length)
    })

    it("should update fertilizer catalogue", async () => {
        await syncCatalogues(fdm)

        // Update a catalogue item
        const item = await fdm
            .select({
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                hash: schema.fertilizersCatalogue.hash,
            })
            .from(schema.fertilizersCatalogue)
            .where(isNotNull(schema.fertilizersCatalogue.hash))
            .limit(1)
        expect(item[0].p_id_catalogue).toBeDefined()

        await fdm
            .update(schema.fertilizersCatalogue)
            .set({ hash: "Updated hash" })
            .where(
                eq(
                    schema.fertilizersCatalogue.p_id_catalogue,
                    item[0].p_id_catalogue,
                ),
            )

        const itemUpdated = await fdm
            .select({
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                hash: schema.fertilizersCatalogue.hash,
            })
            .from(schema.fertilizersCatalogue)
            .where(
                eq(
                    schema.fertilizersCatalogue.p_id_catalogue,
                    item[0].p_id_catalogue,
                ),
            )
        expect(itemUpdated[0].p_id_catalogue).toBeDefined()
        expect(itemUpdated[0].hash).toBe("Updated hash")

        await syncCatalogues(fdm)

        const itemSynced = await fdm
            .select({
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                hash: schema.fertilizersCatalogue.hash,
            })
            .from(schema.fertilizersCatalogue)
            .where(
                eq(
                    schema.fertilizersCatalogue.p_id_catalogue,
                    item[0].p_id_catalogue,
                ),
            )

        expect(itemSynced[0].p_id_catalogue).toBeDefined()
        expect(itemSynced[0].hash).toBe(item[0].hash)
    })

    it("should update cultivation catalogue", async () => {
        await syncCatalogues(fdm)

        // Update a catalogue item
        const item = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                hash: schema.cultivationsCatalogue.hash,
            })
            .from(schema.cultivationsCatalogue)
            .where(isNotNull(schema.cultivationsCatalogue.hash))
            .limit(1)
        expect(item[0].b_lu_catalogue).toBeDefined()

        await fdm
            .update(schema.cultivationsCatalogue)
            .set({ hash: "Updated hash" })
            .where(
                eq(
                    schema.cultivationsCatalogue.b_lu_catalogue,
                    item[0].b_lu_catalogue,
                ),
            )

        const itemUpdated = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                hash: schema.cultivationsCatalogue.hash,
            })
            .from(schema.cultivationsCatalogue)
            .where(
                eq(
                    schema.cultivationsCatalogue.b_lu_catalogue,
                    item[0].b_lu_catalogue,
                ),
            )
        expect(itemUpdated[0].b_lu_catalogue).toBeDefined()
        expect(itemUpdated[0].hash).toBe("Updated hash")

        await syncCatalogues(fdm)

        const itemSynced = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                hash: schema.cultivationsCatalogue.hash,
            })
            .from(schema.cultivationsCatalogue)
            .where(
                eq(
                    schema.cultivationsCatalogue.b_lu_catalogue,
                    item[0].b_lu_catalogue,
                ),
            )
        expect(itemSynced[0].b_lu_catalogue).toBeDefined()
        expect(itemSynced[0].hash).toBe(item[0].hash)
    })
})
