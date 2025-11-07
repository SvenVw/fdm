/**
 * @file This file contains functions for managing catalogues in the FDM.
 *
 * It provides functionalities to enable, disable, and check the status of fertilizer and cultivation
 * catalogues for a given farm. It also includes functions to synchronize the catalogues with the
 * data from the `@svenvw/fdm-data` package.
 */
import {
    getCultivationCatalogue,
    getFertilizersCatalogue,
    hashCultivation,
    hashFertilizer,
} from "@svenvw/fdm-data"
import { and, eq } from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { FdmServerType } from "./fdm-server.d"

/**
 * Retrieves the enabled fertilizer catalogues for a specific farm.
 *
 * This function checks the permissions of the principal and then queries the database
 * to get a list of all fertilizer catalogues that are enabled for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to an array of strings, where each string is the source of an enabled fertilizer catalogue.
 * @throws An error if the principal does not have permission to read the farm's data or if the database query fails.
 */
export async function getEnabledFertilizerCatalogues(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<string[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getEnabledFertilizerCatalogues",
        )
        const result = await fdm
            .select({
                p_source: schema.fertilizerCatalogueEnabling.p_source,
            })
            .from(schema.fertilizerCatalogueEnabling)
            .where(eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm))

        return result.map((row: { p_source: string }) => row.p_source)
    } catch (err) {
        throw handleError(err, "Exception for getEnabledFertilizerCatalogues", {
            principal_id,
            b_id_farm,
        })
    }
}

/**
 * Retrieves the enabled cultivation catalogues for a specific farm.
 *
 * This function checks the permissions of the principal and then queries the database
 * to get a list of all cultivation catalogues that are enabled for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to an array of strings, where each string is the source of an enabled cultivation catalogue.
 * @throws An error if the principal does not have permission to read the farm's data or if the database query fails.
 */
export async function getEnabledCultivationCatalogues(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<string[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getEnabledCultivationCatalogues",
        )
        const result = await fdm
            .select({
                b_lu_source: schema.cultivationCatalogueSelecting.b_lu_source,
            })
            .from(schema.cultivationCatalogueSelecting)
            .where(
                eq(schema.cultivationCatalogueSelecting.b_id_farm, b_id_farm),
            )

        return result.map((row: { b_lu_source: string }) => row.b_lu_source)
    } catch (err) {
        throw handleError(
            err,
            "Exception for getEnabledCultivationCatalogues",
            {
                principal_id,
                b_id_farm,
            },
        )
    }
}

/**
 * Enables a fertilizer catalogue for a specific farm.
 *
 * This function checks the principal's permissions and then adds an entry to the database
 * to enable the specified fertilizer catalogue for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param p_source The source identifier of the fertilizer catalogue to enable.
 * @returns A promise that resolves when the catalogue has been successfully enabled.
 * @throws An error if the principal does not have permission to modify the farm's data or if the database insertion fails.
 */
export async function enableFertilizerCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    p_source: string,
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "enableFertilizerCatalogue",
        )
        await fdm.insert(schema.fertilizerCatalogueEnabling).values({
            b_id_farm,
            p_source,
        })
    } catch (err) {
        throw handleError(err, "Exception for enableFertilizerCatalogue", {
            principal_id,
            b_id_farm,
            p_source,
        })
    }
}

/**
 * Enables a cultivation catalogue for a specific farm.
 *
 * This function checks the principal's permissions and then adds an entry to the database
 * to enable the specified cultivation catalogue for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_lu_source The source identifier of the cultivation catalogue to enable.
 * @returns A promise that resolves when the catalogue has been successfully enabled.
 * @throws An error if the principal does not have permission to modify the farm's data or if the database insertion fails.
 */
export async function enableCultivationCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    b_lu_source: string,
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "enableCultivationCatalogue",
        )
        await fdm.insert(schema.cultivationCatalogueSelecting).values({
            b_id_farm,
            b_lu_source,
        })
    } catch (err) {
        throw handleError(err, "Exception for enableCultivationCatalogue", {
            principal_id,
            b_id_farm,
            b_lu_source,
        })
    }
}

/**
 * Disables a fertilizer catalogue for a specific farm.
 *
 * This function checks the principal's permissions and then removes the entry from the database
 * that enables the specified fertilizer catalogue for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param p_source The source identifier of the fertilizer catalogue to disable.
 * @returns A promise that resolves when the catalogue has been successfully disabled.
 * @throws An error if the principal does not have permission to modify the farm's data or if the database deletion fails.
 */
