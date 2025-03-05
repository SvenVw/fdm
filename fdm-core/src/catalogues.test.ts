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
} from "./catalogues"
import type { FdmType } from "./fdm"

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
        b_id_farm = "test_farm"

        // Create a test farm
        await fdm.insert(schema.farms).values({
            b_id_farm,
            b_name_farm: "Test Farm",
            b_businessid_farm: "123456",
            b_address_farm: "Test Address",
            b_postalcode_farm: "1234AB",
        })
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
