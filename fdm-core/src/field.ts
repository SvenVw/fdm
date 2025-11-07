/**
 * @file This file contains functions for managing fields in the FDM.
 *
 * It provides a comprehensive set of CRUD operations for fields, as well as functions
 * for listing available acquiring methods and determining if a field is productive.
 */
import {
    and,
    desc,
    eq,
    gte,
    inArray,
    isNotNull,
    isNull,
    lte,
    or,
    type SQL,
    sql,
} from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { Field } from "./field.d"
import { createId } from "./id"
import type { Timeframe } from "./timeframe"

/**
 * Adds a new field to a farm.
 *
 * This function creates a new field and associates it with a farm. It performs validation to ensure
 * that the acquiring date is before the discarding date, if provided.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_name The name of the new field.
 * @param b_id_source An external identifier for the field.
 * @param b_geometry The geometry of the field in GeoJSON format.
 * @param b_start The date when the field was acquired.
 * @param b_acquiring_method The method of acquisition.
 * @param b_end The date when the field was discarded (optional).
 * @returns A promise that resolves to the unique identifier of the newly created field.
 * @throws An error if the principal does not have permission or if the provided dates are invalid.
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

            // Validate b_acquiring_method is of the possible options, otherwise log an warning and insert 'unknown'
            if (
                b_acquiring_method &&
                !schema.acquiringMethodOptions
                    .map((option) => option.value)
                    .includes(b_acquiring_method)
            ) {
                console.warn(
                    `Invalid b_acquiring_method: ${b_acquiring_method}. Inserting as 'unknown'.`,
                )
                b_acquiring_method = "unknown"
            }

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
 * Retrieves a single field by its unique identifier.
 *
 * This function fetches detailed information about a field, including its geometry, area, and
 * whether it is considered productive.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id The unique identifier of the field.
 * @returns A promise that resolves to a `Field` object.
 * @throws An error if the principal does not have permission or if the field is not found.
 */
export async function getField(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fieldsTypeSelect["b_id"],
): Promise<Field> {
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
                b_centroid_x: sql<number>`ST_X(ST_Centroid(b_geometry))`,
                b_centroid_y: sql<number>`ST_Y(ST_Centroid(b_geometry))`,
                b_area: sql<number>`ROUND((ST_Area(b_geometry::geography)/10000)::NUMERIC, 2)::FLOAT`,
                b_perimeter: sql<number>`ROUND((ST_Length(ST_ExteriorRing(b_geometry)::geography))::NUMERIC, 2)::FLOAT`,
                b_start: schema.fieldAcquiring.b_start,
                b_end: schema.fieldDiscarding.b_end,
                b_acquiring_method: schema.fieldAcquiring.b_acquiring_method,
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

        // Process the centroid string into a tuple
        field[0].b_centroid = [field[0].b_centroid_x, field[0].b_centroid_y]
        field[0].b_centroid_x = undefined
        field[0].b_centroid_y = undefined
        field[0].b_isproductive = determineIfFieldIsProductive(
            field[0].b_area,
            field[0].b_perimeter,
            field[0].b_name,
        )

        return field[0]
    } catch (err) {
        throw handleError(err, "Exception for getField", { b_id })
    }
}

/**
 * Retrieves all fields for a farm, optionally filtered by a timeframe.
 *
 * This function lists all fields associated with a farm. The results can be filtered to a specific
 * time range to only include fields that were active during that time.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param timeframe An optional timeframe to filter the fields.
 * @returns A promise that resolves to an array of `Field` objects.
 * @throws An error if the principal does not have permission.
 */
