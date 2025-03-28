import type { FdmType } from "./fdm"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import { and, eq } from "drizzle-orm"
import { checkPermission } from "./authorization"
import {
    getCultivationCatalogue,
    getFertilizersCatalogue,
    hashCultivation,
    hashFertilizer,
} from "@svenvw/fdm-data"

/**
 * Gets all enabled fertilizer catalogues for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @returns A Promise that resolves to an array of enabled fertilizer catalogue sources.
 * @throws If retrieving the catalogues fails.
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
 * Gets all enabled cultivation catalogues for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @returns A Promise that resolves to an array of enabled cultivation catalogue sources.
 * @throws If retrieving the catalogues fails.
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
 * Enables a fertilizer catalogue for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param p_source The source/name of the fertilizer catalogue to enable.
 * @returns A Promise that resolves when the catalogue has been enabled.
 * @throws If enabling the catalogue fails.
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
 * Enables a cultivation catalogue for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param b_lu_source The source/name of the cultivation catalogue to enable.
 * @returns A Promise that resolves when the catalogue has been enabled.
 * @throws If enabling the catalogue fails.
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
 * Disables a fertilizer catalogue for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param p_source The source/name of the fertilizer catalogue to disable.
 * @returns A Promise that resolves when the catalogue has been disabled.
 * @throws If disabling the catalogue fails.
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
 * Disables a cultivation catalogue for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param b_lu_source The source/name of the cultivation catalogue to disable.
 * @returns A Promise that resolves when the catalogue has been disabled.
 * @throws If disabling the catalogue fails.
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
 * Checks if a fertilizer catalogue is enabled for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param p_source The source/name of the fertilizer catalogue to check.
 * @returns A Promise that resolves to true if the catalogue is enabled, false otherwise.
 * @throws If checking the catalogue status fails.
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
 * Checks if a cultivation catalogue is enabled for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @param b_lu_source The source/name of the cultivation catalogue to check.
 * @returns A Promise that resolves to true if the catalogue is enabled, false otherwise.
 * @throws If checking the catalogue status fails.
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
 * Synchronizes the fertilizer and cultivation catalogues in the FDM database with the data from fdm-data.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @returns A promise that resolves when the synchronization is complete.
 */
export async function syncCatalogues(fdm: FdmType): Promise<void> {
    await syncFertilizerCatalogue(fdm)
    await syncCultivationCatalogue(fdm)
}

async function syncFertilizerCatalogue(fdm: FdmType) {
    const srmCatalogue = getFertilizersCatalogue("srm")
    await fdm.transaction(async (tx) => {
        try {
            for (const item of srmCatalogue) {
                const hash = hashFertilizer(item)
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
                            .set({ hash: hash })
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
            handleError(error, "Exception for syncFertilizerCatalogue")
        }
    })
}

async function syncCultivationCatalogue(fdm: FdmType) {
    const brpCatalogue = getCultivationCatalogue("brp")

    await fdm.transaction(async (tx) => {
        try {
            for (const item of brpCatalogue) {
                const hash = hashCultivation(item)
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
                            .set({ hash: hash })
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
            handleError(error, "Exception for syncCultivationCatalogue")
        }
    })
}
