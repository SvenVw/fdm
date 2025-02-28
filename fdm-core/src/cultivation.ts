import { and, asc, desc, eq, isNotNull, or } from "drizzle-orm"
import type { cultivationPlanType, getCultivationType } from "./cultivation.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import {
    addHarvest,
    getHarvestableTypeOfCultivation,
    getHarvests,
} from "./harvest"
import { createId } from "./id"
import { checkPermission } from "./authorization"
import type {PrincipalId} from "./authorization.d"

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
        b_lu_harvestable: schema.cultivationsCatalogueTypeInsert["b_lu_harvestable"]
        b_lu_hcat3: schema.cultivationsCatalogueTypeInsert["b_lu_hcat3"]
        b_lu_hcat3_name: schema.cultivationsCatalogueTypeInsert["b_lu_hcat3_name"]
    },
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
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
    } catch (err) {
        throw handleError(err, "Exception for addCultivationToCatalogue", {
            properties,
        })
    }
}

/**
 * Adds a cultivation to a field.
 *
 * @param fdm The FDM instance.
 * @param principal_id - The id of the principal that is adding the cultivation
 * @param b_lu_catalogue The catalogue ID of the cultivation.
 * @param b_id The ID of the field.
 * @param b_sowing_date The sowing date of the cultivation.
 * @param b_terminating_date The termination date of the cultivation.
 * @returns A Promise that resolves with the ID of the new cultivation.
 * @throws If the field does not exist or if the insertion fails.
 * @alpha
 */
export async function addCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu_catalogue: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_id: schema.fieldSowingTypeInsert["b_id"],
    b_sowing_date: schema.fieldSowingTypeInsert["b_sowing_date"],
    b_terminating_date?: schema.cultivationTerminatingTypeInsert["b_terminating_date"],
): Promise<schema.cultivationsTypeSelect["b_lu"]> {
    try {
        await checkPermission(fdm, "field", "write", b_id, principal_id)

        return await fdm.transaction(async (tx: FdmType) => {
            // Generate an ID for the cultivation
            const b_lu = createId()

            // Validate b_sowing_date is a Date object
            if (!(b_sowing_date instanceof Date)) {
                throw new Error("Invalid sowing date: Must be a Date object")
            }

            if (b_terminating_date) {
                // Validate if terminate date is a Date object
                if (!(b_terminating_date instanceof Date)) {
                    throw new Error(
                        "Invalid terminate date: Must be a Date object",
                    )
                }

                // Validate if terminate date is after sowing date
                if (b_terminating_date <= b_sowing_date) {
                    throw new Error("Terminate date must be after sowing date")
                }
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

            await tx.insert(schema.cultivationTerminating).values({
                b_lu: b_lu,
                b_terminating_date: b_terminating_date,
            })

            if (b_terminating_date) {
                const harvestableType = await getHarvestableTypeOfCultivation(
                    tx,
                    b_lu,
                )

                if (harvestableType === "once") {
                    // If cultivation can only be harvested once, add harvest on terminate date
                    await addHarvest(
                        tx,
                        b_lu,
                        b_terminating_date,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                    )
                }
            }
            return b_lu
        })
    } catch (err) {
        throw handleError(err, "Exception for addCultivation", {
            b_lu_catalogue,
            b_id,
            b_sowing_date,
            b_terminating_date,
        })
    }
}

/**
 * Retrieves the details of a specific cultivation.
 *
 * @param fdm The FDM instance.
 * @param principal_id - The id of the principal that is requesting the cultivation
 * @param b_lu The ID of the cultivation.
 * @returns A promise that resolves with the cultivation details.
 * @throws If the cultivation does not exist.
 */
export async function getCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
): Promise<getCultivationType> {
    try {
        await checkPermission(fdm, "cultivation", "read", b_lu, principal_id)

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
                b_terminating_date:
                    schema.cultivationTerminating.b_terminating_date,
                b_id: schema.fieldSowing.b_id,
            })
            .from(schema.cultivations)
            .leftJoin(
                schema.fieldSowing,
                eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu),
            )
            .leftJoin(
                schema.cultivationTerminating,
                eq(
                    schema.cultivationTerminating.b_lu,
                    schema.cultivations.b_lu,
                ),
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
    } catch (err) {
        throw handleError(err, "Exception for getCultivation", { b_lu })
    }
}

