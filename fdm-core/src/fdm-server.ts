import { drizzle } from "drizzle-orm/postgres-js"
import { migrate } from "drizzle-orm/postgres-js/migrator"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmServerType } from "./fdm-server.d"

export function createFdmServer(
    host: string | undefined,
    port: number | undefined,
    user: string | undefined,
    password: string | (() => string | Promise<string>) | undefined,
    database: string | undefined,
): FdmServerType {
    try {
        // Create drizzle instance
        const db = drizzle({
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

        return db
    } catch (err) {
        throw handleError(err, "Exception for createFdmServer")
    }
}
