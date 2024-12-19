import { defineConfig } from "drizzle-kit"

export default defineConfig({
  dialect: "postgresql",
  extensionsFilters: ["postgis"],
  schema: "./db/schema.ts",
  out: "./db/migrations",
  migrations: {
    table: "migrations", 
    schema: "fdm-migration"
  },
  dbCredentials: {
    host: process.env.POSTGRES_HOST ?? throw new Error('POSTGRES_HOST is required'),
    port: Number(process.env.POSTGRES_PORT) || 5432,
    database: process.env.POSTGRES_DB_AUTH ?? throw new Error('POSTGRES_DB_AUTH is required'),
    user: process.env.POSTGRES_USER ?? throw new Error('POSTGRES_USER is required'),
    password: process.env.POSTGRES_PASSWORD ?? throw new Error('POSTGRES_PASSWORD is required'),
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  },
});