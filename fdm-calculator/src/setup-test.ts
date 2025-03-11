import type { TestProject } from "vitest/node"
import postgres from "postgres"
import { runMigration } from "@svenvw/fdm-core"

let client: ReturnType<typeof postgres>
export let migrationsRun = false

/**
 * Initializes the database connection for the testing environment.
 *
 * This asynchronous function validates that all required PostgreSQL environment variables
 * are present and correctly formatted. It creates the database server instance, runs migrations
 * if they haven't been executed yet, and provides the connection details (host, port, user, password,
 * database) to the given test project context.
 *
 * @param project - The testing project context used to supply the database connection details.
 *
 * @throws {Error} If any required environment variable is missing, if the POSTGRES_PORT is invalid,
 * or if database server creation/migration fails.
 *
 * @remark Migrations are only executed once per testing session.
 */
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

    client = postgres({
        host,
        port,
        user,
        password,
        database,
        max: 1,
    })

    if (!migrationsRun) {
        await runMigration(client)
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

export async function teardown() {
    await client.end()
}
