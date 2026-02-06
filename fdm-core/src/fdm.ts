import type { FdmType } from "./fdm.d"

/**
 * Closes the underlying database connection for an FDM instance.
 *
 * @param fdm The FDM instance to close.
 */
export async function closeFdm(fdm: FdmType): Promise<void> {
    // @ts-ignore
    const client = fdm.$client

    if (client) {
        if (typeof client.end === "function") {
            // postgres.js
            await client.end()
        } else if (typeof client.close === "function") {
            // pglite
            await client.close()
        }
    }
}