export async function disableFertilizerCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    p_source: string,
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "disableFertilizerCatalogue",
        )
        await fdm
            .delete(schema.fertilizerCatalogueEnabling)
            .where(
                and(
                    eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm),
                    eq(schema.fertilizerCatalogueEnabling.p_source, p_source),
                ),
            )
    } catch (err) {
        throw handleError(err, "Exception for disableFertilizerCatalogue", {
            principal_id,
            b_id_farm,
            p_source,
        })
    }
}

/**
 * Disables a cultivation catalogue for a specific farm.
 *
 * This function checks the principal's permissions and then removes the entry from the database
 * that enables the specified cultivation catalogue for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_lu_source The source identifier of the cultivation catalogue to disable.
 * @returns A promise that resolves when the catalogue has been successfully disabled.
 * @throws An error if the principal does not have permission to modify the farm's data or if the database deletion fails.
 */
export async function disableCultivationCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    b_lu_source: string,
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "disableCultivationCatalogue",
        )
        await fdm
            .delete(schema.cultivationCatalogueSelecting)
            .where(
                and(
                    eq(
                        schema.cultivationCatalogueSelecting.b_id_farm,
                        b_id_farm,
                    ),
                    eq(
                        schema.cultivationCatalogueSelecting.b_lu_source,
                        b_lu_source,
                    ),
                ),
            )
    } catch (err) {
        throw handleError(err, "Exception for disableCultivationCatalogue", {
            principal_id,
            b_id_farm,
            b_lu_source,
        })
    }
}

/**
 * Checks if a fertilizer catalogue is enabled for a specific farm.
 *
 * This function checks the principal's permissions and then queries the database to determine
 * if the specified fertilizer catalogue is enabled for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param p_source The source identifier of the fertilizer catalogue to check.
 * @returns A promise that resolves to `true` if the catalogue is enabled, and `false` otherwise.
 * @throws An error if the principal does not have permission to read the farm's data or if the database query fails.
 */
export async function isFertilizerCatalogueEnabled(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    p_source: string,
): Promise<boolean> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "isFertilizerCatalogueEnabled",
        )
        const result = await fdm
            .select({
                b_id_farm: schema.fertilizerCatalogueEnabling.b_id_farm,
                p_source: schema.fertilizerCatalogueEnabling.p_source,
            })
            .from(schema.fertilizerCatalogueEnabling)
            .where(
                and(
                    eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm),
                    eq(schema.fertilizerCatalogueEnabling.p_source, p_source),
                ),
            )

        return result.length > 0
    } catch (err) {
        throw handleError(err, "Exception for isFertilizerCatalogueEnabled", {
            principal_id,
            b_id_farm,
            p_source,
        })
    }
}

/**
 * Checks if a cultivation catalogue is enabled for a specific farm.
 *
 * This function checks the principal's permissions and then queries the database to determine
 * if the specified cultivation catalogue is enabled for the given farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_lu_source The source identifier of the cultivation catalogue to check.
 * @returns A promise that resolves to `true` if the catalogue is enabled, and `false` otherwise.
 * @throws An error if the principal does not have permission to read the farm's data or if the database query fails.
 */
export async function isCultivationCatalogueEnabled(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    b_lu_source: string,
): Promise<boolean> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "isCultivationCatalogueEnabled",
        )
        const result = await fdm
            .select({
                b_id_farm: schema.cultivationCatalogueSelecting.b_id_farm,
                b_lu_source: schema.cultivationCatalogueSelecting.b_lu_source,
            })
            .from(schema.cultivationCatalogueSelecting)
            .where(
                and(
                    eq(
                        schema.cultivationCatalogueSelecting.b_id_farm,
                        b_id_farm,
                    ),
                    eq(
                        schema.cultivationCatalogueSelecting.b_lu_source,
                        b_lu_source,
                    ),
                ),
            )

        return result.length > 0
    } catch (err) {
        throw handleError(err, "Exception for isCultivationCatalogueEnabled", {
            principal_id,
            b_id_farm,
            b_lu_source,
        })
    }
}

