import { exportFarm } from "@svenvw/fdm-core"
import { data, type LoaderFunctionArgs } from "react-router"
import { getSession } from "~/lib/auth.server"
import { handleLoaderError } from "~/lib/error"
import { fdm } from "~/lib/fdm.server"
import { clientConfig } from "~/lib/config"
import { readFile } from "node:fs/promises"
import { resolve } from "node:path"

/**
 * Resource route that returns the raw JSON export data for a farm.
 */
export async function loader({ request, params }: LoaderFunctionArgs) {
    try {
        const b_id_farm = params.b_id_farm
        if (!b_id_farm) {
            throw data("Farm ID is required", { status: 400 })
        }

        const session = await getSession(request)

        // Generate the export data using the fdm-core utility
        const packageJsonRaw = await readFile(
            resolve(process.cwd(), "package.json"),
            "utf-8",
        )
        const packageJson = JSON.parse(packageJsonRaw)
        const exportData = await exportFarm(
            fdm,
            session.principal_id,
            b_id_farm,
            clientConfig.name,
            packageJson.version,
        )

        return new Response(JSON.stringify(exportData, null, 2), {
            headers: {
                "Content-Type": "application/json",
                "Content-Disposition": `attachment; filename="export.json"`,
            },
        })
    } catch (error) {
        throw handleLoaderError(error)
    }
}
