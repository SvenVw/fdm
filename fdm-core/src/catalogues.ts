import type { FdmType } from "./fdm"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import { and, eq } from "drizzle-orm"
import { checkPermission } from "./authorization"

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
                count: fdm.fn.count().as("count"),
            })
            .from(schema.fertilizerCatalogueEnabling)
            .where(
                and(
                    eq(schema.fertilizerCatalogueEnabling.b_id_farm, b_id_farm),
                    eq(schema.fertilizerCatalogueEnabling.p_source, p_source),
                ),
            )

        return result[0].count > 0
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
                count: fdm.fn.count().as("count"),
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

        return result[0].count > 0
    } catch (err) {
        throw handleError(err, "Exception for isCultivationCatalogueEnabled", {
            principal_id,
            b_id_farm,
            b_lu_source,
        })
    }
}