/**
 * Synchronizes all catalogues from the `@svenvw/fdm-data` package with the database.
 *
 * This function is a convenience wrapper that calls the synchronization functions for each type of catalogue.
 * It is typically called during the application's startup process to ensure that the
 * catalogue data in the database is up-to-date.
 *
 * @param fdm The FDM instance for database access.
 * @returns A promise that resolves when all catalogues have been synchronized.
 */
export async function syncCatalogues(fdm: FdmType): Promise<void> {
    await syncFertilizerCatalogue(fdm)
    await syncCultivationCatalogue(fdm)
}

/**
 * Synchronizes the fertilizer catalogue from the `@svenvw/fdm-data` package with the database.
 *
 * This function retrieves the fertilizer catalogues, calculates a hash for each item, and then
 * inserts or updates the items in the database as needed. This ensures that the data in the
 * database is consistent with the data in the `@svenvw/fdm-data` package.
 *
 * @param fdm The FDM instance for database access.
 * @returns A promise that resolves when the fertilizer catalogue has been synchronized.
 * @internal
 */
async function syncFertilizerCatalogue(fdm: FdmType) {
    const srmCatalogue = await getFertilizersCatalogue("srm")
    const baatCatalogue = await getFertilizersCatalogue("baat")
    const fertilizersCatalogue = [...srmCatalogue, ...baatCatalogue]

    await fdm.transaction(async (tx: FdmServerType) => {
        try {
            for (const item of fertilizersCatalogue) {
                const hash = await hashFertilizer(item)
                const existing = await tx
                    .select({ hash: schema.fertilizersCatalogue.hash })
                    .from(schema.fertilizersCatalogue)
                    .where(
                        eq(
                            schema.fertilizersCatalogue.p_id_catalogue,
                            item.p_id_catalogue,
                        ),
                    )
                    .limit(1)
                if (existing.length === 0) {
                    //add the item if does not exist
                    await tx.insert(schema.fertilizersCatalogue).values({
                        ...item,
                        hash: hash,
                    })
                } else {
                    // update the hash if it is undefined, null or different
                    if (
                        existing[0].hash === null ||
                        existing[0].hash === undefined ||
                        existing[0].hash !== hash
                    ) {
                        await tx
                            .update(schema.fertilizersCatalogue)
                            .set({ ...item, hash: hash, updated: new Date() })
                            .where(
                                eq(
                                    schema.fertilizersCatalogue.p_id_catalogue,
                                    item.p_id_catalogue,
                                ),
                            )
                    }
                }
            }
        } catch (error) {
            throw handleError(error, "Exception for syncFertilizerCatalogue")
        }
    })
}

/**
 * Synchronizes the cultivation catalogue from the `@svenvw/fdm-data` package with the database.
 *
 * This function retrieves the cultivation catalogue, calculates a hash for each item, and then
 * inserts or updates the items in the database as needed. This ensures that the data in the
 * database is consistent with the data in the `@svenvw/fdm-data` package.
 *
 * @param fdm The FDM instance for database access.
 * @returns A promise that resolves when the cultivation catalogue has been synchronized.
 * @internal
 */
async function syncCultivationCatalogue(fdm: FdmType) {
    const brpCatalogue = await getCultivationCatalogue("brp")

    await fdm.transaction(async (tx: FdmServerType) => {
        try {
            for (const item of brpCatalogue) {
                const hash = await hashCultivation(item)
                const existing = await tx
                    .select({ hash: schema.cultivationsCatalogue.hash })
                    .from(schema.cultivationsCatalogue)
                    .where(
                        eq(
                            schema.cultivationsCatalogue.b_lu_catalogue,
                            item.b_lu_catalogue,
                        ),
                    )
                    .limit(1)
                if (existing.length === 0) {
                    //add the item if does not exist
                    await tx.insert(schema.cultivationsCatalogue).values({
                        ...item,
                        hash: hash,
                    })
                } else {
                    // update the hash if it is undefined, null or different
                    if (
                        existing[0].hash === null ||
                        existing[0].hash === undefined ||
                        existing[0].hash !== hash
                    ) {
                        await tx
                            .update(schema.cultivationsCatalogue)
                            .set({ ...item, hash: hash, updated: new Date() })
                            .where(
                                eq(
                                    schema.cultivationsCatalogue.b_lu_catalogue,
                                    item.b_lu_catalogue,
                                ),
                            )
                    }
                }
            }
        } catch (error) {
            throw handleError(error, "Exception for syncCultivationCatalogue")
        }
    })
}
