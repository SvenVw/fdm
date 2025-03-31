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
        it("should throw an error when permission check fails for getEnabledFertilizerCatalogues", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                getEnabledFertilizerCatalogues(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when permission check fails for enableFertilizerCatalogue", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                enableFertilizerCatalogue(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    "custom",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when permission check fails for disableFertilizerCatalogue", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                disableFertilizerCatalogue(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    "custom",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when permission check fails for isFertilizerCatalogueEnabled", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                isFertilizerCatalogueEnabled(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    "custom",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should handle edge cases for disableFertilizerCatalogue", async () => {
            const p_source = "test_disable_source"

            // Case 1: Disabling a fertilizer catalogue that isn't enabled should not throw errors
            // This tests the compound condition in the where clause
            await disableFertilizerCatalogue(
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
            ).toBe(false)

            // Case 2: Enable and then disable with same farm but different source
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

            // Disable with wrong source - should not disable the original
            await disableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                "wrong_source",
            )
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_source,
                ),
            ).toBe(true)

            // Case 3: Test with different farm
            // Create a second test farm
            const secondFarmName = "Second Test Farm"
            const secondFarmBusinessId = "654321"
            const secondFarmAddress = "456 Farm Lane"
            const secondFarmPostalCode = "54321"
            const second_b_id_farm = await addFarm(
                fdm,
                principal_id,
                secondFarmName,
                secondFarmBusinessId,
                secondFarmAddress,
                secondFarmPostalCode,
            )

            // Enable for second farm
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                second_b_id_farm,
                p_source,
            )
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    second_b_id_farm,
                    p_source,
                ),
            ).toBe(true)
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    p_source,
                ),
            ).toBe(true)

            // Disable for first farm should not affect second farm
            await disableFertilizerCatalogue(
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
            ).toBe(false)
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    second_b_id_farm,
                    p_source,
                ),
            ).toBe(true)

            // Disable for second farm
            await disableFertilizerCatalogue(
                fdm,
                principal_id,
                second_b_id_farm,
                p_source,
            )
            expect(
                await isFertilizerCatalogueEnabled(
                    fdm,
                    principal_id,
                    second_b_id_farm,
                    p_source,
                ),
            ).toBe(false)
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
        it("should throw an error when permission check fails", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                getEnabledCultivationCatalogues(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when permission check fails for enableCultivationCatalogue", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                enableCultivationCatalogue(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    "custom",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when permission check fails for disableCultivationCatalogue", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                disableCultivationCatalogue(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    "custom",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should throw an error when permission check fails for isCultivationCatalogueEnabled", async () => {
            const invalidPrincipalId = "invalid_principal"
            await expect(
                isCultivationCatalogueEnabled(
                    fdm,
                    invalidPrincipalId,
                    b_id_farm,
                    "custom",
                ),
            ).rejects.toThrowError(
                "Principal does not have permission to perform this action",
            )
        })

        it("should include context in the error when database query fails", async () => {
            const invalidFdm = {
                ...fdm,
                select: () => {
                    throw new Error("Database error")
                },
            }

            try {
                await getEnabledCultivationCatalogues(
                    invalidFdm,
                    principal_id,
                    b_id_farm,
                )
                // Should not reach here
                expect(true).toBe(false)
            } catch (error) {
                expect(error.message).toContain(
                    "Exception for getEnabledCultivationCatalogues",
                )
                expect(error.context).toBeDefined()
                expect(error.context.principal_id).toBe(principal_id)
                expect(error.context.b_id_farm).toBe(b_id_farm)
            }
        })

        it("should handle errors when disabling cultivation catalogue", async () => {
            const b_lu_source = "test_source"
            const invalidPrincipal = "invalid_principal" // Principal without permissions

            // Enable the catalogue first with valid principal
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Attempt to disable with invalid principal should throw an error
            await expect(
                disableCultivationCatalogue(
                    fdm,
                    invalidPrincipal,
                    b_id_farm,
                    b_lu_source,
                ),
            ).rejects.toThrow()

            // The catalogue should still be enabled
            expect(
                await isCultivationCatalogueEnabled(
                    fdm,
                    principal_id,
                    b_id_farm,
                    b_lu_source,
                ),
            ).toBe(true)
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

        const srmCatalogueOriginal = await getFertilizersCatalogue("srm")
        expect(srmCatalogue.length).toBeGreaterThan(srmCatalogueOriginal.length)

        const brpCatalogue = await fdm
            .select()
            .from(schema.cultivationsCatalogue)
        expect(brpCatalogue.length).toBeGreaterThan(0)

        const brpCatalogueOriginal = await getCultivationCatalogue("brp")
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
            .orderBy(schema.fertilizersCatalogue.p_id_catalogue)
            .limit(1)
        expect(item[0].p_id_catalogue).toBeDefined()
        console.log(`Original hash: ${item[0].hash}`)

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
        console.log(`Synced hash: ${itemSynced[0].hash}`)
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
            .orderBy(schema.cultivationsCatalogue.b_lu_catalogue)
            .limit(1)
        expect(item[0].b_lu_catalogue).toBeDefined()
        console.log(`Original hash: ${item[0].hash}`)

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
        console.log(`Synced hash: ${itemSynced[0].hash}`)
        expect(itemSynced[0].hash).toBe(item[0].hash)
    })
})