/**
 * Retrieves all cultivations for a given field.
 *
 * @param fdm The FDM instance.
 * @param principal_id - The id of the principal that is requesting the cultivations
 * @param b_id The ID of the field.
 * @returns A Promise that resolves with an array of cultivation details.
 * @alpha
 */
export async function getCultivations(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.fieldSowingTypeSelect["b_id"],
): Promise<getCultivationType[]> {
    try {
        await checkPermission(fdm, "field", "read", b_id, principal_id)
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
                b_terminating_date:
                    schema.cultivationTerminating.b_terminating_date,
                b_id: schema.fieldSowing.b_id,
            })
            .from(schema.cultivations)
            .leftJoin(
                schema.fieldSowing,
                eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu),
            )
            .leftJoin(
                schema.cultivationTerminating,
                eq(
                    schema.cultivationTerminating.b_lu,
                    schema.cultivations.b_lu,
                ),
            )
            .leftJoin(
                schema.cultivationsCatalogue,
                eq(
                    schema.cultivations.b_lu_catalogue,
                    schema.cultivationsCatalogue.b_lu_catalogue,
                ),
            )
            .where(eq(schema.fieldSowing.b_id, b_id))
            .orderBy(
                desc(schema.fieldSowing.b_sowing_date),
                asc(schema.cultivationsCatalogue.b_lu_name),
            )

        return cultivations
    } catch (err) {
        throw handleError(err, "Exception for getCultivations", { b_id })
    }
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
 * @param principal_id - The id of the principal that is requesting the cultivation plan
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
 *                  harvests: { Array of harvests for this field
 *                      b_id_harvesting: string; // Unique ID of the harvest
 *                      b_harvesting_date: Date; // Harvest date
 *                      harvestables: {        // Array of harvestables associated with this harvest.  Currently, only one harvestable per harvest is supported.
 *                          b_id_harvestable: string; // Unique ID of the harvestable
 *                          harvestable_analyses: {  // Analyses of the harvestable. Currently, only one analysis per harvestable is supported.
 *                              b_lu_yield: number;      // Yield in kg/ha
 *                              b_lu_n_harvestable: number; // N content in harvestable yield (g N/kg)
 *                              b_lu_n_residue: number;   // N content in residue (g N/kg)
 *                              b_lu_p_harvestable: number; // P content in harvestable yield (g P2O5/kg)
 *                              b_lu_p_residue: number;   // P content in residue (g P2O5/kg)
 *                              b_lu_k_harvestable: number; // K content in harvestable yield (g K2O/kg)
 *                              b_lu_k_residue: number;   // K content in residue (g K2O/kg)
 *                          }[];
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
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<cultivationPlanType[]> {
    try {
        if (!b_id_farm) {
            throw new Error("Farm ID is required")
        }
        await checkPermission(fdm, "farm", "read", b_id_farm, principal_id)

        const cultivations = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                b_lu_name: schema.cultivationsCatalogue.b_lu_name,
                b_lu: schema.cultivations.b_lu,
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                b_sowing_date: schema.fieldSowing.b_sowing_date,
                b_terminating_date:
                    schema.cultivationTerminating.b_terminating_date,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_app_amount: schema.fertilizerApplication.p_app_amount,
                p_app_method: schema.fertilizerApplication.p_app_method,
                p_app_date: schema.fertilizerApplication.p_app_date,
                p_app_id: schema.fertilizerApplication.p_app_id,
                b_id_harvesting: schema.cultivationHarvesting.b_id_harvesting,
                b_harvesting_date:
                    schema.cultivationHarvesting.b_harvesting_date,
                b_lu_yield: schema.harvestableAnalyses.b_lu_yield,
                b_lu_n_harvestable:
                    schema.harvestableAnalyses.b_lu_n_harvestable,
                b_lu_n_residue: schema.harvestableAnalyses.b_lu_n_residue,
                b_lu_p_harvestable:
                    schema.harvestableAnalyses.b_lu_p_harvestable,
                b_lu_p_residue: schema.harvestableAnalyses.b_lu_p_residue,
                b_lu_k_harvestable:
                    schema.harvestableAnalyses.b_lu_k_harvestable,
                b_lu_k_residue: schema.harvestableAnalyses.b_lu_k_residue,
            })
            .from(schema.farms)
            .leftJoin(
                schema.fieldAcquiring,
                eq(schema.farms.b_id_farm, schema.fieldAcquiring.b_id_farm),
            )
            .leftJoin(
                schema.fields,
                eq(schema.fieldAcquiring.b_id, schema.fields.b_id),
            )
            .leftJoin(
                schema.fieldSowing,
                eq(schema.fields.b_id, schema.fieldSowing.b_id),
            )
            .leftJoin(
                schema.cultivationTerminating,
                eq(schema.cultivationTerminating.b_lu, schema.fieldSowing.b_lu),
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
            .leftJoin(
                schema.cultivationHarvesting,
                eq(schema.cultivations.b_lu, schema.cultivationHarvesting.b_lu),
            )
            .leftJoin(
                schema.harvestables,
                eq(
                    schema.cultivationHarvesting.b_id_harvestable,
                    schema.harvestables.b_id_harvestable,
                ),
            )
            .leftJoin(
                schema.harvestableSampling,
                eq(
                    schema.harvestables.b_id_harvestable,
                    schema.harvestableSampling.b_id_harvestable,
                ),
            )
            .leftJoin(
                schema.harvestableAnalyses,
                eq(
                    schema.harvestableSampling.b_id_harvestable_analysis,
                    schema.harvestableAnalyses.b_id_harvestable_analysis,
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
                    (item) =>
                        item.b_lu_catalogue === curr.b_lu_catalogue &&
                        (item.b_sowing_date?.getTime() ?? 0) ===
                            (curr.b_sowing_date?.getTime() ?? 0) &&
                        (item.b_terminating_date?.getTime() ?? 0) ===
                            (curr.b_terminating_date?.getTime() ?? 0),
                )

                if (!existingCultivation) {
                    existingCultivation = {
                        b_lu_catalogue: curr.b_lu_catalogue,
                        b_lu_name: curr.b_lu_name,
                        b_sowing_date: curr.b_sowing_date,
                        b_terminating_date: curr.b_terminating_date,
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
                        harvests: [],
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

                if (curr.b_id_harvesting) {
                    // Only add if it's a harvest
                    existingField.harvests.push({
                        b_id_harvesting: curr.b_id_harvesting,
                        b_harvesting_date: curr.b_harvesting_date,
                        harvestables: [
                            {
                                b_id_harvestable: curr.b_id_harvestable,
                                harvestable_analyses: [
                                    {
                                        b_lu_yield: curr.b_lu_yield,
                                        b_lu_n_harvestable:
                                            curr.b_lu_n_harvestable,
                                        b_lu_n_residue: curr.b_lu_n_residue,
                                        b_lu_p_harvestable:
                                            curr.b_lu_p_harvestable,
                                        b_lu_p_residue: curr.b_lu_p_residue,
                                        b_lu_k_harvestable:
                                            curr.b_lu_k_harvestable,
                                        b_lu_k_residue: curr.b_lu_k_residue,
                                    },
                                ],
                            },
                        ],
                    })
                }

                return acc
            },
            [],
        )

        return cultivationPlan
    } catch (err) {
        throw handleError(err, "Exception for getCultivationPlan", {
            b_id_farm,
        })
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
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeInsert["b_lu"],
): Promise<void> {
    try {
        await checkPermission(fdm, "cultivation", "write", b_lu, principal_id)
        return await fdm.transaction(async (tx: FdmType) => {
            const existing = await tx
                .select()
                .from(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .limit(1)

            if (existing.length === 0) {
                throw new Error("Cultivation does not exist")
            }

            await tx
                .delete(schema.cultivationTerminating)
                .where(eq(schema.cultivationTerminating.b_lu, b_lu))

            await tx
                .delete(schema.fieldSowing)
                .where(eq(schema.fieldSowing.b_lu, b_lu))

            await tx
                .delete(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
        })
    } catch (err) {
        handleError(err, "Exception for removeCultivation", { b_lu })
    }
}

/**
 * Updates an existing cultivation.
 *
 * @param fdm The FDM instance.
 * @param principal_id - The id of the principal that is updating the cultivation
 * @param b_lu The ID of the cultivation to update.
 * @param b_lu_catalogue? The catalogue ID of the cultivation.
 * @param b_sowing_date? The sowing date of the cultivation.
 * @param b_terminating_date? The termination date of the cultivation
 * @returns A Promise that resolves when the cultivation is updated.
 * @throws If the update fails.
 * @alpha
 */
export async function updateCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
    b_lu_catalogue?: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_sowing_date?: schema.fieldSowingTypeInsert["b_sowing_date"],
    b_terminating_date?: schema.cultivationTerminatingTypeInsert["b_terminating_date"],
): Promise<void> {
    try {
        const updated = new Date()

        await checkPermission(fdm, "cultivation", "write", b_lu, principal_id)

        if (
            b_sowing_date &&
            b_terminating_date &&
            b_terminating_date.getTime() <= b_sowing_date.getTime()
        ) {
            throw new Error("Terminate date must be after sowing date")
        }
        return await fdm.transaction(async (tx: FdmType) => {
            // Check if cultivation exists *before* attempting updates
            const existingCultivation = await tx
                .select()
                .from(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .limit(1)

            if (existingCultivation.length === 0) {
                throw new Error("Cultivation does not exist")
            }

            if (b_lu_catalogue) {
                //Validate if the cultivation exists in catalogue
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
                    throw new Error("Cultivation does not exist in catalogue")
                }

                await tx
                    .update(schema.cultivations)
                    .set({ b_lu_catalogue: b_lu_catalogue, updated: updated })
                    .where(eq(schema.cultivations.b_lu, b_lu))
            }

            if (b_sowing_date) {
                // Validate if sowing date is before termination date
                if (!b_terminating_date) {
                    const result = await tx
                        .select({
                            b_terminating_date:
                                schema.cultivationTerminating
                                    .b_terminating_date,
                        })
                        .from(schema.cultivationTerminating)
                        .where(
                            and(
                                eq(schema.cultivationTerminating.b_lu, b_lu),
                                isNotNull(
                                    schema.cultivationTerminating
                                        .b_terminating_date,
                                ),
                            ),
                        )
                        .limit(1)

                    if (result.length > 0) {
                        if (
                            b_sowing_date.getTime() >=
                            result[0].b_terminating_date.getTime()
                        ) {
                            throw new Error(
                                "Sowing date must be before termination date",
                            )
                        }
                    }
                }

                await tx
                    .update(schema.fieldSowing)
                    .set({ updated: updated, b_sowing_date: b_sowing_date })
                    .where(eq(schema.fieldSowing.b_lu, b_lu))
            }

            if (b_terminating_date) {
                // Validate if terminatinge date is after sowing date
                if (!b_sowing_date) {
                    const result = await tx
                        .select({
                            b_sowing_date: schema.fieldSowing.b_sowing_date,
                        })
                        .from(schema.fieldSowing)
                        .where(
                            and(
                                eq(schema.fieldSowing.b_lu, b_lu),
                                isNotNull(schema.fieldSowing.b_sowing_date),
                            ),
                        )
                        .limit(1)

                    if (result.length > 0) {
                        if (
                            result[0].b_sowing_date.getTime() >=
                            b_terminating_date.getTime()
                        ) {
                            throw new Error(
                                "Terminate date must be after sowing date",
                            )
                        }
                    }
                }

                await tx
                    .update(schema.cultivationTerminating)
                    .set({
                        updated: updated,
                        b_terminating_date: b_terminating_date,
                    })
                    .where(eq(schema.cultivationTerminating.b_lu, b_lu))

                const harvestableType = await getHarvestableTypeOfCultivation(
                    tx,
                    b_lu,
                )
                if (harvestableType === "once") {
                    // If harvestable type is "once", add harvest on terminate date
                    const harvests = await getHarvests(tx, b_lu)
                    if (harvests.length > 0) {
                        await tx
                            .update(schema.cultivationHarvesting)
                            .set({
                                updated: updated,
                                b_harvesting_date: b_terminating_date,
                            })
                            .where(
                                eq(
                                    schema.cultivationHarvesting
                                        .b_id_harvesting,
                                    harvests[0].b_id_harvesting,
                                ),
                            )
                    } else {
                        await addHarvest(
                            tx,
                            b_lu,
                            b_terminating_date,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                        )
                    }
                }
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for updateCultivation", {
            b_lu,
            b_lu_catalogue,
            b_sowing_date,
            b_terminating_date,
        })
    }
}
