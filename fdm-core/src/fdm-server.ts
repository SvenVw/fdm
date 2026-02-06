import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmServerType } from "./fdm-server.d"

export function createFdmServer(
    host: string | undefined,
    port: number | undefined,
    user: string | undefined,
    password: string | (() => string | Promise<string>) | undefined,
    database: string | undefined,
    max = process.env.NODE_ENV === "test" ? 1 : 40,
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

        // Attach the client to the drizzle instance for closing
        // @ts-ignore
        db.$client = client

        return db
    } catch (err) {
        throw handleError(err, "Exception for createFdmServer")
    }
}
