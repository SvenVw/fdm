import { defineConfig } from "drizzle-kit"

export default defineConfig({
    dialect: "postgresql",
    extensionsFilters: ["postgis"],
    schema: "./db/schema.ts",
    out: "./db/migrations",
    migrations: {
        table: "migrations",
        schema: "fdm-migration",
    },
    dbCredentials: {
        host: (() => {
            if (!process.env.POSTGRES_HOST) {
                throw new Error("POSTGRES_HOST is required")
            }
            return process.env.POSTGRES_HOST
        })(),
        port: (() => {
            if (!process.env.POSTGRES_PORT) {
                return 5432
            }
            return Number(process.env.POSTGRES_PORT)
        })(),
        database: (() => {
            if (!process.env.POSTGRES_DB_AUTH) {
                throw new Error("POSTGRES_DB_AUTH is required")
            }
            return process.env.POSTGRES_DB_AUTH
        })(),
        user: (() => {
            if (!process.env.POSTGRES_USER) {
                throw new Error("POSTGRES_USER is required")
            }
            return process.env.POSTGRES_USER
        })(),
        password: (() => {
            if (!process.env.POSTGRES_PASSWORD) {
                throw new Error("POSTGRES_PASSWORD is required")
            }
            return process.env.POSTGRES_PASSWORD
        })(),
        ssl:
            process.env.NODE_ENV === "production"
                ? { rejectUnauthorized: true }
                : false,
    },
})
