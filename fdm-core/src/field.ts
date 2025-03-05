import { asc, eq, sql } from "drizzle-orm"
import { createId } from "./id"

import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { getFieldType } from "./field.d"

/**
 * Adds a new field to a farm.
 *
 * This function verifies that the principal has write permission for the specified farm, generates a unique field ID,
 * stores the field details, and establishes an association between the field and the farm. If an end date is provided, it
 * ensures that the start date precedes the end date, throwing an error if not.
 *
 * @param principal_id - The unique identifier of the principal performing the operation.
 * @param b_id_farm - The identifier of the farm to which the field belongs.
 * @param b_name - The name of the field.
 * @param b_id_source - The field's identifier in the source dataset.
 * @param b_geometry - The GeoJSON representation of the field's geometry.
 * @param b_start - The start date for managing the field.
 * @param b_acquiring_method - The method used for acquiring the field.
 * @param b_end - (Optional) The end date for managing the field.
 * @returns A promise that resolves to the newly generated field ID.
 *
 * @throws {Error} If the start date is not before the end date.
 *
 * @alpha
 */
export async function addField(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.fieldAcquiringTypeInsert["b_id_farm"],
    b_name: schema.fieldsTypeInsert["b_name"],
    b_id_source: schema.fieldsTypeInsert["b_id_source"],
    b_geometry: schema.fieldsTypeInsert["b_geometry"],
    b_start: schema.fieldAcquiringTypeInsert["b_start"],
    b_acquiring_method: schema.fieldAcquiringTypeInsert["b_acquiring_method"],
    b_end?: schema.fieldDiscardingTypeInsert["b_end"],
): Promise<schema.fieldsTypeInsert["b_id"]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "write",
            b_id_farm,
            principal_id,
            "addField",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            // Generate an ID for the field
            const b_id = createId()

            // Insert field
            const fieldData = {
                b_id: b_id,
                b_name: b_name,
                b_id_source: b_id_source,
                b_geometry: b_geometry,
            }
            await tx.insert(schema.fields).values(fieldData)

            // Insert relation between farm and field
            const fieldAcquiringData = {
                b_id,
                b_id_farm,
                b_start,
                b_acquiring_method,
            }
            await tx.insert(schema.fieldAcquiring).values(fieldAcquiringData)

            // Check that acquire date is before discarding date
            if (b_end && b_start && b_start.getTime() >= b_end.getTime()) {
                throw new Error("Acquiring date must be before discarding date")
            }

            // Insert relation between field and discarding
            const fieldDiscardingData = {
                b_id,
                b_end,
            }
            await tx.insert(schema.fieldDiscarding).values(fieldDiscardingData)

            return b_id
        })
    } catch (err) {
        throw handleError(err, "Exception for addField", {
            b_id_farm,
            b_name,
            b_id_source,
            // b_geometry,
            b_start,
            b_acquiring_method,
            b_end,
        })
    }
}

/**
 * Retrieves detailed information for a field.
 *
 * Verifies that the principal has read permission for the field, then retrieves and returns its properties,
 * including geometry, area, acquisition start and optional end dates, acquisition method, and timestamps for creation and update.
 *
 * @param principal_id - The identifier of the principal making the request.
 * @param b_id - The unique identifier of the field to retrieve.
 * @returns A promise that resolves with the field details.
 *
 * @throws {Error} If the principal lacks read permission or if an error occurs during retrieval.
 *
 * @alpha
 */
export async function getField(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fieldsTypeSelect["b_id"],
): Promise<getFieldType> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getField",
        )

        // Get properties of the requested field
        const field = await fdm
            .select({
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                b_id_farm: schema.fieldAcquiring.b_id_farm,
                b_id_source: schema.fields.b_id_source,
                b_geometry: schema.fields.b_geometry,
                b_area: sql<number>`ST_Area(b_geometry::geography)/10000`,
                b_start: schema.fieldAcquiring.b_start,
                b_end: schema.fieldDiscarding.b_end,
                b_acquiring_method: schema.fieldAcquiring.b_acquiring_method,
                created: schema.fields.created,
                updated: schema.fields.updated,
            })
            .from(schema.fields)
            .innerJoin(
                schema.fieldAcquiring,
                eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
            )
            .leftJoin(
                schema.fieldDiscarding,
                eq(schema.fields.b_id, schema.fieldDiscarding.b_id),
            )
            .where(eq(schema.fields.b_id, b_id))
            .limit(1)

        return field[0]
    } catch (err) {
        throw handleError(err, "Exception for getField", { b_id })
    }
}

/**
 * Retrieves all fields associated with the specified farm.
 *
 * This asynchronous function verifies that the requesting principal has read access to the farm,
 * then returns an array of field detail objects. Each object includes the field's identifier, name,
 * source, geometry and computed area, acquisition start date, acquisition method, optional end date,
 * as well as creation and update timestamps.
 *
 * @param principal_id - ID of the principal making the request.
 * @param b_id_farm - Unique identifier of the farm whose fields are being retrieved.
 * @returns A promise that resolves to an array of field detail objects.
 *
 * @alpha
 */
