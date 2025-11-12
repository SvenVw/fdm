/**
 * @file This file contains functions for managing grazing intentions in the FDM.
 *
 * It provides functionalities to set, remove, and retrieve grazing intentions for a farm.
 */
import { and, eq } from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"

/**
 * Sets or updates the grazing intention for a farm for a specific year.
 *
 * This function creates a new grazing intention record if one doesn't exist for the given farm and year,
 * or updates the existing one.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_grazing_intention_year The year of the grazing intention.
 * @param b_grazing_intention The grazing intention value (true or false).
 * @returns A promise that resolves when the grazing intention has been successfully set.
 * @throws An error if the principal does not have permission.
 */
export async function setGrazingIntention(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.intendingGrazingTypeInsert["b_id_farm"],
    b_grazing_intention_year: schema.intendingGrazingTypeInsert["b_grazing_intention_year"],
    b_grazing_intention: schema.intendingGrazingTypeInsert["b_grazing_intention"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "setGrazingIntention",
        )

        await fdm
            .insert(schema.intendingGrazing)
            .values({
                b_id_farm,
                b_grazing_intention_year: b_grazing_intention_year,
                b_grazing_intention: b_grazing_intention,
            })
            .onConflictDoUpdate({
                target: [
                    schema.intendingGrazing.b_id_farm,
                    schema.intendingGrazing.b_grazing_intention_year,
                ],
                set: {
                    b_grazing_intention: b_grazing_intention,
                    updated: new Date(),
                },
            })
    } catch (err) {
        throw handleError(err, "Exception for setGrazingIntention", {
            b_id_farm,
            b_grazing_intention_year,
            b_grazing_intention,
        })
    }
}

/**
 * Removes the grazing intention for a farm for a specific year.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_grazing_intention_year The year of the grazing intention to remove.
 * @returns A promise that resolves when the grazing intention has been successfully removed.
 * @throws An error if the principal does not have permission.
 */
export async function removeGrazingIntention(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.intendingGrazingTypeSelect["b_id_farm"],
    b_grazing_intention_year: schema.intendingGrazingTypeSelect["b_grazing_intention_year"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "removeGrazingIntention",
        )

        await fdm
            .delete(schema.intendingGrazing)
            .where(
                and(
                    eq(schema.intendingGrazing.b_id_farm, b_id_farm),
                    eq(
                        schema.intendingGrazing.b_grazing_intention_year,
                        b_grazing_intention_year,
                    ),
                ),
            )
    } catch (err) {
        throw handleError(err, "Exception for removeGrazingIntention", {
            b_id_farm,
            b_grazing_intention_year,
        })
    }
}

/**
 * Retrieves all grazing intentions for a farm.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to an array of grazing intention objects.
 * @throws An error if the principal does not have permission.
 */
export async function getGrazingIntentions(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<schema.intendingGrazingTypeSelect[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getGrazingIntentions",
        )

        return await fdm
            .select()
            .from(schema.intendingGrazing)
            .where(eq(schema.intendingGrazing.b_id_farm, b_id_farm))
    } catch (err) {
        throw handleError(err, "Exception for getGrazingIntentions", {
            b_id_farm,
        })
    }
}

/**
 * Retrieves the grazing intention for a farm for a specific year.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_grazing_intention_year The year of the grazing intention to retrieve.
 * @returns A promise that resolves to a boolean indicating the grazing intention. Defaults to `false` if not set.
 * @throws An error if the principal does not have permission.
 */
export async function getGrazingIntention(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    b_grazing_intention_year: schema.intendingGrazingTypeSelect["b_grazing_intention_year"],
): Promise<boolean> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getGrazingIntention",
        )

        const result = await fdm
            .select({ intention: schema.intendingGrazing.b_grazing_intention })
            .from(schema.intendingGrazing)
            .where(
                and(
                    eq(schema.intendingGrazing.b_id_farm, b_id_farm),
                    eq(
                        schema.intendingGrazing.b_grazing_intention_year,
                        b_grazing_intention_year,
                    ),
                ),
            )
            .limit(1)

        return result[0]?.intention ?? false
    } catch (err) {
        throw handleError(err, "Exception for getGrazingIntention", {
            b_id_farm,
            b_grazing_intention_year,
        })
    }
}
