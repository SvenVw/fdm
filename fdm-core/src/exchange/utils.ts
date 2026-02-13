import { readdir } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { zodToJsonSchema } from "zod-to-json-schema"
import { exchangeSchema } from "./schemas"

const __dirname = dirname(fileURLToPath(import.meta.url))

export const SCHEMAS_DIR = resolve(process.cwd(), "schemas")

// Robust migration directory resolution
// 1. If in 'src/exchange/utils.ts' -> '../../src/db/migrations'
// 2. If in 'dist/exchange/utils.js' -> '../db/migrations'
export const MIGRATIONS_DIR = __dirname.includes("dist")
    ? resolve(__dirname, "..", "db", "migrations")
    : resolve(__dirname, "..", "..", "src", "db", "migrations")

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
    // biome-ignore lint/suspicious/noExplicitAny: zod-to-json-schema types are not compatible with Zod 4 yet
    const jsonSchema = zodToJsonSchema(exchangeSchema as any, {
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
