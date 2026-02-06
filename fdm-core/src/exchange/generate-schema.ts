import { readFile, writeFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import {
    generateExchangeJsonSchema,
    getLatestMigrationVersion,
    SCHEMAS_DIR,
} from "./utils"

const PACKAGE_JSON_PATH = resolve(process.cwd(), "package.json")

async function main() {
    // 1. Get version from migrations
    const versionNum = await getLatestMigrationVersion()
    const schemaVersion = `v${versionNum}`

    // Also get package version for logging/source info
    const packageJsonRaw = await readFile(PACKAGE_JSON_PATH, "utf-8")
    const packageJson = JSON.parse(packageJsonRaw)
    const packageVersion = packageJson.version

    console.log(
        `Generating JSON Schema for version ${schemaVersion} (package: ${packageVersion})...`,
    )

    // 2. Generate Schema
    const jsonSchema = generateExchangeJsonSchema(versionNum)

    // 3. Write to file
    const filename = `${schemaVersion}.json`
    const outputPath = join(SCHEMAS_DIR, filename)

    const schemaString = JSON.stringify(jsonSchema, null, 2)
    await writeFile(outputPath, schemaString)

    console.log(`Schema written to ${outputPath}`)
}

main().catch((err) => {
    console.error("Error generating schema:", err)
    process.exit(1)
})
