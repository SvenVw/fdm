import { eq, sql } from "drizzle-orm"
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
 * @param b_manage_start - Start date of managing field.
 * @param b_manage_end - End date of managing field.
 * @param b_manage_type - Type of managing field.
 * @returns A Promise that resolves when the field has been added and returns the value for b_id.
 * @alpha
 */
export async function addField(
    fdm: FdmType,
    b_id_farm: schema.farmManagingTypeInsert["b_id_farm"],
    b_name: schema.fieldsTypeInsert["b_name"],
    b_id_source: schema.fieldsTypeInsert["b_id_source"],
    b_geometry: schema.fieldsTypeInsert["b_geometry"],
    b_manage_start: schema.farmManagingTypeInsert["b_manage_start"],
    b_manage_end: schema.farmManagingTypeInsert["b_manage_end"],
    b_manage_type: schema.farmManagingTypeInsert["b_manage_type"],
): Promise<schema.fieldsTypeInsert["b_id"]> {
    // Generate an ID for the field
    const b_id = createId()

    try {
        // Insert field
        const fieldData = {
            b_id: b_id,
            b_name: b_name,
            b_id_source: b_id_source,
            b_geometry: sql`${b_geometry}::geometry(polygon)`,
        }
        await fdm.insert(schema.fields).values(fieldData)

        // Insert relation between farm and field
        const farmManagingData = {
            b_id,
            b_id_farm,
            b_manage_start,
            b_manage_end,
            b_manage_type,
        }
        await fdm.insert(schema.farmManaging).values(farmManagingData)
    } catch (error) {
        throw new Error(`Addition of field failed with error ${error}`)
    }

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
            b_id_farm: schema.farmManaging.b_id_farm,
            b_id_source: schema.fields.b_id_source,
            b_geometry: schema.fields.b_geometry,
            b_area: sql<number>`ST_Area(b_geometry::geography)/10000`,
            b_manage_start: schema.farmManaging.b_manage_start,
            b_manage_end: schema.farmManaging.b_manage_end,
            b_manage_type: schema.farmManaging.b_manage_type,
            created: schema.fields.created,
            updated: schema.fields.updated,
        })
        .from(schema.fields)
        .innerJoin(
            schema.farmManaging,
            eq(schema.fields.b_id, schema.farmManaging.b_id),
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
            b_manage_start: schema.farmManaging.b_manage_start,
            b_manage_end: schema.farmManaging.b_manage_end,
            b_manage_type: schema.farmManaging.b_manage_type,
            created: schema.fields.created,
            updated: schema.fields.updated,
        })
        .from(schema.fields)
        .innerJoin(
            schema.farmManaging,
            eq(schema.fields.b_id, schema.farmManaging.b_id),
        )
        .innerJoin(
            schema.farms,
            eq(schema.farms.b_id_farm, schema.farmManaging.b_id_farm),
        )
        .where(eq(schema.farms.b_id_farm, b_id_farm))

    return fields
}

/**
 * Update the details of a field
 *
 * @param b_id - ID of the field.
 * @param b_name - Name of the field.
 * @param b_id_source - ID of the field in source dataset.
 * @param b_geometry - Geometry of field in WKT format
 * @param b_manage_start - Start date of managing field.
 * @param b_manage_end - End date of managing field.
 * @param b_manage_type - Type of managing field.
 * @returns A Promise that resolves when the field has been added and returns the value for b_id.
 * @alpha
 */
export async function updateField(
    fdm: FdmType,
    b_id: schema.fieldsTypeInsert["b_id"],
    b_name: schema.fieldsTypeInsert["b_name"],
    b_id_source: schema.fieldsTypeInsert["b_id_source"],
    b_geometry: schema.fieldsTypeInsert["b_geometry"],
    b_manage_start: schema.farmManagingTypeInsert["b_manage_start"],
    b_manage_end: schema.farmManagingTypeInsert["b_manage_end"],
    b_manage_type: schema.farmManagingTypeInsert["b_manage_type"],
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

            const setFarmManaging: Partial<schema.farmManagingTypeInsert> = {}
            if (b_manage_start !== undefined) {
                setFarmManaging.b_manage_start = b_manage_start
            }
            if (b_manage_end !== undefined) {
                setFarmManaging.b_manage_end = b_manage_end
            }
            if (b_manage_type !== undefined) {
                setFarmManaging.b_manage_type = b_manage_type
            }
            setFarmManaging.updated = updated

            await tx
                .update(schema.farmManaging)
                .set(setFarmManaging)
                .where(eq(schema.farmManaging.b_id, b_id))

            const field = await tx
                .select({
                    b_id: schema.fields.b_id,
                    b_name: schema.fields.b_name,
                    b_id_farm: schema.farmManaging.b_id_farm,
                    b_id_source: schema.fields.b_id_source,
                    b_geometry: schema.fields.b_geometry,
                    b_manage_start: schema.farmManaging.b_manage_start,
                    b_manage_end: schema.farmManaging.b_manage_end,
                    b_manage_type: schema.farmManaging.b_manage_type,
                    created: schema.fields.created,
                    updated: schema.fields.updated,
                })
                .from(schema.fields)
                .innerJoin(
                    schema.farmManaging,
                    eq(schema.fields.b_id, schema.farmManaging.b_id),
                )
                .where(eq(schema.fields.b_id, b_id))
                .limit(1)
            return field[0]
        } catch (error) {
            throw new Error(`Update of field failed with error ${error}`)
        }
    })

    return updatedField
}