export async function getFields(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    timeframe?: Timeframe,
): Promise<Field[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getFields",
        )

        let whereClause: SQL | undefined

        if (timeframe?.start && timeframe.end) {
            whereClause = and(
                eq(schema.fieldAcquiring.b_id_farm, b_id_farm),
                and(
                    // Check if the acquiring date is within the timeframe
                    lte(schema.fieldAcquiring.b_start, timeframe.end),
                ),
                // Check if there is a discarding date and if it is within the timeframe
                or(
                    isNull(schema.fieldDiscarding.b_end),
                    and(
                        isNotNull(schema.fieldDiscarding.b_end),
                        gte(schema.fieldDiscarding.b_end, timeframe.start),
                    ),
                ),
            )
        } else if (timeframe?.start) {
            whereClause = and(
                eq(schema.fieldAcquiring.b_id_farm, b_id_farm),
                or(
                    isNull(schema.fieldDiscarding.b_end),
                    and(
                        isNotNull(schema.fieldDiscarding.b_end),
                        gte(schema.fieldDiscarding.b_end, timeframe.start),
                    ),
                ),
            )
        } else if (timeframe?.end) {
            whereClause = and(
                eq(schema.fieldAcquiring.b_id_farm, b_id_farm),
                lte(schema.fieldAcquiring.b_start, timeframe.end),
            )
        } else {
            whereClause = eq(schema.fieldAcquiring.b_id_farm, b_id_farm)
        }

        // Get properties of the requested field
        const fields = await fdm
            .select({
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                b_id_farm: schema.fieldAcquiring.b_id_farm,
                b_id_source: schema.fields.b_id_source,
                b_geometry: schema.fields.b_geometry,
                b_centroid_x: sql<number>`ST_X(ST_Centroid(b_geometry))`,
                b_centroid_y: sql<number>`ST_Y(ST_Centroid(b_geometry))`,
                b_area: sql<number>`ROUND((ST_Area(b_geometry::geography)/10000)::NUMERIC, 2)::FLOAT`,
                b_perimeter: sql<number>`ROUND((ST_Length(ST_ExteriorRing(b_geometry)::geography))::NUMERIC, 2)::FLOAT`,
                b_start: schema.fieldAcquiring.b_start,
                b_acquiring_method: schema.fieldAcquiring.b_acquiring_method,
                b_end: schema.fieldDiscarding.b_end,
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
            .where(whereClause)
            .orderBy(desc(sql<number>`ST_Area(b_geometry::geography)`))

        // Process the centroids into a tuple
        for (const field of fields) {
            field.b_centroid = [field.b_centroid_x, field.b_centroid_y]
            field.b_centroid_x = undefined
            field.b_centroid_y = undefined
            field.b_isproductive = determineIfFieldIsProductive(
                field.b_area,
                field.b_perimeter,
                field.b_name,
            )
        }

        return fields
    } catch (err) {
        throw handleError(err, "Exception for getFields", { b_id_farm })
    }
}

/**
 * Updates the properties of an existing field.
 *
 * This function allows for the modification of a field's details. It performs validation to ensure
 * that the acquiring date is before the discarding date.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id The unique identifier of the field to update.
 * @param b_name The new name for the field (optional).
 * @param b_id_source The new external identifier for the field (optional).
 * @param b_geometry The new geometry for the field (optional).
 * @param b_start The new acquiring date for the field (optional).
 * @param b_acquiring_method The new acquiring method for the field (optional).
 * @param b_end The new discarding date for the field (optional).
 * @returns A promise that resolves to the updated `Field` object.
 * @throws An error if the principal does not have permission or if the provided dates are invalid.
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
): Promise<Field> {
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
            throw handleError(err, "Exception for updateField", {
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

/**
 * Deletes a field and all its associated data.
 *
 * This function performs a cascaded delete of a field, including all its cultivations,
 * fertilizer applications, soil analyses, and harvests.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id The unique identifier of the field to delete.
 * @returns A promise that resolves when the field has been successfully deleted.
 * @throws An error if the principal does not have permission.
 */
