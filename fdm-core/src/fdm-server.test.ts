import { sql } from "drizzle-orm"
import { beforeEach, describe, expect, inject, it } from "vitest"
import { createFdmServer, migrateFdmServer } from "./fdm-server"
import type { FdmServerType } from "./fdm-server.d"

describe("Farm Data Model", () => {
    let fdm: FdmServerType

    beforeEach(async () => {
        const host = inject("host")
        const port = inject("port")
        const user = inject("user")
        const password = inject("password")
        const database = inject("database")
        fdm = createFdmServer(host, port, user, password, database)
    })

    describe("Database Connection", () => {
        it("should connect to the database", async () => {
            const statement = sql`SELECT 1 + 1`
            const result = await fdm.execute(statement)
            expect(result).toBeDefined()
        })
    })

    describe("Database Migration", () => {
        it("should migrate the database", async () => {
            const migrationsFolderPath = "src/db/migrations"
            await migrateFdmServer(fdm, migrationsFolderPath)

            // Add assertion to check if migration was successful
            // For example, check if a specific table exists
            const statement = sql`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'fdm-dev'
      `
            const tables = await fdm.execute(statement)
            const tableNames = tables.map((row) => row.table_name)
            expect(tableNames).toContain("farms")
        })
    })
})
