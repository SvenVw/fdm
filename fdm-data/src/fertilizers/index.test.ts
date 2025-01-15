import {
    type FdmType,
    getFertilizersFromCatalogue,
    fdmSchema as schema,
} from "@svenvw/fdm-core"
import { afterAll, beforeEach, describe, expect, it } from "vitest"
import { extendFertilizersCatalogue } from "."

import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"

describe("Fertilizers Data [server]", () => {
    let fdm: FdmType

    beforeEach(async () => {
        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
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
            await fdm.transaction(async (tx: FdmType) => {
                await tx.delete(schema.fertilizerPicking).execute()
                await tx.delete(schema.fertilizersCatalogue).execute()
            })
        } catch (error) {
            console.error("Failed to cleanup:", error)
            throw error
        }
    })

    it("should throw error if dataset is not recognized", async () => {
        await expect(
            extendFertilizersCatalogue(fdm, "not-existing-dataset"),
        ).rejects.toThrowError(
            "catalogue not-existing-dataset is not recognized",
        )
    })

    it("should extend fertilizers catalogue with srm dataset", async () => {
        await extendFertilizersCatalogue(fdm, "srm")

        const result = await getFertilizersFromCatalogue(fdm)
        expect(result.length).toBeGreaterThan(0)
    })
})