export async function removeField(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fieldsTypeSelect["b_id"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "field",
            "write",
            b_id,
            principal_id,
            "removeField",
        )

        await fdm.transaction(async (tx: FdmType) => {
            // Step 1: Get all cultivation IDs for the given field
            const cultivations = await tx
                .select({ b_lu: schema.cultivationStarting.b_lu })
                .from(schema.cultivationStarting)
                .where(eq(schema.cultivationStarting.b_id, b_id))

            if (cultivations.length > 0) {
                const cultivationIds = cultivations.map((c) => c.b_lu)

                // Step 2: Get all harvestable IDs from these cultivations
                const harvestings = await tx
                    .select({
                        b_id_harvestable:
                            schema.cultivationHarvesting.b_id_harvestable,
                    })
                    .from(schema.cultivationHarvesting)
                    .where(
                        inArray(
                            schema.cultivationHarvesting.b_lu,
                            cultivationIds,
                        ),
                    )

                if (harvestings.length > 0) {
                    const harvestableIds = harvestings.map(
                        (h) => h.b_id_harvestable,
                    )

                    // Step 3: Get all harvestable analysis IDs from these harvestables
                    const harvestableSamplings = await tx
                        .select({
                            b_id_harvestable_analysis:
                                schema.harvestableSampling
                                    .b_id_harvestable_analysis,
                        })
                        .from(schema.harvestableSampling)
                        .where(
                            inArray(
                                schema.harvestableSampling.b_id_harvestable,
                                harvestableIds,
                            ),
                        )

                    if (harvestableSamplings.length > 0) {
                        const harvestableAnalysisIds = harvestableSamplings.map(
                            (hs) => hs.b_id_harvestable_analysis,
                        )

                        // Step 4: Delete from harvestable_sampling first
                        await tx
                            .delete(schema.harvestableSampling)
                            .where(
                                inArray(
                                    schema.harvestableSampling
                                        .b_id_harvestable_analysis,
                                    harvestableAnalysisIds,
                                ),
                            )

                        // Step 5: Delete from harvestable_analyses
                        await tx
                            .delete(schema.harvestableAnalyses)
                            .where(
                                inArray(
                                    schema.harvestableAnalyses
                                        .b_id_harvestable_analysis,
                                    harvestableAnalysisIds,
                                ),
                            )
                    }

                    // Step 6: Delete from cultivation_harvesting
                    await tx
                        .delete(schema.cultivationHarvesting)
                        .where(
                            inArray(
                                schema.cultivationHarvesting.b_lu,
                                cultivationIds,
                            ),
                        )

                    // Step 7: Delete from harvestables
                    await tx
                        .delete(schema.harvestables)
                        .where(
                            inArray(
                                schema.harvestables.b_id_harvestable,
                                harvestableIds,
                            ),
                        )
                }

                // Step 8: Delete from cultivation_starting, cultivation_ending and cultivations
                await tx
                    .delete(schema.cultivationStarting)
                    .where(
                        inArray(
                            schema.cultivationStarting.b_lu,
                            cultivationIds,
                        ),
                    )
                await tx
                    .delete(schema.cultivationEnding)
                    .where(
                        inArray(schema.cultivationEnding.b_lu, cultivationIds),
                    )
                await tx
                    .delete(schema.cultivations)
                    .where(inArray(schema.cultivations.b_lu, cultivationIds))
            }

            // Step 9: Get all soil analysis IDs for the field
            const soilSamplings = await tx
                .select({ a_id: schema.soilSampling.a_id })
                .from(schema.soilSampling)
                .where(eq(schema.soilSampling.b_id, b_id))

            if (soilSamplings.length > 0) {
                const soilAnalysisIds = soilSamplings.map((ss) => ss.a_id)

                // Step 10: Delete from soil_sampling first
                await tx
                    .delete(schema.soilSampling)
                    .where(inArray(schema.soilSampling.a_id, soilAnalysisIds))

                // Step 11: Delete from soil_analysis
                await tx
                    .delete(schema.soilAnalysis)
                    .where(inArray(schema.soilAnalysis.a_id, soilAnalysisIds))
            }

            // Step 12: Delete from fertilizer_applying, field_discarding, and field_acquiring
            await tx
                .delete(schema.fertilizerApplication)
                .where(eq(schema.fertilizerApplication.b_id, b_id))
            await tx
                .delete(schema.fieldDiscarding)
                .where(eq(schema.fieldDiscarding.b_id, b_id))
            await tx
                .delete(schema.fieldAcquiring)
                .where(eq(schema.fieldAcquiring.b_id, b_id))

            // Step 13: Finally, delete the field itself
            await tx.delete(schema.fields).where(eq(schema.fields.b_id, b_id))
        })
    } catch (err) {
        throw handleError(err, "Exception for removeField", { b_id })
    }
}

/**
 * Lists all available methods for acquiring a field.
 *
 * @returns An array of objects, each with a `value` and `label` property.
 */
export function listAvailableAcquiringMethods(): {
    value: schema.fieldAcquiringTypeSelect["b_acquiring_method"]
    label: string
}[] {
    return schema.acquiringMethodOptions
}

/**
 * Determines if a field is likely to be a productive agricultural field.
 *
 * This function uses a heuristic based on the field's shape and name to guess whether it is a
 * productive field or a non-productive area like a buffer strip.
 *
 * @param b_area The area of the field in hectares.
 * @param b_perimeter The perimeter of the field in meters.
 * @param b_name The name of the field.
 * @returns `true` if the field is likely productive, otherwise `false`.
 * @internal
 */
export function determineIfFieldIsProductive(
    b_area: number,
    b_perimeter: number,
    b_name: schema.fieldsTypeSelect["b_name"],
) {
    // Sven found that a ratio for a field with Perimeter (m) / SQRT(Area (m^2)) usually differentiates buffferstrips from "normal"  fields when the ratio is larger than 20 and area smaller than 2.5 ha
    const BUFFERSTROKEN_CONSTANT = 20
    const productiveAssumedByShape =
        b_perimeter / Math.sqrt(b_area * 10000) < BUFFERSTROKEN_CONSTANT ||
        b_area >= 2.5

    // Check if name contains 'buffer'
    const productiveAssumedByName = !b_name.toLowerCase().includes("buffer")

    return productiveAssumedByShape && productiveAssumedByName
}
