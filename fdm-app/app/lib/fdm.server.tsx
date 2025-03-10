import { fdmSchema as schema } from "@svenvw/fdm-core"
import { drizzle } from "drizzle-orm/postgres-js"

// Get credentials to connect to db
const host =
    process.env.POSTGRES_HOST ??
    (() => {
        throw new Error("POSTGRES_HOST environment variable is required")
    })()
const port =
    Number(process.env.POSTGRES_PORT) ||
    (() => {
        throw new Error("POSTGRES_PORT environment variable is required")
    })()
const user =
    process.env.POSTGRES_USER ??
    (() => {
        throw new Error("POSTGRES_USER environment variable is required")
    })()
const password =
    process.env.POSTGRES_PASSWORD ??
    (() => {
        throw new Error("POSTGRES_PASSWORD environment variable is required")
    })()
const database =
    process.env.POSTGRES_DB ??
    (() => {
        throw new Error("POSTGRES_DB environment variable is required")
    })()

export const fdm = drizzle({
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
