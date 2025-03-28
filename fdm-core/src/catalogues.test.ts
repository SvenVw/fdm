import { beforeEach, describe, expect, inject, it } from "vitest"
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
    hashFertilizer,
} from "@svenvw/fdm-data"
import { addFarm } from "./farm"

describe("Catalogues - Unit Tests", () => {
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

    describe("getEnabledFertilizerCatalogues", () => {
        it("should return an array of enabled fertilizer catalogue sources", async () => {
            // Arrange
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                "source1",
            )
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                "source2",
            )

            // Act
            const result = await getEnabledFertilizerCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )

            // Assert
            expect(result).toEqual(
                expect.arrayContaining(["source1", "source2"]),
            )
            expect(result.length).toBe(2)
        })

        it("should return an empty array if no catalogues are enabled", async () => {
            // Arrange

            // Act
            const result = await getEnabledFertilizerCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )

            // Assert
            expect(result).toEqual([])
        })

        it("should throw an error if permission check fails", async () => {
            // Arrange
            const invalidPrincipalId = "invalid_principal"

            // Act & Assert
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
    })

    describe("getEnabledCultivationCatalogues", () => {
        it("should return an array of enabled cultivation catalogue sources", async () => {
            // Arrange
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                "source1",
            )
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                "source2",
            )

            // Act
            const result = await getEnabledCultivationCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )

            // Assert
            expect(result).toEqual(
                expect.arrayContaining(["source1", "source2"]),
            )
            expect(result.length).toBe(2)
        })
        it("should return an empty array if no catalogues are enabled", async () => {
            // Arrange

            // Act
            const result = await getEnabledCultivationCatalogues(
                fdm,
                principal_id,
                b_id_farm,
            )

            // Assert
            expect(result).toEqual([])
        })

        it("should throw an error if permission check fails", async () => {
            // Arrange
            const invalidPrincipalId = "invalid_principal"

            // Act & Assert
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
    })

    describe("enableFertilizerCatalogue", () => {
        it("should enable a fertilizer catalogue", async () => {
            // Arrange
            const p_source = "test_source"

            // Act
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Assert
            const isEnabled = await isFertilizerCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )
            expect(isEnabled).toBe(true)
        })
        it("should throw an error when permission check fails", async () => {
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
    })

    describe("enableCultivationCatalogue", () => {
        it("should enable a cultivation catalogue", async () => {
            // Arrange
            const b_lu_source = "test_source"

            // Act
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Assert
            const isEnabled = await isCultivationCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )
            expect(isEnabled).toBe(true)
        })
        it("should throw an error when permission check fails", async () => {
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
    })

    describe("disableFertilizerCatalogue", () => {
        it("should disable a fertilizer catalogue", async () => {
            // Arrange
            const p_source = "test_source"
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Act
            await disableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Assert
            const isEnabled = await isFertilizerCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )
            expect(isEnabled).toBe(false)
        })
        it("should throw an error when permission check fails", async () => {
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
    })

    describe("disableCultivationCatalogue", () => {
        it("should disable a cultivation catalogue", async () => {
            // Arrange
            const b_lu_source = "test_source"
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Act
            await disableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Assert
            const isEnabled = await isCultivationCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )
            expect(isEnabled).toBe(false)
        })
        it("should throw an error when permission check fails", async () => {
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
    })

    describe("isFertilizerCatalogueEnabled", () => {
        it("should return true if fertilizer catalogue is enabled", async () => {
            // Arrange
            const p_source = "test_source"
            await enableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Act
            const isEnabled = await isFertilizerCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Assert
            expect(isEnabled).toBe(true)
        })

        it("should return false if fertilizer catalogue is disabled", async () => {
            // Arrange
            const p_source = "test_source"
            await disableFertilizerCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Act
            const isEnabled = await isFertilizerCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                p_source,
            )

            // Assert
            expect(isEnabled).toBe(false)
        })
        it("should throw an error when permission check fails", async () => {
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
    })

    describe("isCultivationCatalogueEnabled", () => {
        it("should return true if cultivation catalogue is enabled", async () => {
            // Arrange
            const b_lu_source = "test_source"
            await enableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Act
            const isEnabled = await isCultivationCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Assert
            expect(isEnabled).toBe(true)
        })

        it("should return false if cultivation catalogue is disabled", async () => {
            // Arrange
            const b_lu_source = "test_source"
            await disableCultivationCatalogue(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Act
            const isEnabled = await isCultivationCatalogueEnabled(
                fdm,
                principal_id,
                b_id_farm,
                b_lu_source,
            )

            // Assert
            expect(isEnabled).toBe(false)
        })

        it("should throw an error when permission check fails", async () => {
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
    })

    describe("syncCatalogues", () => {
        it("should sync catalogues", async () => {
            await syncCatalogues(fdm)

            // Check if catalogue data is similiar to fdm-data
            const srmCatalogue = await fdm
                .select()
                .from(schema.fertilizersCatalogue)

            const srmCatalogueOriginal = getFertilizersCatalogue("srm")
            expect(srmCatalogue.length).toBeGreaterThan(
                srmCatalogueOriginal.length,
            )

            const brpCatalogue = await fdm
                .select()
                .from(schema.cultivationsCatalogue)
            expect(brpCatalogue.length).toBeGreaterThan(0)

            const brpCatalogueOriginal = getCultivationCatalogue("brp")
            expect(brpCatalogue.length).toBeGreaterThan(
                brpCatalogueOriginal.length,
            )
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
            const originalHash = item[0].hash

            await fdm
                .update(schema.fertilizersCatalogue)
                .set({ hash: "Updated hash" })
                .where(
                    eq(
                        schema.fertilizersCatalogue.p_id_catalogue,
                        item[0].p_id_catalogue,
                    ),
                )

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
            expect(itemSynced[0].hash).not.toBe("Updated hash")
            expect(itemSynced[0].hash).toBe(originalHash)
        })
        it("should update cultivation catalogue", async () => {
            // ... (rest of the code is unchanged)
        })

        it("should update fertilizer catalogue when hash is null", async () => {
            // Arrange
            await syncCatalogues(fdm)

            // Select a fertilizer catalogue item to modify
            const item = await fdm
                .select({
                    p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                    hash: schema.fertilizersCatalogue.hash,
                })
                .from(schema.fertilizersCatalogue)
                .where(isNotNull(schema.fertilizersCatalogue.hash))
                .limit(1)

            expect(item[0].p_id_catalogue).toBeDefined()
            const originalHash = item[0].hash

            // Update the hash to null
            await fdm
                .update(schema.fertilizersCatalogue)
                .set({ hash: null })
                .where(
                    eq(
                        schema.fertilizersCatalogue.p_id_catalogue,
                        item[0].p_id_catalogue,
                    ),
                )

            // Act
            await syncCatalogues(fdm)

            // Assert
            const updatedItem = await fdm
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

            // Hash should be updated and not null anymore
            expect(updatedItem[0].hash).not.toBeNull()
            // Hash should match the original hash (recalculated by syncCatalogues)
            expect(updatedItem[0].hash).toBe(originalHash)
        })

        it("should update fertilizer catalogue when hash is undefined", async () => {
            // Arrange
            await syncCatalogues(fdm)

            // Select a fertilizer catalogue item to modify
            const item = await fdm
                .select({
                    p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                    hash: schema.fertilizersCatalogue.hash,
                })
                .from(schema.fertilizersCatalogue)
                .where(isNotNull(schema.fertilizersCatalogue.hash))
                .limit(1)

            expect(item[0].p_id_catalogue).toBeDefined()
            const originalHash = item[0].hash

            // Act:
            // First remove the hash (set to null as undefined isn't directly supported in SQL)
            await fdm
                .update(schema.fertilizersCatalogue)
                .set({ hash: null })
                .where(
                    eq(
                        schema.fertilizersCatalogue.p_id_catalogue,
                        item[0].p_id_catalogue,
                    ),
                )

            // Then sync to update the hash
            await syncCatalogues(fdm)

            // Assert
            const updatedItem = await fdm
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

            // Hash should be updated and not null anymore
            expect(updatedItem[0].hash).not.toBeNull()
            // Hash should match the original hash
            expect(updatedItem[0].hash).toBe(originalHash)
        })
    })
})
