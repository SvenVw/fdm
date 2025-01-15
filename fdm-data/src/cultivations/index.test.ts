import {
    type FdmServerType,
    getCultivationsFromCatalogue,
    fdmSchema as schema,
} from "@svenvw/fdm-core"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { getCatalogueBrp } from "./catalogues/brp"
import { extendCultivationsCatalogue } from "./index"

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"

describe("Cultivations Catalogue", () => {
    let fdm: FdmServerType

    beforeEach(async () => {
        const requiredEnvVars = [
            "POSTGRES_HOST",
            "POSTGRES_PORT",
            "POSTGRES_USER",
            "POSTGRES_PASSWORD",
            "POSTGRES_DB",
        ]
        for (const envVar of requiredEnvVars) {
            if (!process.env[envVar]) {
                throw new Error(
                    `Missing required environment variable: ${envVar}`,
                )
            }
        }

        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
        if (Number.isNaN(port)) {
            throw new Error("POSTGRES_PORT must be a valid number")
        }
        const user = process.env.POSTGRES_USER
        const password = process.env.POSTGRES_PASSWORD
        const database = process.env.POSTGRES_DB
        const migrationsFolderPath =
            "node_modules/@svenvw/fdm-core/dist/db/migrations"

        try {
            // TODO: Replace workaround with createFdmServer once issue is resolved
            // Current blocker: Migration does not work with fdmServer
            // const fdm = await createFdmServer(
            //     host,
            //     port,
            //     user,
            //     password,
            //     database
            //   )
            // await migrateFdmServer(fdm)

            // Workaround
            fdm = drizzle({
                connection: {
                    user: user,
                    password: password,
                    host: host,
                    port: port,
                    database: database,
                },
                logger: false,
                schema: schema,
            })

            // Run migration
            await migrate(fdm, {
                migrationsFolder: migrationsFolderPath,
                migrationsSchema: "fdm-migrations",
            })
        } catch (error) {
            console.error("Failed to setup database:", error)
            throw error
        }
    })

    afterAll(async () => {
        try {
            // Clean up test data
            await fdm.delete(schema.fieldSowing).execute()
            await fdm.delete(schema.cultivations).execute()
            await fdm.delete(schema.cultivationsCatalogue).execute()
        } catch (error) {
            console.error("Failed to cleanup:", error)
            throw error
        }
    })

    it("should extend cultivations catalogue with brp", async () => {
        // Verify initial state
        const initialCatalogue = await getCultivationsFromCatalogue(fdm)
        expect(initialCatalogue).toHaveLength(0)

        const catalogueName = "brp"
        await extendCultivationsCatalogue(fdm, catalogueName)

        // Retrieve the catalogue from the database to verify
        const dbCatalogue = await getCultivationsFromCatalogue(fdm)

        // Get the expected catalogue
        const expectedCatalogue = getCatalogueBrp()

        // Check if all expected entries are in the database
        expect(dbCatalogue.length).toBeGreaterThanOrEqual(
            expectedCatalogue.length,
        )

        for (const expectedItem of expectedCatalogue) {
            const dbItem = dbCatalogue.find(
                (item: schema.cultivationsCatalogueTypeSelect) =>
                    item.b_lu_catalogue === expectedItem.b_lu_catalogue,
            )
            expect(dbItem).toBeDefined()
            expect(dbItem!.b_lu_source).toBe(expectedItem.b_lu_source)
            expect(dbItem!.b_lu_name).toBe(expectedItem.b_lu_name)
            expect(dbItem!.b_lu_name_en).toBe(expectedItem.b_lu_name_en)
            expect(dbItem!.b_lu_hcat3).toBe(expectedItem.b_lu_hcat3)
            expect(dbItem!.b_lu_hcat3_name).toBe(expectedItem.b_lu_hcat3_name)
        }
    })

    it("should throw error if catalogue name is not recognized", async () => {
        const catalogueName = "invalid_catalogue_name"
        await expect(
            extendCultivationsCatalogue(fdm, catalogueName),
        ).rejects.toThrowError(`catalogue ${catalogueName} is not recognized`)
    })
})
