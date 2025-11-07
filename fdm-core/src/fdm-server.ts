/**
 * @file This file is responsible for creating a server instance of the FDM.
 *
 * It provides a `createFdmServer` function that sets up a connection to the PostgreSQL database
 * and returns a Drizzle ORM instance.
 */
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmServerType } from "./fdm-server.d"

/**
 * Creates a new FDM server instance.
 *
 * This function initializes a connection to the PostgreSQL database using the provided credentials
 * and returns a Drizzle ORM instance that can be used to interact with the database.
 *
 * @param host The database host.
 * @param port The database port.
 * @param user The database user.
 * @param password The database password.
 * @param database The name of the database.
 * @param max The maximum number of connections in the connection pool.
 * @returns A new `FdmServerType` instance.
 * @throws An error if the database connection fails.
 */
export function createFdmServer(
    host: string | undefined,
    port: number | undefined,
    user: string | undefined,
    password: string | (() => string | Promise<string>) | undefined,
    database: string | undefined,
    max = 40,
): FdmServerType {
    try {
        const client = postgres({
            user: user,
            password: password,
            host: host,
            port: port,
            database: database,
            max: max,
        })
        // Create drizzle instance
        const db = drizzle(client, {
            logger: false,
            schema: schema,
        })

        return db
    } catch (err) {
        throw handleError(err, "Exception for createFdmServer")
    }
}
