import { deepStrictEqual } from "node:assert"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import {
    generateExchangeJsonSchema,
    getLatestMigrationVersion,
    SCHEMAS_DIR,
} from "./utils"

async function main() {
    try {
        const versionNum = await getLatestMigrationVersion()
        const schemaVersion = `v${versionNum}`
        const filename = `${schemaVersion}.json`
        const schemaPath = join(SCHEMAS_DIR, filename)

        // 1. Generate current schema in memory
        const generatedSchema = generateExchangeJsonSchema(versionNum)

        // 2. Read checked-in schema
        // biome-ignore lint/suspicious/noExplicitAny: checkedInSchema can be any object
        let checkedInSchema: any = {}
        try {
            const raw = await readFile(schemaPath, "utf-8")
            checkedInSchema = JSON.parse(raw)
        } catch (_err) {
            console.error(
                `❌ Schema file ${filename} is missing in /schemas directory.`,
            )
            console.error(
                `👉 Run 'pnpm generate:schemas' in fdm-core to create it.`,
            )
            process.exit(1)
        }

        // 3. Compare
        try {
            deepStrictEqual(
                JSON.parse(JSON.stringify(generatedSchema)),
                checkedInSchema,
            )
            console.log(
                `✅ Exchange schema is in sync with DB migrations (version ${schemaVersion}).`,
            )
        } catch (_err) {
            console.error(
                `❌ The generated exchange schema does not match ${filename}.`,
            )
            console.error(
                "👉 This usually happens when DB migrations were added but the JSON schema wasn't updated.",
            )
            console.error(
                `👉 Run 'pnpm generate:schemas' in fdm-core to fix this.`,
            )
            process.exit(1)
        }
    } catch (err) {
        console.error("Unexpected error during schema sync check:", err)
        process.exit(1)
    }
}

main()
