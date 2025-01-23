import { asc, eq, sql } from "drizzle-orm"
import { createId } from "./id"

import * as schema from "./db/schema"
import type { FdmType } from "./fdm"
import type { getFieldType } from "./field.d"

/**
 * Add a new field
 *
 * @param b_id_farm - ID of the farm.
 * @param b_name - Name of the field.
 * @param b_id_source - ID of the field in source dataset
 * @param b_geometry - Geometry of field in WKT format
 * @param b_acquiring_date - Start date of managing field.
 * @param b_discarding_date - End date of managing field.
 * @param b_acquiring_method - Type of managing field.
 * @returns A Promise that resolves when the field has been added and returns the value for b_id.
 * @alpha
 */
export async function addField(
    fdm: FdmType,
    b_id_farm: schema.fieldAcquiringTypeInsert["b_id_farm"],
    b_name: schema.fieldsTypeInsert["b_name"],
    b_id_source: schema.fieldsTypeInsert["b_id_source"],
    b_geometry: schema.fieldsTypeInsert["b_geometry"],
    b_acquiring_date: schema.fieldAcquiringTypeInsert["b_acquiring_date"],
    b_acquiring_method: schema.fieldAcquiringTypeInsert["b_acquiring_method"],
    b_discarding_date?: schema.fieldDiscardingTypeInsert["b_discarding_date"],
): Promise<schema.fieldsTypeInsert["b_id"]> {
    // Generate an ID for the field
    const b_id = createId()

    fdm.transaction(async (tx: FdmType) => {
        try {
            // Insert field
            const fieldData = {
                b_id: b_id,
                b_name: b_name,
                b_id_source: b_id_source,
                b_geometry: sql`${b_geometry}::geometry(polygon)`,
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
        } catch (error) {
            throw new Error(`Addition of field failed with error ${error}`)
        }
    })

    return b_id
}

/**
 * Get the details of a specific field.
 *
 * @param b_id - The id of the field to be requested.
 * @returns A Promise that resolves with an object that contains the details of a field.
 * @alpha
 */
export async function getField(
    fdm: FdmType,
    b_id: schema.fieldsTypeSelect["b_id"],
): Promise<getFieldType> {
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
}

/**
 * Get the details of the field for a specific farm
 *
 * @param b_id_farm - The id of the farm to be requested.
 * @returns A Promise that resolves with an array of objects that contains the details of fields related to the farm
 * @alpha
 */
export async function getFields(
    fdm: FdmType,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<getFieldType[]> {
    // Get properties of the requested field
    const fields = await fdm
        .select({
            b_id: schema.fields.b_id,
            b_name: schema.fields.b_name,
            b_id_farm: schema.farms.b_id_farm,
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
        .innerJoin(
            schema.farms,
            eq(schema.farms.b_id_farm, schema.fieldAcquiring.b_id_farm),
        )
        .where(eq(schema.farms.b_id_farm, b_id_farm))
        .orderBy(asc(schema.fields.b_name))

    return fields
}

/**
 * Update the details of a field
 *
 * @param b_id - ID of the field.
 * @param b_name - Name of the field.
 * @param b_id_source - ID of the field in source dataset.
 * @param b_geometry - Geometry of field in WKT format
 * @param b_acquiring_date - Start date of managing field.
 * @param b_acquiring_method - Type of managing field.
 * @param b_discarding_date - End date of managing field.
 * @returns A Promise that resolves when the field has been added and returns the value for b_id.
 * @alpha
 */
export async function updateField(
    fdm: FdmType,
    b_id: schema.fieldsTypeInsert["b_id"],
    b_name?: schema.fieldsTypeInsert["b_name"],
    b_id_source?: schema.fieldsTypeInsert["b_id_source"],
    b_geometry?: schema.fieldsTypeInsert["b_geometry"],
    b_acquiring_date?: schema.fieldAcquiringTypeInsert["b_acquiring_date"],
    b_acquiring_method?: schema.fieldAcquiringTypeInsert["b_acquiring_method"],
    b_discarding_date?: schema.fieldDiscardingTypeInsert["b_discarding_date"],
): Promise<getFieldType> {
    const updatedField = await fdm.transaction(async (tx: FdmType) => {
        try {
            const updated = new Date()

            const setFields: Partial<schema.fieldsTypeInsert> = {}
            if (b_name !== undefined) {
                setFields.b_name = b_name
            }
            if (b_id_source !== undefined) {
                setFields.b_id_source = b_id_source
            }
            if (b_geometry !== undefined) {
                setFields.b_geometry = sql`${b_geometry}::geometry(polygon)`
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
        } catch (error) {
            throw new Error(`Update of field failed with error ${error}`)
        }
    })

    return updatedField
}
