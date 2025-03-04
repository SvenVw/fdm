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
 * This function verifies that the principal has write permission for the specified farm,
 * generates a unique field ID, records the field details, and creates an association between
 * the field and the farm. If a discarding date is provided, the function ensures that the acquiring
 * date is earlier than the discarding date, throwing an error otherwise.
 *
 * @param principal_id - The unique identifier of the principal performing the operation.
 * @param b_id_farm - Identifier of the farm to which the field belongs.
 * @param b_name - Name of the field.
 * @param b_id_source - Identifier for the field in the source dataset.
 * @param b_geometry - GeoJSON representation of the field geometry.
 * @param b_acquiring_date - The start date for managing the field.
 * @param b_acquiring_method - Method used for acquiring the field.
 * @param b_discarding_date - (Optional) The end date for managing the field.
 * @returns A promise that resolves to the newly generated field ID.
 *
 * @throws {Error} If the acquiring date is not earlier than the discarding date.
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
    b_acquiring_date: schema.fieldAcquiringTypeInsert["b_acquiring_date"],
    b_acquiring_method: schema.fieldAcquiringTypeInsert["b_acquiring_method"],
    b_discarding_date?: schema.fieldDiscardingTypeInsert["b_discarding_date"],
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
                b_acquiring_date,
                b_acquiring_method,
            }
            await tx.insert(schema.fieldAcquiring).values(fieldAcquiringData)

            // Check that acquire date is before discarding date
            if (
                b_discarding_date &&
                b_acquiring_date &&
                b_acquiring_date.getTime() >= b_discarding_date.getTime()
            ) {
                throw new Error("Acquiring date must be before discarding date")
            }

            // Insert relation between field and discarding
            const fieldDiscardingData = {
                b_id,
                b_discarding_date,
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
            b_acquiring_date,
            b_acquiring_method,
            b_discarding_date,
        })
    }
}

/**
 * Retrieves detailed information for a specific field.
 *
 * This function verifies that the principal identified by `principal_id` has permission to read the field,
 * then fetches and returns the field's properties including its geometry, area, acquisition, and related timestamps.
 *
 * @param principal_id - The identifier of the principal making the request.
 * @param b_id - The unique identifier of the field to retrieve.
 *
 * @returns A promise that resolves with the field details.
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
                b_acquiring_date: schema.fieldAcquiring.b_acquiring_date,
                b_discarding_date: schema.fieldDiscarding.b_discarding_date,
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
 * Retrieves all fields associated with a specified farm.
 *
 * This function first verifies that the requesting principal has read access to the farm, then
 * returns an array of field detail objects. Each object includes the field's identifier, name,
 * source, geometry, area, acquiring and discarding dates, as well as the creation and update timestamps.
 *
 * @param principal_id - The ID of the principal making the request.
 * @param b_id_farm - The unique identifier of the farm.
 * @returns A Promise resolving to an array of field detail objects.
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
                b_acquiring_date: schema.fieldAcquiring.b_acquiring_date,
                b_acquiring_method: schema.fieldAcquiring.b_acquiring_method,
                b_discarding_date: schema.fieldDiscarding.b_discarding_date,
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
 * Updates the details of an existing field.
 *
 * This function applies updates to the field's basic information and its associated acquiring and discarding records.
 * It performs a permission check to ensure the principal has write access and validates that the acquiring date is earlier than the discarding date, when applicable.
 *
 * @param fdm - The field management instance.
 * @param principal_id - The identifier of the principal performing the update.
 * @param b_id - The unique identifier of the field to update.
 * @param b_name - (Optional) New name for the field.
 * @param b_id_source - (Optional) New source identifier for the field.
 * @param b_geometry - (Optional) Updated field geometry in GeoJSON format.
 * @param b_acquiring_date - (Optional) Updated start date for managing the field.
 * @param b_acquiring_method - (Optional) Updated method for field management.
 * @param b_discarding_date - (Optional) Updated end date for managing the field.
 * @returns A Promise that resolves to the updated field details.
 *
 * @throws {Error} If the acquiring date is not before the discarding date.
 * @alpha
 */
export async function updateField(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fieldsTypeInsert["b_id"],
    b_name?: schema.fieldsTypeInsert["b_name"],
    b_id_source?: schema.fieldsTypeInsert["b_id_source"],
    b_geometry?: schema.fieldsTypeInsert["b_geometry"],
    b_acquiring_date?: schema.fieldAcquiringTypeInsert["b_acquiring_date"],
    b_acquiring_method?: schema.fieldAcquiringTypeInsert["b_acquiring_method"],
    b_discarding_date?: schema.fieldDiscardingTypeInsert["b_discarding_date"],
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
            if (b_acquiring_date !== undefined) {
                setfieldAcquiring.b_acquiring_date = b_acquiring_date
            }
            if (b_acquiring_method !== undefined) {
                setfieldAcquiring.b_acquiring_method = b_acquiring_method
            }
            setfieldAcquiring.updated = updated

            const setfieldDiscarding: Partial<schema.fieldDiscardingTypeInsert> =
                {}
            if (b_discarding_date !== undefined) {
                setfieldDiscarding.b_discarding_date = b_discarding_date
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
                    b_acquiring_date: schema.fieldAcquiring.b_acquiring_date,
                    b_acquiring_method:
                        schema.fieldAcquiring.b_acquiring_method,
                    b_discarding_date: schema.fieldDiscarding.b_discarding_date,
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
                field.b_discarding_date &&
                field.b_acquiring_date.getTime() >=
                    field.b_discarding_date.getTime()
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
                b_acquiring_date,
                b_acquiring_method,
                b_discarding_date,
            })
        }
    })
}
