import base from "@playwright/test"
import postgres from "postgres"

function makeDb() {
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
            throw new Error(
                "POSTGRES_PASSWORD environment variable is required",
            )
        })()
    const database =
        process.env.POSTGRES_DB ??
        (() => {
            throw new Error("POSTGRES_DB environment variable is required")
        })()

    return postgres({
        host: host,
        port: port,
        database: database,
        user: user,
        password: password,
        max: 1,
    })
}

let sqlInstance

export const test = base.extend<
    {},
    {
        sql: () => postgres.Sql
    }
>({
    sql: [
        async ({}, use) => {
            await use(() => {
                sqlInstance ??= makeDb()
                return sqlInstance
            })
        },
        { scope: "worker" },
    ],
})
