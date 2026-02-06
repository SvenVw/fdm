import { eq } from "drizzle-orm"
import { afterAll, beforeAll, describe, expect, inject, it } from "vitest"
import type { FdmAuth } from "../authentication"
import { createFdmAuth } from "../authentication"
import { addCultivation } from "../cultivation"
import * as schema from "../db/schema"
import { addFarm } from "../farm"
import { closeFdm } from "../fdm"
import { createFdmServer } from "../fdm-server"
import type { FdmServerType } from "../fdm-server.d"
import {
    addFertilizer,
    addFertilizerApplication,
    addFertilizerToCatalogue,
} from "../fertilizer"
import { addField } from "../field"
import { createId } from "../id"
import { exportFarm } from "./export"
import { importFarm } from "./import"

describe("Import Logic", () => {
    let fdm: FdmServerType
    let principal_id: string
    let b_id_farm_source: string
    let fdmAuth: FdmAuth
    let exportData: any

    beforeAll(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)

        const googleAuth = {
            clientId: "mock_google_client_id",
            clientSecret: "mock_google_client_secret",
        }
        const microsoftAuth = {
            clientId: "mock_ms_client_id",
            clientSecret: "mock_ms_client_secret",
        }

        fdmAuth = createFdmAuth(fdm, googleAuth, microsoftAuth, undefined, true)

        // Create principal_id
        const uniqueId = createId(8).toLowerCase()
        const user1 = await fdmAuth.api.signUpEmail({
            headers: undefined,
            body: {
                email: `import_user_${uniqueId}@example.com`,
                name: "import_user",
                username: `import_user_${uniqueId}`,
                password: "password",
            },
        })
        principal_id = user1.user.id

        // --- Setup Source Farm ---
        b_id_farm_source = await addFarm(
            fdm,
            principal_id,
            "Source Farm",
            "SRC-123",
            "Source Road 1",
            "1234 SRC",
        )

        // Add a field
        const b_id_field = await addField(
            fdm,
            principal_id,
            b_id_farm_source,
            "Source Field",
            "source-field-id",
            {
                type: "Polygon",
                coordinates: [
                    [
                        [0, 0],
                        [0, 0.01],
                        [0.01, 0.01],
                        [0.01, 0],
                        [0, 0],
                    ],
                ],
            },
            new Date(),
            "nl_01",
        )

        // Add a custom fertilizer
        const p_id_catalogue = await addFertilizerToCatalogue(
            fdm,
            principal_id,
            b_id_farm_source,
            {
                p_name_nl: "Source Compost",
                p_name_en: "Source Compost",
                p_description: "Custom compost from source farm",
                p_app_method_options: ["broadcasting"],
                p_dm: 50,
                p_density: 1000,
                p_om: 200,
                p_a: 500,
                p_hc: 10,
                p_eom: 100,
                p_eoc: 100,
                p_c_rt: 1,
                p_c_of: 1,
                p_c_if: 1,
                p_c_fr: 1,
                p_cn_of: 10,
                p_n_rt: 10,
                p_n_if: 5,
                p_n_of: 5,
                p_n_wc: 1,
                p_p_rt: 5,
                p_k_rt: 8,
                p_mg_rt: 2,
                p_ca_rt: 10,
                p_ne: 5,
                p_s_rt: 2,
                p_s_wc: 1,
                p_cu_rt: 0,
                p_zn_rt: 0,
                p_na_rt: 0,
                p_si_rt: 0,
                p_b_rt: 0,
                p_mn_rt: 0,
                p_ni_rt: 0,
                p_fe_rt: 0,
                p_mo_rt: 0,
                p_co_rt: 0,
                p_as_rt: 0,
                p_cd_rt: 0,
                p_cr_rt: 0,
                p_cr_vi: 0,
                p_pb_rt: 0,
                p_hg_rt: 0,
                p_cl_rt: 0,
                p_ef_nh3: 0,
                p_no3_rt: 0,
                p_nh4_rt: 0,
                p_type: "compost",
                p_type_rvo: "111",
            },
        )

        // Acquire fertilizer
        const p_id = await addFertilizer(
            fdm,
            principal_id,
            p_id_catalogue,
            b_id_farm_source,
            5000,
            new Date(),
        )

        // Apply fertilizer
        await addFertilizerApplication(
            fdm,
            principal_id,
            b_id_field,
            p_id,
            1000,
            "broadcasting",
            new Date(),
        )

        // Add custom cultivation
        const b_lu_catalogue = createId()
        await fdm.insert(schema.cultivationsCatalogue).values({
            b_lu_catalogue: b_lu_catalogue,
            b_lu_source: b_id_farm_source, // Private catalogue
            b_lu_name: "Source Crop",
            b_lu_harvestable: "once",
            b_lu_harvestcat: "HC010",
            b_lu_yield: 6000,
            b_lu_n_harvestable: 4,
            b_lu_n_residue: 2,
            b_lu_dm: 850,
        })

        await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id_field,
            new Date("2025-01-01"),
            new Date("2025-08-01"),
        )

        // Export the data
        exportData = await exportFarm(
            fdm,
            principal_id,
            b_id_farm_source,
            "TestApp",
            "1.0.0",
        )
    })

    afterAll(async () => {
        await closeFdm(fdm)
    })

    it("should import farm data correctly", async () => {
        // Modify farm name to distinguish
        const importData = JSON.parse(JSON.stringify(exportData))
        importData.farm.b_name_farm = "Imported Farm"
        importData.farm.b_businessid_farm = "IMP-456" // Should be allowed to duplicate, but let's change it for clarity

        const result = await importFarm(fdm, principal_id, importData)

        expect(result.b_id_farm).toBeDefined()
        expect(result.b_id_farm).not.toBe(b_id_farm_source)

        // Verify imported farm
        const importedFarms = await fdm
            .select()
            .from(schema.farms)
            .where(eq(schema.farms.b_id_farm, result.b_id_farm))

        expect(importedFarms).toHaveLength(1)
        expect(importedFarms[0].b_name_farm).toBe("Imported Farm")

        // Verify imported fields
        const importedFieldsAcquiring = await fdm
            .select()
            .from(schema.fieldAcquiring)
            .where(eq(schema.fieldAcquiring.b_id_farm, result.b_id_farm))

        expect(importedFieldsAcquiring).toHaveLength(1)

        // Verify imported custom fertilizer
        const importedFertilizers = await fdm
            .select()
            .from(schema.fertilizersCatalogue)
            .where(eq(schema.fertilizersCatalogue.p_source, result.b_id_farm))

        expect(importedFertilizers).toHaveLength(1)
        expect(importedFertilizers[0].p_name_nl).toBe("Source Compost")

        // Verify imported fertilizer application
        // We need to trace from field -> fertilizer application
        const importedFields = await fdm
            .select()
            .from(schema.fields)
            .where(eq(schema.fields.b_id, importedFieldsAcquiring[0].b_id))

        const importedApps = await fdm
            .select()
            .from(schema.fertilizerApplication)
            .where(
                eq(schema.fertilizerApplication.b_id, importedFields[0].b_id),
            )

        expect(importedApps).toHaveLength(1)
    })

    it("should handle progress reporting", async () => {
        const progressSteps: string[] = []
        await importFarm(fdm, principal_id, exportData, (p) => {
            progressSteps.push(p.step)
        })

        expect(progressSteps.length).toBeGreaterThan(0)
        expect(progressSteps).toContain("farm")
        expect(progressSteps).toContain("fields")
    })

    it("should provide useful error messages for invalid data", async () => {
        const invalidData = {
            meta: {
                version: "22",
                exportedAt: "invalid-date", // Invalid format
                source: "test",
            },
            farm: {
                b_id_farm: "test",
                // Missing required fields
            },
        }

        try {
            await importFarm(fdm, principal_id, invalidData)
            expect.fail("Should have thrown a validation error")
        } catch (error: any) {
            expect(error.message).toContain("Validation failed")
            expect(error.message).toContain("at 'meta.exportedAt'")
            // fields array is required
            expect(error.message).toContain("Required at 'fields'")
        }
    })
})
