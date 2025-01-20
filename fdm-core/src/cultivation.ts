import { and, eq, isNotNull, or } from "drizzle-orm"

import type { cultivationPlanType, getCultivationType } from "./cultivation.d"
import * as schema from "./db/schema"
import type { FdmType } from "./fdm"
import { createId } from "./id"

/**
 * Retrieves cultivations available in the catalogue.
 *
 * @param fdm The FDM instance.
 * @returns A Promise that resolves with an array of cultivation catalogue entries.
 * @alpha
 */
export async function getCultivationsFromCatalogue(
    fdm: FdmType,
): Promise<schema.cultivationsCatalogueTypeSelect[]> {
    const cultivationsCatalogue = await fdm
        .select()
        .from(schema.cultivationsCatalogue)

    return cultivationsCatalogue
}

/**
 * Adds a new cultivation to the catalogue.
 *
 * @param fdm The FDM instance.
 * @param properties The properties of the cultivation to add.
 * @returns A Promise that resolves when the cultivation is added.
 * @throws If the insertion fails.
 * @alpha
 */
export async function addCultivationToCatalogue(
    fdm: FdmType,
    properties: {
        b_lu_catalogue: schema.cultivationsCatalogueTypeInsert["b_lu_catalogue"]
        b_lu_source: schema.cultivationsCatalogueTypeInsert["b_lu_source"]
        b_lu_name: schema.cultivationsCatalogueTypeInsert["b_lu_name"]
        b_lu_name_en: schema.cultivationsCatalogueTypeInsert["b_lu_name_en"]
        b_lu_hcat3: schema.cultivationsCatalogueTypeInsert["b_lu_hcat3"]
        b_lu_hcat3_name: schema.cultivationsCatalogueTypeInsert["b_lu_hcat3_name"]
    },
): Promise<void> {
    await fdm.transaction(async (tx: FdmType) => {
        // Check for existing cultivation
        const existing = await tx
            .select()
            .from(schema.cultivationsCatalogue)
            .where(
                eq(
                    schema.cultivationsCatalogue.b_lu_catalogue,
                    properties.b_lu_catalogue,
                ),
            )
            .limit(1)

        if (existing.length > 0) {
            throw new Error("Cultivation already exists in catalogue")
        }

        // Insert the cultivation in the db
        await tx.insert(schema.cultivationsCatalogue).values(properties)
    })
}

/**
 * Adds a cultivation to a field.
 *
 * @param fdm The FDM instance.
 * @param b_lu_catalogue The catalogue ID of the cultivation.
 * @param b_id The ID of the field.
 * @param b_sowing_date The sowing date of the cultivation.
 * @returns A Promise that resolves with the ID of the new cultivation.
 * @throws If the field does not exist or if the insertion fails.
 * @alpha
 */