export async function getFields(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<getFieldType[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getFields",
        )

        // Get properties of the requested field
        const fields = await fdm
            .select({
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                b_id_farm: schema.fieldAcquiring.b_id_farm,
                b_id_source: schema.fields.b_id_source,
                b_geometry: schema.fields.b_geometry,
                b_area: sql<number>`ST_Area(b_geometry::geography)/10000`,
                b_start: schema.fieldAcquiring.b_start,
                b_acquiring_method: schema.fieldAcquiring.b_acquiring_method,
                b_end: schema.fieldDiscarding.b_end,
                created: schema.fields.created,
                updated: schema.fields.updated,
            })
            .from(schema.fields)
            .innerJoin(
                schema.fieldAcquiring,
                eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
            )
            .leftJoin(
                schema.fieldDiscarding,
                eq(schema.fields.b_id, schema.fieldDiscarding.b_id),
            )
            .where(eq(schema.fieldAcquiring.b_id_farm, b_id_farm))
            .orderBy(asc(schema.fields.b_name))

        return fields
    } catch (err) {
        throw handleError(err, "Exception for getFields", { b_id_farm })
    }
}

/**
 * Updates an existing field's details.
 *
 * Applies updates to the field's basic properties as well as its associated acquiring and discarding records.
 * Ensures that the provided start date precedes the end date (if an end date is supplied) and verifies that the principal
 * has write permissions for the field.
 *
 * @param principal_id - Identifier of the principal performing the update.
 * @param b_id - Unique identifier of the field to update.
 * @param b_name - (Optional) New name for the field.
 * @param b_id_source - (Optional) New source identifier for the field.
 * @param b_geometry - (Optional) Updated field geometry in GeoJSON format.
 * @param b_start - (Optional) Updated start (acquiring) date for the field.
 * @param b_acquiring_method - (Optional) Updated method for field management.
 * @param b_end - (Optional) Updated end (discarding) date for the field.
 * @returns A Promise that resolves to the updated field details.
 *
 * @throws {Error} If the start date is not before the end date.
 * @alpha
 */
export async function updateField(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fieldsTypeInsert["b_id"],
    b_name?: schema.fieldsTypeInsert["b_name"],
    b_id_source?: schema.fieldsTypeInsert["b_id_source"],
    b_geometry?: schema.fieldsTypeInsert["b_geometry"],
    b_start?: schema.fieldAcquiringTypeInsert["b_start"],
    b_acquiring_method?: schema.fieldAcquiringTypeInsert["b_acquiring_method"],
    b_end?: schema.fieldDiscardingTypeInsert["b_end"],
): Promise<getFieldType> {
    return await fdm.transaction(async (tx: FdmType) => {
        try {
            await checkPermission(
                fdm,
                "field",
                "write",
                b_id,
                principal_id,
                "updateField",
            )

            const updated = new Date()

            const setFields: Partial<schema.fieldsTypeInsert> = {}
            if (b_name !== undefined) {
                setFields.b_name = b_name
            }
            if (b_id_source !== undefined) {
                setFields.b_id_source = b_id_source
            }
            if (b_geometry !== undefined) {
                setFields.b_geometry = b_geometry
            }
            setFields.updated = updated

            await tx
                .update(schema.fields)
                .set(setFields)
                .where(eq(schema.fields.b_id, b_id))

            const setfieldAcquiring: Partial<schema.fieldAcquiringTypeInsert> =
                {}
            if (b_start !== undefined) {
                setfieldAcquiring.b_start = b_start
            }
            if (b_acquiring_method !== undefined) {
                setfieldAcquiring.b_acquiring_method = b_acquiring_method
            }
            setfieldAcquiring.updated = updated

            const setfieldDiscarding: Partial<schema.fieldDiscardingTypeInsert> =
                {}
            if (b_end !== undefined) {
                setfieldDiscarding.b_end = b_end
            }
            setfieldDiscarding.updated = updated

            await tx
                .update(schema.fieldAcquiring)
                .set(setfieldAcquiring)
                .where(eq(schema.fieldAcquiring.b_id, b_id))

            await tx
                .update(schema.fieldDiscarding)
                .set(setfieldDiscarding)
                .where(eq(schema.fieldDiscarding.b_id, b_id))

            const result = await tx
                .select({
                    b_id: schema.fields.b_id,
                    b_name: schema.fields.b_name,
                    b_id_farm: schema.fieldAcquiring.b_id_farm,
                    b_id_source: schema.fields.b_id_source,
                    b_geometry: schema.fields.b_geometry,
                    b_start: schema.fieldAcquiring.b_start,
                    b_acquiring_method:
                        schema.fieldAcquiring.b_acquiring_method,
                    b_end: schema.fieldDiscarding.b_end,
                    created: schema.fields.created,
                    updated: schema.fields.updated,
                })
                .from(schema.fields)
                .innerJoin(
                    schema.fieldAcquiring,
                    eq(schema.fields.b_id, schema.fieldAcquiring.b_id),
                )
                .leftJoin(
                    schema.fieldDiscarding,
                    eq(schema.fields.b_id, schema.fieldDiscarding.b_id),
                )
                .where(eq(schema.fields.b_id, b_id))
                .limit(1)
            const field = result[0]

            // Check if acquiring date is before discarding date
            if (
                field.b_end &&
                field.b_start.getTime() >= field.b_end.getTime()
            ) {
                throw new Error("Acquiring date must be before discarding date")
            }

            return field
        } catch (err) {
            handleError(err, "Exception for updateField", {
                b_id,
                b_name,
                b_id_source,
                // b_geometry,
                b_start,
                b_acquiring_method,
                b_end,
            })
        }
    })
}
