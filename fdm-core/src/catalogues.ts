import type { FdmType } from "./fdm"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import { and, eq } from "drizzle-orm"
import { checkPermission } from "./authorization"
import {
    getCultivationCatalogue,
    getFertilizersCatalogue,
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
    try {
        // Sync fertilizers catalogue (SRM)
        const srmCatalogue = getFertilizersCatalogue("srm")
        for (const srmItem of srmCatalogue) {
            const existingItem = await fdm
                .select()
                .from(schema.fertilizersCatalogue)
                .where(
                    eq(
                        schema.fertilizersCatalogue.p_id_catalogue,
                        srmItem.p_id_catalogue,
                    ),
                )
                .limit(1)

            if (existingItem.length === 0) {
                await fdm.insert(schema.fertilizersCatalogue).values(srmItem)
                console.log(
                    `Inserted fertilizer catalogue item: ${srmItem.p_id_catalogue}`,
                )
            } else {
                // Update item if different
                if (srmItem.hash && srmItem.hash !== existingItem[0].hash) {
                    await fdm
                        .update(schema.fertilizersCatalogue)
                        .set(srmItem)
                        .where(
                            eq(
                                schema.fertilizersCatalogue.p_id_catalogue,
                                srmItem.p_id_catalogue,
                            ),
                        )
                    console.log(
                        `Updated fertilizer catalogue item: ${srmItem.p_id_catalogue}`,
                    )
                }
            }
        }

        // Sync cultivation catalogue (BRP)
        const brpCatalogue = getCultivationCatalogue("brp")
        for (const brpItem of brpCatalogue) {
            const existingItem = await fdm
                .select()
                .from(schema.cultivationsCatalogue)
                .where(
                    eq(
                        schema.cultivationsCatalogue.b_lu_catalogue,
                        brpItem.b_lu_catalogue,
                    ),
                )
                .limit(1)

            if (existingItem.length === 0) {
                await fdm.insert(schema.cultivationsCatalogue).values(brpItem)
                console.log(
                    `Inserted cultivation catalogue item: ${brpItem.b_lu_catalogue}`,
                )
            } else {
                // Update item if different
                if (brpItem.hash && brpItem.hash !== existingItem[0].hash) {
                    await fdm
                        .update(schema.cultivationsCatalogue)
                        .set(brpItem)
                        .where(
                            eq(
                                schema.cultivationsCatalogue.b_lu_catalogue,
                                brpItem.b_lu_catalogue,
                            ),
                        )
                    console.log(
                        `Updated cultivation catalogue item: ${brpItem.b_lu_catalogue}`,
                    )
                }
            }
        }
    } catch (err) {
        throw handleError(err, "Exception for syncCatalogues")
    }
}
