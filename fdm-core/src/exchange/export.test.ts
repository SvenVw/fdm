import { beforeAll, describe, expect, inject, it } from "vitest"
import { eq } from "drizzle-orm"
import type { FdmAuth } from "../authentication"
import { createFdmAuth } from "../authentication"
import * as schema from "../db/schema"
import { addFarm } from "../farm"
import { createFdmServer } from "../fdm-server"
import type { FdmServerType } from "../fdm-server.d"
import {
    addFertilizer,
    addFertilizerToCatalogue,
    addFertilizerApplication,
} from "../fertilizer"
import { addField } from "../field"
import { exportFarm } from "./export"
import { createId } from "../id"
import { addSoilAnalysis } from "../soil"
import { addCultivation } from "../cultivation"
import { addHarvest } from "../harvest"
import { addDerogation } from "../derogation"
import { addOrganicCertification } from "../organic"
import { setGrazingIntention } from "../grazing_intention"

describe("Export Logic", () => {
    let fdm: FdmServerType
    let principal_id: string
    let b_id_farm: string
    let fdmAuth: FdmAuth

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
        const user1 = await fdmAuth.api.signUpEmail({
            headers: undefined,
            body: {
                email: "export_user@example.com",
                name: "export_user",
                username: "export_user",
                password: "password",
            },
        })
        principal_id = user1.user.id

        // Create a test farm
        b_id_farm = await addFarm(
            fdm,
            principal_id,
            "Export Test Farm",
            "EX-123",
            "Export Road 1",
            "1234 EX",
        )

        // Add a field
        const b_id_field = await addField(
            fdm,
            principal_id,
            b_id_farm,
            "Test Field",
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
            b_id_farm,
            {
                p_name_nl: "My Custom Compost",
                p_name_en: "My Custom Compost",
                p_description: "",
                p_n_rt: 10.5,
            } as any,
        )

        // Acquire it
        const p_id = await addFertilizer(
            fdm,
            principal_id,
            p_id_catalogue,
            b_id_farm,
            5000,
            new Date(),
        )

        // Add soil analysis
        const a_date = new Date()
        await addSoilAnalysis(
            fdm,
            principal_id,
            a_date,
            "other",
            b_id_field,
            30,
            a_date,
            {
                a_ph_cc: 6.5,
                a_p_al: 35,
            },
        )

        // Add cultivation
        // First we need to make sure the catalogue entry exists.
        // In a real test environment, this might be pre-seeded or we add it.
        // Assuming catalogue 266 exists (Grasland) - let's verify if we need to add it.
        const b_lu_catalogue = "266"
        const b_lu_start = new Date("2025-01-01")
        const b_lu_end = new Date("2025-12-31")

        // Ensure 266 is in the enabled catalogues for the farm
        await fdm.insert(schema.cultivationCatalogueSelecting).values({
            b_id_farm,
            b_lu_source: "rvo", // Mock source
        })

        // Ensure 266 is in the catalogue
        const existingCat = await fdm
            .select()
            .from(schema.cultivationsCatalogue)
            .where(
                eq(schema.cultivationsCatalogue.b_lu_catalogue, b_lu_catalogue),
            )
            .limit(1)
        if (existingCat.length === 0) {
            await fdm.insert(schema.cultivationsCatalogue).values({
                b_lu_catalogue: b_lu_catalogue,
                b_lu_source: "rvo",
                b_lu_name: "Grasland",
                b_lu_harvestable: "multiple",
                b_lu_harvestcat: "HC020",
            })
        }

        const b_lu = await addCultivation(
            fdm,
            principal_id,
            b_lu_catalogue,
            b_id_field,
            b_lu_start,
            b_lu_end,
            true,
        )

        // Apply fertilizer
        await addFertilizerApplication(
            fdm,
            principal_id,
            b_id_field,
            p_id,
            1000,
            "slotted coulter",
            new Date(),
        )

        // Harvest
        await addHarvest(fdm, principal_id, b_lu, b_lu_end, {
            b_lu_yield: 5000,
            b_lu_cp: 150,
        })

        // Add derogation
        await addDerogation(fdm, principal_id, b_id_farm, 2024)

        // Add organic certification
        await addOrganicCertification(
            fdm,
            principal_id,
            b_id_farm,
            "NL-BIO-01.528-0002967.2025.001",
            "026281",
            new Date("2024-01-01"),
            new Date("2025-12-31"),
        )

        // Add grazing intention
        await setGrazingIntention(fdm, principal_id, b_id_farm, 2024, true)
    })

    it("should export all farm data correctly", async () => {
        const data = await exportFarm(fdm, principal_id, b_id_farm)

        // Validate against JSON Schema using Ajv
        const { readFile } = await import("node:fs/promises")
        const { resolve } = await import("node:path")
        const { getLatestMigrationVersion } = await import("./utils")
        const Ajv = (await import("ajv/dist/2019")).default
        const addFormats = (await import("ajv-formats")).default

        const versionNum = await getLatestMigrationVersion()
        const schemaPath = resolve(process.cwd(), "schemas", `v${versionNum}.json`)
        const schemaRaw = await readFile(schemaPath, "utf-8")
        const jsonSchema = JSON.parse(schemaRaw)

        const ajv = new Ajv({ allErrors: true, strict: false })
        addFormats(ajv)
        
        const validate = ajv.compile(jsonSchema)
        const valid = validate(data)

        if (!valid) {
            console.error("AJV Validation Errors:", JSON.stringify(validate.errors, null, 2))
        }
        expect(valid).toBe(true)

        expect(data.meta.version).toBeDefined()
        expect(data.farm.b_id_farm).toBe(b_id_farm)
        expect(data.farm.b_name_farm).toBe("Export Test Farm")

        expect(data.fields).toHaveLength(1)
        expect(data.fields[0].b_name).toBe("Test Field")

        expect(data.fertilizers_catalogue).toHaveLength(1)
        expect(data.fertilizers_catalogue[0].p_name_nl).toBe(
            "My Custom Compost",
        )

        expect(data.fertilizer_acquiring).toHaveLength(1)
        expect(data.fertilizers).toHaveLength(1)

        expect(data.soil_analysis).toHaveLength(1)
        expect(data.soil_sampling).toHaveLength(1)

        expect(data.cultivations).toHaveLength(1)
        expect(data.cultivation_starting).toHaveLength(1)
        expect(data.fertilizer_applying).toHaveLength(1)
        expect(data.cultivation_harvesting).toHaveLength(1)
        expect(data.cultivation_ending).toHaveLength(1)

        expect(data.harvestables).toHaveLength(1)
        expect(data.harvestable_sampling).toHaveLength(1)
        expect(data.harvestable_analyses).toHaveLength(1)

        expect(data.derogations).toHaveLength(1)
        expect(data.derogation_applying).toHaveLength(1)
        expect(data.organic_certifications).toHaveLength(1)
        expect(data.organic_certifications_holding).toHaveLength(1)
        expect(data.intending_grazing).toHaveLength(1)
    })

    it("should throw an error if principal does not have read access", async () => {
        const other_principal_id = createId()

        await expect(
            exportFarm(fdm, other_principal_id, b_id_farm),
        ).rejects.toThrow()
    })
})
