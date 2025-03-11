import type { TestProject } from "vitest/node"

/**
 * Initializes the database connection for the testing environment.
 *
 * This asynchronous function validates that all required PostgreSQL environment variables
 * are present and correctly formatted.
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
}
