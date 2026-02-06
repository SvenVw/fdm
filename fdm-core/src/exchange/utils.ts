import { readdir } from "node:fs/promises"
import { resolve } from "node:path"
import { zodToJsonSchema } from "zod-to-json-schema"
import { exchangeSchema } from "./schemas"

export const SCHEMAS_DIR = resolve(process.cwd(), "schemas")
export const MIGRATIONS_DIR = resolve(process.cwd(), "src", "db", "migrations")

export async function getLatestMigrationVersion() {
    const files = await readdir(MIGRATIONS_DIR)
    const migrationFiles = files.filter(
        (f) => f.endsWith(".sql") && /^\d{4}_/.test(f),
    )
    if (migrationFiles.length === 0) return "0"

    migrationFiles.sort()
    const latest = migrationFiles[migrationFiles.length - 1]
    const match = latest.match(/^(\d{4})_/)
    if (!match) return "0"

    return Number.parseInt(match[1], 10).toString()
}

export function generateExchangeJsonSchema(versionNum: string) {
    const capitalizedVersion = `V${versionNum}`
    const jsonSchema = zodToJsonSchema(exchangeSchema, {
        name: `FdmExchangeSchema${capitalizedVersion}`,
        target: "jsonSchema2019-09",
        definitionPath: "definitions",
        $refStrategy: "none",
    })

    // Explicitly add the $schema identifier
    return {
        $schema: "https://json-schema.org/draft/2019-09/schema",
        ...jsonSchema,
    }
}