export async function addCultivation(
    fdm: FdmType,
    b_lu_catalogue: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_id: schema.fieldSowingTypeInsert["b_id"],
    b_sowing_date: schema.fieldSowingTypeInsert["b_sowing_date"],
): Promise<schema.cultivationsTypeSelect["b_lu"]> {
    // Generate an ID for the cultivation
    const b_lu = createId()

    await fdm.transaction(async (tx: FdmType) => {
        try {
            // Validate b_sowing_date is a Date object
            if (!(b_sowing_date instanceof Date)) {
                throw new Error("Invalid sowing date: Must be a Date object")
            }

            // Validate if field exists
            const field = await tx
                .select()
                .from(schema.fields)
                .where(eq(schema.fields.b_id, b_id))
                .limit(1)
            if (field.length === 0) {
                throw new Error("Field does not exist")
            }

            // Validate if cultivation exists in catalogue
            const cultivation = await tx
                .select()
                .from(schema.cultivationsCatalogue)
                .where(
                    eq(
                        schema.cultivationsCatalogue.b_lu_catalogue,
                        b_lu_catalogue,
                    ),
                )
                .limit(1)
            if (cultivation.length === 0) {
                throw new Error("Cultivation in catalogue does not exist")
            }

            // Validate if cultivation is not an duplicate of already existing cultivation
            const existingCultivation = await tx
                .select()
                .from(schema.fieldSowing)
                .leftJoin(
                    schema.cultivations,
                    eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu),
                )
                .where(
                    and(
                        eq(schema.fieldSowing.b_id, b_id),
                        or(
                            eq(schema.fieldSowing.b_lu, b_lu),
                            and(
                                eq(
                                    schema.fieldSowing.b_sowing_date,
                                    b_sowing_date,
                                ),
                                eq(
                                    schema.cultivations.b_lu_catalogue,
                                    b_lu_catalogue,
                                ),
                            ),
                        ),
                    ),
                )
                .limit(1)

            if (existingCultivation.length > 0) {
                throw new Error("Cultivation already exists")
            }

            await tx.insert(schema.cultivations).values({
                b_lu: b_lu,
                b_lu_catalogue: b_lu_catalogue,
            })

            await tx.insert(schema.fieldSowing).values({
                b_id: b_id,
                b_lu: b_lu,
                b_sowing_date: b_sowing_date,
            })
        } catch (error) {
            throw new Error(
                `addCultivation failed: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    })

    return b_lu
}

/**
 * Retrieves the details of a specific cultivation.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation.
 * @returns A promise that resolves with the cultivation details.
 * @throws If the cultivation does not exist.
 */
export async function getCultivation(
    fdm: FdmType,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
): Promise<getCultivationType> {
    // Get properties of the requested cultivation
    const cultivation = await fdm
        .select({
            b_lu: schema.cultivations.b_lu,
            b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
            b_lu_source: schema.cultivationsCatalogue.b_lu_source,
            b_lu_name: schema.cultivationsCatalogue.b_lu_name,
            b_lu_name_en: schema.cultivationsCatalogue.b_lu_name_en,
            b_lu_hcat3: schema.cultivationsCatalogue.b_lu_hcat3,
            b_lu_hcat3_name: schema.cultivationsCatalogue.b_lu_hcat3_name,
            b_sowing_date: schema.fieldSowing.b_sowing_date,
            b_id: schema.fieldSowing.b_id,
        })
        .from(schema.cultivations)
        .leftJoin(
            schema.fieldSowing,
            eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu),
        )
        .leftJoin(
            schema.cultivationsCatalogue,
            eq(
                schema.cultivations.b_lu_catalogue,
                schema.cultivationsCatalogue.b_lu_catalogue,
            ),
        )
        .where(eq(schema.cultivations.b_lu, b_lu))
        .limit(1)

    // If no cultivation is found return an error
    if (cultivation.length === 0) {
        throw new Error("Cultivation does not exist")
    }

    return cultivation[0]
}

/**
 * Retrieves all cultivations for a given field.
 *
 * @param fdm The FDM instance.
 * @param b_id The ID of the field.
 * @returns A Promise that resolves with an array of cultivation details.
 * @alpha
 */
export async function getCultivations(
    fdm: FdmType,
    b_id: schema.fieldSowingTypeSelect["b_id"],
): Promise<getCultivationType[]> {
    const cultivations = await fdm
        .select({
            b_lu: schema.cultivations.b_lu,
            b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
            b_lu_source: schema.cultivationsCatalogue.b_lu_source,
            b_lu_name: schema.cultivationsCatalogue.b_lu_name,
            b_lu_name_en: schema.cultivationsCatalogue.b_lu_name_en,
            b_lu_hcat3: schema.cultivationsCatalogue.b_lu_hcat3,
            b_lu_hcat3_name: schema.cultivationsCatalogue.b_lu_hcat3_name,
            b_sowing_date: schema.fieldSowing.b_sowing_date,
            b_id: schema.fieldSowing.b_id,
        })
        .from(schema.cultivations)
        .leftJoin(
            schema.fieldSowing,
            eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu),
        )
        .leftJoin(
            schema.cultivationsCatalogue,
            eq(
                schema.cultivations.b_lu_catalogue,
                schema.cultivationsCatalogue.b_lu_catalogue,
            ),
        )
        .where(eq(schema.fieldSowing.b_id, b_id))

    return cultivations
}

/**
 * Retrieves a cultivation plan for a specific farm.
 *
 * The cultivation plan is an array of objects, where each object represents a unique cultivation
 * identified by its `b_lu_catalogue`. Each cultivation object also contains a `fields` array,
 * listing the fields associated with that specific cultivation. Within each field object, there's
 * a `fertilizer_applications` array detailing the fertilizers applied to that field.
 *
 * @param fdm The FDM instance.
 * @param b_id_farm The ID of the farm for which to retrieve the cultivation plan.
 * @returns A Promise that resolves with an array representing the cultivation plan.
 *          Each element in the array is an object with the following structure:
 *          ```
 *          {
 *              b_lu_catalogue: string;  // Unique ID of the cultivation catalogue item
 *              b_lu_name: string;      // Name of the cultivation
 *              fields: {               // Array of fields associated with this cultivation
 *                  b_lu: string;          // Unique ID of the cultivation
 *                  b_id: string;          // Unique ID of the field
 *                  b_name: string;        // Name of the field
 *                  fertilizer_applications: { // Array of fertilizer applications on this field
 *                      p_id_catalogue: string; // Fertilizer catalogue ID
 *                      p_name_nl: string;    // Fertilizer name (Dutch)
 *                      p_app_amount: number;  // Amount applied
 *                      p_app_method: string;  // Application method
 *                      p_app_date: Date;     // Application date
 *                      p_app_id: string;      // Unique ID of the application
 *                  }[]
 *              }[];
 *          }
 *          ```
 *          Returns an empty array if no cultivations are found for the specified farm.
 * @example
 * ```typescript
 * const cultivationPlan = await getCultivationPlan(fdm, 'farm123');
 * if (cultivationPlan.length > 0) {
 *   console.log("Cultivation Plan:", cultivationPlan);
 * } else {
 *   console.log("No cultivations found for this farm.");
 * }
 * ```
 * @alpha
 */
export async function getCultivationPlan(
    fdm: FdmType,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<cultivationPlanType[]> {
    if (!b_id_farm) {
        throw new Error("Farm ID is required")
    }

    try {
        const cultivations = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                b_lu_name: schema.cultivationsCatalogue.b_lu_name,
                b_lu: schema.cultivations.b_lu,
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_app_amount: schema.fertilizerApplication.p_app_amount,
                p_app_method: schema.fertilizerApplication.p_app_method,
                p_app_date: schema.fertilizerApplication.p_app_date,
                p_app_id: schema.fertilizerApplication.p_app_id,
            })
            .from(schema.farms)
            .leftJoin(
                schema.farmManaging,
                eq(schema.farms.b_id_farm, schema.farmManaging.b_id_farm),
            )
            .leftJoin(
                schema.fields,
                eq(schema.farmManaging.b_id, schema.fields.b_id),
            )
            .leftJoin(
                schema.fieldSowing,
                eq(schema.fields.b_id, schema.fieldSowing.b_id),
            )
            .leftJoin(
                schema.cultivations,
                eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu),
            )
            .leftJoin(
                schema.cultivationsCatalogue,
                eq(
                    schema.cultivations.b_lu_catalogue,
                    schema.cultivationsCatalogue.b_lu_catalogue,
                ),
            )
            .leftJoin(
                schema.fertilizerApplication,
                eq(schema.fertilizerApplication.b_id, schema.fields.b_id),
            )
            .leftJoin(
                schema.fertilizerPicking,
                eq(
                    schema.fertilizerPicking.p_id,
                    schema.fertilizerApplication.p_id,
                ),
            )
            .leftJoin(
                schema.fertilizersCatalogue,
                eq(
                    schema.fertilizersCatalogue.p_id_catalogue,
                    schema.fertilizerPicking.p_id_catalogue,
                ),
            )
            .where(
                and(
                    eq(schema.farms.b_id_farm, b_id_farm),
                    isNotNull(schema.cultivationsCatalogue.b_lu_catalogue),
                ),
            )

        const cultivationPlan = cultivations.reduce(
            (acc: cultivationPlanType[], curr: any) => {
                let existingCultivation = acc.find(
                    (item) => item.b_lu_catalogue === curr.b_lu_catalogue,
                )

                if (!existingCultivation) {
                    existingCultivation = {
                        b_lu_catalogue: curr.b_lu_catalogue,
                        b_lu_name: curr.b_lu_name,
                        fields: [],
                    }
                    acc.push(existingCultivation)
                }

                let existingField = existingCultivation.fields.find(
                    (field) => field.b_id === curr.b_id,
                )

                if (!existingField) {
                    existingField = {
                        b_lu: curr.b_lu,
                        b_id: curr.b_id,
                        b_name: curr.b_name,
                        fertilizer_applications: [],
                    }
                    existingCultivation.fields.push(existingField)
                }

                if (curr.p_app_id) {
                    // Only add if it's a fertilizer application
                    existingField.fertilizer_applications.push({
                        p_id_catalogue: curr.p_id_catalogue,
                        p_name_nl: curr.p_name_nl,
                        p_app_amount: curr.p_app_amount,
                        p_app_method: curr.p_app_method,
                        p_app_date: curr.p_app_date,
                        p_app_id: curr.p_app_id,
                    })
                }

                return acc
            },
            [],
        )

        return cultivationPlan
    } catch (error) {
        throw new Error(`Failed to get cultivation plan: ${error}`)
    }
}

/**
 * Removes a cultivation from a field.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation to remove.
 * @returns A Promise that resolves when the cultivation is removed.
 * @throws If the deletion fails.
 * @alpha
 */
export async function removeCultivation(
    fdm: FdmType,
    b_lu: schema.cultivationsTypeInsert["b_lu"],
): Promise<void> {
    await fdm.transaction(async (tx: FdmType) => {
        try {
            const existing = await tx
                .select()
                .from(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .limit(1)

            if (existing.length === 0) {
                throw new Error(`Cultivation with b_lu ${b_lu} does not exist`)
            }

            await tx
                .delete(schema.fieldSowing)
                .where(eq(schema.fieldSowing.b_lu, b_lu))

            await tx
                .delete(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
        } catch (error) {
            throw new Error(`Failed to remove cultivation: ${error}`)
        }
    })
}

/**
 * Updates an existing cultivation.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation to update.
 * @param b_lu_catalogue The catalogue ID of the cultivation.
 * @param b_sowing_date The sowing date of the cultivation.
 * @returns A Promise that resolves when the cultivation is updated.
 * @throws If the update fails.
 * @alpha
 */
export async function updateCultivation(
    fdm: FdmType,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
    b_lu_catalogue?: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_sowing_date?: schema.fieldSowingTypeInsert["b_sowing_date"],
): Promise<void> {
    await fdm.transaction(async (tx: FdmType) => {
        try {
            // Validate if cultivation exists
            const cultivation = await tx
                .select()
                .from(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .limit(1)

            if (cultivation.length === 0) {
                throw new Error("Cultivation does not exist")
            }

            const updated = new Date()

            if (b_lu_catalogue) {
                // Validate if cultivation exists in catalogue
                const cultivationCatalogue = await tx
                    .select()
                    .from(schema.cultivationsCatalogue)
                    .where(
                        eq(
                            schema.cultivationsCatalogue.b_lu_catalogue,
                            b_lu_catalogue,
                        ),
                    )
                    .limit(1)
                if (cultivationCatalogue.length === 0) {
                    throw new Error("Cultivation in catalogue does not exist")
                }

                await tx
                    .update(schema.cultivations)
                    .set({ updated: updated, b_lu_catalogue: b_lu_catalogue })
                    .where(eq(schema.cultivations.b_lu, b_lu))
            }

            if (b_sowing_date) {
                // Validate b_sowing_date is a Date object
                if (!(b_sowing_date instanceof Date)) {
                    throw new Error(
                        "Invalid sowing date: Must be a Date object",
                    )
                }

                await tx
                    .update(schema.fieldSowing)
                    .set({ updated: updated, b_sowing_date: b_sowing_date })
                    .where(eq(schema.fieldSowing.b_lu, b_lu))
            }
        } catch (error) {
            throw new Error(
                `updateCultivation failed: ${error instanceof Error ? error.message : String(error)}`,
            )
        }
    })
}
