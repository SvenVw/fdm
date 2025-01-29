// globalSetup.ts
import type { FdmServerType } from "./fdm-server"
import { migrateFdmServer } from "./fdm-server" // Adjust path
import { createFdmServer } from "./fdm-server"
import type { TestProject } from "vitest/node"

let fdm: FdmServerType

export let migrationsRun = false

export default async function setup(project: TestProject) {
    const requiredEnvVars = [
        "POSTGRES_HOST",
        "POSTGRES_PORT",
        "POSTGRES_USER",
        "POSTGRES_PASSWORD",
        "POSTGRES_DB",
    ]
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            throw new Error(`Missing required environment variable: ${envVar}`)
        }
    }

    const host = String(process.env.POSTGRES_HOST)
    const port = Number(process.env.POSTGRES_PORT)
    if (Number.isNaN(port)) {
        throw new Error("POSTGRES_PORT must be a valid number")
    }
    const user = String(process.env.POSTGRES_USER)
    const password = String(process.env.POSTGRES_PASSWORD)
    const database = String(process.env.POSTGRES_DB)
    const migrationsFolderPath = "src/db/migrations"

    try {
        fdm = await createFdmServer(host, port, user, password, database)
    } catch (error) {
        throw new Error(`Failed to connect to database: ${error.message}`)
    }

    if (!migrationsRun) {
        await migrateFdmServer(fdm, migrationsFolderPath)
        migrationsRun = true
    }

    project.provide("host", host)
    project.provide("port", port)
    project.provide("user", user)
    project.provide("password", password)
    project.provide("database", database)

}

declare module "vitest" {
    export interface ProvidedContext {
        host: string
        port: number
        user: string
        password: string
        database: string        
    }
}
