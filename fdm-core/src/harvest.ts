/**
 * @file This file contains functions for managing harvests in the FDM.
 *
 * It provides a comprehensive set of CRUD operations for harvests, as well as functions for
 * validating harvest dates and retrieving harvestable types.
 *
 * @remarks
 * // TODO: Support combining harvesting actions into a single harvestable with multiple analyses.
 * // Currently, each harvesting action is treated as a separate harvestable with a single analysis.
 * // The database schema supports combined harvests, but the functions here do not yet implement this feature.
 */
// TODO: Support combining harvesting actions into a single harvestable with multiple analyses.
// Currently, each harvesting action is treated as a separate harvestable with a single analysis.
// The database schema supports combined harvests, but the functions here do not yet implement this feature.
// The current join structure is: cultivations (1) => cultivation_harvesting (M) => harvestables (1) => harvestable_sampling (1) => harvestable_analyses (1)

import { and, desc, eq, gte, lte, type SQL } from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import type { Harvest } from "./harvest.d"
import { createId } from "./id"
import type { Timeframe } from "./timeframe"

/**
 * Adds a harvest record to a cultivation.
 *
 * This function creates a new harvest, including its associated analysis data. If the cultivation
 * is of a type that is harvested only once, this function also updates the cultivation's end date.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_lu The unique identifier of the cultivation.
 * @param b_lu_harvest_date The date of the harvest.
 * @param b_lu_yield The yield of the harvest.
 * @param b_lu_n_harvestable The nitrogen content of the harvestable part (optional).
 * @param b_lu_n_residue The nitrogen content of the residue (optional).
 * @param b_lu_p_harvestable The phosphorus content of the harvestable part (optional).
 * @param b_lu_p_residue The phosphorus content of the residue (optional).
 * @param b_lu_k_harvestable The potassium content of the harvestable part (optional).
 * @param b_lu_k_residue The potassium content of the residue (optional).
 * @returns A promise that resolves to the unique identifier of the new harvest.
 * @throws An error if the principal does not have permission or if the cultivation does not exist.
 */
export async function addHarvest(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationHarvestingTypeInsert["b_lu"],
    b_lu_harvest_date: schema.cultivationHarvestingTypeInsert["b_lu_harvest_date"],
    b_lu_yield: schema.harvestableAnalysesTypeInsert["b_lu_yield"],
    b_lu_n_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
    b_lu_n_residue?: schema.harvestableAnalysesTypeInsert["b_lu_n_residue"],
    b_lu_p_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_p_harvestable"],
    b_lu_p_residue?: schema.harvestableAnalysesTypeInsert["b_lu_p_residue"],
    b_lu_k_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_k_harvestable"],
    b_lu_k_residue?: schema.harvestableAnalysesTypeInsert["b_lu_k_residue"],
): Promise<schema.cultivationHarvestingTypeSelect["b_id_harvesting"]> {
    try {
        await checkPermission(
            fdm,
            "cultivation",
            "write",
            b_lu,
            principal_id,
            "addHarvest",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            // Validate if cultivation exists
            const cultivation = await tx
                .select()
                .from(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .limit(1)
            if (cultivation.length === 0) {
                throw new Error("Cultivation does not exist")
            }

            const b_lu_harvestable = await checkHarvestDateCompability(
                tx,
                b_lu,
                b_lu_harvest_date,
            )

            // Insert the harvestable in the db
            const b_id_harvestable = createId()
            await tx.insert(schema.harvestables).values({
                b_id_harvestable: b_id_harvestable,
            })

            // Insert the harvest in the db
            const b_id_harvesting = createId()
            await tx.insert(schema.cultivationHarvesting).values({
                b_id_harvesting: b_id_harvesting,
                b_id_harvestable: b_id_harvestable,
                b_lu: b_lu,
                b_lu_harvest_date: b_lu_harvest_date,
            })

            // Terminate the cultivation if cultivation can only be harvested once
            if (b_lu_harvestable === "once") {
                await tx
                    .update(schema.cultivationEnding)
                    .set({ b_lu_end: b_lu_harvest_date })
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))
            }

            // Add harvestable analysis
            const b_id_harvestable_analysis = createId()
            await tx.insert(schema.harvestableAnalyses).values({
                b_id_harvestable_analysis: b_id_harvestable_analysis,
                b_lu_yield: b_lu_yield,
                b_lu_n_harvestable: b_lu_n_harvestable,
                b_lu_n_residue: b_lu_n_residue,
                b_lu_p_harvestable: b_lu_p_harvestable,
                b_lu_p_residue: b_lu_p_residue,
                b_lu_k_harvestable: b_lu_k_harvestable,
                b_lu_k_residue: b_lu_k_residue,
            })

            // Add sampling for harvestable analysis, defaults to same date as harvest
            await tx.insert(schema.harvestableSampling).values({
                b_id_harvestable: b_id_harvestable,
                b_id_harvestable_analysis: b_id_harvestable_analysis,
                b_sampling_date: b_lu_harvest_date,
            })

            return b_id_harvesting
        })
    } catch (err) {
        throw handleError(err, "Exception for addHarvest", {
            b_lu,
            b_lu_harvest_date,
            b_lu_yield,
            b_lu_n_harvestable,
            b_lu_n_residue,
            b_lu_p_harvestable,
            b_lu_p_residue,
            b_lu_k_harvestable,
            b_lu_k_residue,
        })
    }
}

/**
 * Retrieves a single harvest by its unique identifier.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_harvesting The unique identifier of the harvest.
 * @returns A promise that resolves to a `Harvest` object.
 * @throws An error if the principal does not have permission or if the harvest is not found.
 */
export async function getHarvest(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"],
): Promise<Harvest> {
    try {
        await checkPermission(
            fdm,
            "harvesting",
            "read",
            b_id_harvesting,
            principal_id,
            "getHarvest",
        )

        const harvest = getHarvestSimplified(fdm, b_id_harvesting)
        return harvest
    } catch (err) {
        throw handleError(err, "Exception for getHarvest", { b_id_harvesting })
    }
}

/**
 * Retrieves all harvests for a cultivation, optionally filtered by a timeframe.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_lu The unique identifier of the cultivation.
 * @param timeframe An optional timeframe to filter the harvests.
 * @returns A promise that resolves to an array of `Harvest` objects.
 * @throws An error if the principal does not have permission.
 */
export async function getHarvests(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationHarvestingTypeSelect["b_lu"],
    timeframe?: Timeframe,
): Promise<Harvest[]> {
    try {
        await checkPermission(
            fdm,
            "cultivation",
            "read",
            b_lu,
            principal_id,
            "getHarvests",
        )

        let whereClause: SQL | undefined
        if (timeframe?.start && timeframe?.end) {
            whereClause = and(
                eq(schema.cultivationHarvesting.b_lu, b_lu),
                gte(
                    schema.cultivationHarvesting.b_lu_harvest_date,
                    timeframe.start,
                ),
                lte(
                    schema.cultivationHarvesting.b_lu_harvest_date,
                    timeframe.end,
                ),
            )
        } else if (timeframe?.start) {
            whereClause = and(
                eq(schema.cultivationHarvesting.b_lu, b_lu),
                gte(
                    schema.cultivationHarvesting.b_lu_harvest_date,
                    timeframe.start,
                ),
            )
        } else if (timeframe?.end) {
            whereClause = and(
                eq(schema.cultivationHarvesting.b_lu, b_lu),
                lte(
                    schema.cultivationHarvesting.b_lu_harvest_date,
                    timeframe.end,
                ),
            )
        } else {
            whereClause = eq(schema.cultivationHarvesting.b_lu, b_lu)
        }

        const harvests = await fdm
            .select({
                b_id_harvesting: schema.cultivationHarvesting.b_id_harvesting,
                b_lu_harvest_date:
                    schema.cultivationHarvesting.b_lu_harvest_date,
                b_lu: schema.cultivationHarvesting.b_lu,
            })
            .from(schema.cultivationHarvesting)
            .where(whereClause)
            .orderBy(desc(schema.cultivationHarvesting.b_lu_harvest_date))

        // Get details of each harvest
        const result = await Promise.all(
            harvests.map(async (harvest: Harvest) => {
                const harvestDetails = getHarvestSimplified(
                    fdm,
                    harvest.b_id_harvesting,
                )
                return harvestDetails
            }),
        )

        return result
    } catch (err) {
        throw handleError(err, "Exception for getHarvests", { b_lu })
    }
}

/**
 * Removes a harvest and its associated data.
 *
 * This function deletes a harvest, its analysis, and related records. If the cultivation is of a
 * type that is harvested only once, the cultivation's end date is also cleared.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_harvesting The unique identifier of the harvest to remove.
 * @returns A promise that resolves when the harvest has been successfully removed.
 * @throws An error if the principal does not have permission.
 */
export async function removeHarvest(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "harvesting",
            "write",
            b_id_harvesting,
            principal_id,
            "removeHarvest",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            const harvest = await getHarvest(tx, principal_id, b_id_harvesting)

            const b_id_harvestable = harvest.harvestable.b_id_harvestable
            const b_id_harvestable_analysis =
                harvest.harvestable.harvestable_analyses[0]
                    .b_id_harvestable_analysis
            const b_lu = harvest.b_lu

            // Delete related sampling entries
            await tx
                .delete(schema.harvestableSampling)
                .where(
                    eq(
                        schema.harvestableSampling.b_id_harvestable,
                        b_id_harvestable,
                    ),
                )

            // Delete related analyses
            await tx
                .delete(schema.harvestableAnalyses)
                .where(
                    eq(
                        schema.harvestableAnalyses.b_id_harvestable_analysis,
                        b_id_harvestable_analysis,
                    ),
                )

            // Delete the cultivationHarvesting entry
            await tx
                .delete(schema.cultivationHarvesting)
                .where(
                    eq(
                        schema.cultivationHarvesting.b_id_harvesting,
                        b_id_harvesting,
                    ),
                )

            // Delete the harvestable entry
            await tx
                .delete(schema.harvestables)
                .where(
                    eq(schema.harvestables.b_id_harvestable, b_id_harvestable),
                )

            // Check if cultivation can be harvested
            const b_lu_harvestable = await getHarvestableTypeOfCultivation(
                tx,
                b_lu,
            )

            if (b_lu_harvestable === "once") {
                // Remove terminating date for once-harvestable crops, since the harvest is being removed
                await tx
                    .update(schema.cultivationEnding)
                    .set({ b_lu_end: null, updated: new Date() })
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for removeHarvest", {
            b_id_harvesting,
        })
    }
}

/**
 * Retrieves the harvestable type of a cultivation.
 *
 * @param tx The FDM instance for database access.
 * @param b_lu The unique identifier of the cultivation.
 * @returns A promise that resolves to the harvestable type.
 * @throws An error if the cultivation is not found.
 * @internal
 */
export async function getHarvestableTypeOfCultivation(
    tx: FdmType,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
) {
    const b_lu_harvestable = await tx
        .select({
            b_lu_harvestable: schema.cultivationsCatalogue.b_lu_harvestable,
        })
        .from(schema.cultivations)
        .leftJoin(
            schema.cultivationsCatalogue,
            eq(
                schema.cultivations.b_lu_catalogue,
                schema.cultivationsCatalogue.b_lu_catalogue,
            ),
        )
        .where(eq(schema.cultivations.b_lu, b_lu))
        .limit(1)

    if (b_lu_harvestable.length === 0) {
        throw new Error("Cultivation does not exist")
    }

    return b_lu_harvestable[0].b_lu_harvestable
}

/**
 * Checks if a harvest date is compatible with the cultivation's properties.
 *
 * This function performs several validation checks to ensure that a harvest can be legally added
 * to a cultivation.
 *
 * @param tx The FDM instance for database access.
 * @param b_lu The unique identifier of the cultivation.
 * @param b_lu_harvest_date The date of the harvest.
 * @returns The harvestable type of the cultivation.
 * @throws An error if the harvest date is not compatible.
 * @internal
 */
export async function checkHarvestDateCompability(
    tx: FdmType,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
    b_lu_harvest_date: schema.cultivationHarvestingTypeInsert["b_lu_harvest_date"],
) {
    // console.log(b_lu_harvest_date)
    if (!b_lu_harvest_date) {
        // Handle undefined dates *before* anything else
        throw new Error("Argument b_lu_harvest_date is missing")
    }

    // Check if cultivation can be harvested
    const b_lu_harvestable = await getHarvestableTypeOfCultivation(tx, b_lu)
    // console.log(b_lu_harvestable)

    if (b_lu_harvestable === "none") {
        throw new Error("Cultivation cannot be harvested")
    }

    // Check if harvest date is after sowing date
    const sowingDate = await tx
        .select({
            b_lu_start: schema.cultivationStarting.b_lu_start,
        })
        .from(schema.cultivationStarting)
        .where(eq(schema.cultivationStarting.b_lu, b_lu))
        .limit(1)

    if (sowingDate.length === 0 || sowingDate[0].b_lu_start === null) {
        throw new Error("Sowing date does not exist")
    }

    // If cultivation has harvest date before or on sowing date throw an error
    if (b_lu_harvest_date.getTime() < sowingDate[0].b_lu_start.getTime()) {
        throw new Error("Harvest date must be after or on sowing date")
    }

    const terminatingDate = await tx
        .select({
            b_lu_end: schema.cultivationEnding.b_lu_end,
        })
        .from(schema.cultivationEnding)
        .where(eq(schema.cultivationEnding.b_lu, b_lu))
        .limit(1)

    if (terminatingDate.length === 0) {
        throw new Error("Terminating date does not exist")
    }

    if (b_lu_harvestable === "once") {
        // If cultivation can only be harvested once, check if a harvest is already present
        const existingHarvest = await tx
            .select()
            .from(schema.cultivationHarvesting)
            .where(eq(schema.cultivationHarvesting.b_lu, b_lu))
            .limit(1)

        if (existingHarvest.length > 0) {
            throw new Error("Cultivation can only be harvested once")
        }

        // If cultivation can only be harvested once, check if harvest is on the same date as terminating date
        if (
            terminatingDate[0].b_lu_end &&
            b_lu_harvest_date.getTime() !==
                terminatingDate[0].b_lu_end.getTime()
        ) {
            throw new Error(
                "Harvest date must be equal to terminating date for this cultivation",
            )
        }
    }

    // If cultivation can be harvested multiple times, check if harvest is before termination date
    if (
        b_lu_harvestable === "multiple" &&
        terminatingDate[0].b_lu_end &&
        b_lu_harvest_date.getTime() > terminatingDate[0].b_lu_end.getTime()
    ) {
        throw new Error(
            "Harvest date must be before terminating date for this cultivation",
        )
    }

    return b_lu_harvestable
}

/**
 * Updates an existing harvest record.
 *
 * This function allows for the modification of a harvest's details, including its date and analysis data.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_harvesting The unique identifier of the harvest to update.
 * @param b_lu_harvest_date The new date of the harvest.
 * @param b_lu_yield The new yield of the harvest.
 * @param b_lu_n_harvestable The new nitrogen content of the harvestable part (optional).
 * @param b_lu_n_residue The new nitrogen content of the residue (optional).
 * @param b_lu_p_harvestable The new phosphorus content of the harvestable part (optional).
 * @param b_lu_p_residue The new phosphorus content of the residue (optional).
 * @param b_lu_k_harvestable The new potassium content of the harvestable part (optional).
 * @param b_lu_k_residue The new potassium content of the residue (optional).
 * @returns A promise that resolves when the harvest has been successfully updated.
 * @throws An error if the principal does not have permission or if the harvest is not found.
 */
export async function updateHarvest(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"],
    b_lu_harvest_date: schema.cultivationHarvestingTypeInsert["b_lu_harvest_date"],
    b_lu_yield: schema.harvestableAnalysesTypeInsert["b_lu_yield"],
    b_lu_n_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
    b_lu_n_residue?: schema.harvestableAnalysesTypeInsert["b_lu_n_residue"],
    b_lu_p_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_p_harvestable"],
    b_lu_p_residue?: schema.harvestableAnalysesTypeInsert["b_lu_p_residue"],
    b_lu_k_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_k_harvestable"],
    b_lu_k_residue?: schema.harvestableAnalysesTypeInsert["b_lu_k_residue"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "harvesting",
            "write",
            b_id_harvesting,
            principal_id,
            "updateHarvest",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            const harvest = await getHarvestSimplified(tx, b_id_harvesting)
            if (!harvest) {
                throw new Error("Harvest does not exist")
            }

            const b_lu = harvest.b_lu

            // --- Validation logic ---
            if (!b_lu_harvest_date) {
                throw new Error("Argument b_lu_harvest_date is missing")
            }

            const sowingDate = await tx
                .select({
                    b_lu_start: schema.cultivationStarting.b_lu_start,
                })
                .from(schema.cultivationStarting)
                .where(eq(schema.cultivationStarting.b_lu, b_lu))
                .limit(1)

            if (sowingDate.length === 0 || !sowingDate[0].b_lu_start) {
                throw new Error("Sowing date does not exist")
            }

            if (
                b_lu_harvest_date.getTime() < sowingDate[0].b_lu_start.getTime()
            ) {
                throw new Error("Harvest date must be after or on sowing date")
            }

            const b_lu_harvestable = await getHarvestableTypeOfCultivation(
                tx,
                b_lu,
            )

            if (b_lu_harvestable === "multiple") {
                const terminatingDate = await tx
                    .select({
                        b_lu_end: schema.cultivationEnding.b_lu_end,
                    })
                    .from(schema.cultivationEnding)
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))
                    .limit(1)

                if (
                    terminatingDate.length > 0 &&
                    terminatingDate[0].b_lu_end &&
                    b_lu_harvest_date.getTime() >
                        terminatingDate[0].b_lu_end.getTime()
                ) {
                    throw new Error(
                        "Harvest date must be before terminating date for this cultivation",
                    )
                }
            }
            // --- End of validation logic ---

            const b_id_harvestable_analysis =
                harvest.harvestable.harvestable_analyses[0]
                    .b_id_harvestable_analysis

            await tx
                .update(schema.cultivationHarvesting)
                .set({
                    b_lu_harvest_date: b_lu_harvest_date,
                    updated: new Date(),
                })
                .where(
                    eq(
                        schema.cultivationHarvesting.b_id_harvesting,
                        b_id_harvesting,
                    ),
                )

            await tx
                .update(schema.harvestableAnalyses)
                .set({
                    b_lu_yield: b_lu_yield,
                    b_lu_n_harvestable: b_lu_n_harvestable,
                    b_lu_n_residue: b_lu_n_residue,
                    b_lu_p_harvestable: b_lu_p_harvestable,
                    b_lu_p_residue: b_lu_p_residue,
                    b_lu_k_harvestable: b_lu_k_harvestable,
                    b_lu_k_residue: b_lu_k_residue,
                    updated: new Date(),
                })
                .where(
                    eq(
                        schema.harvestableAnalyses.b_id_harvestable_analysis,
                        b_id_harvestable_analysis,
                    ),
                )

            if (b_lu_harvestable === "once") {
                await tx
                    .update(schema.cultivationEnding)
                    .set({ b_lu_end: b_lu_harvest_date, updated: new Date() })
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for updateHarvest", {
            b_id_harvesting,
            b_lu_harvest_date,
            b_lu_yield,
            b_lu_n_harvestable,
            b_lu_n_residue,
            b_lu_p_harvestable,
            b_lu_p_residue,
            b_lu_k_harvestable,
            b_lu_k_residue,
        })
    }
}

/**
 * A private helper function to retrieve the details of a harvest.
 *
 * This function is used by `getHarvest` and `getHarvests` to fetch harvest data.
 *
 * @param fdm The FDM instance for database access.
 * @param b_id_harvesting The unique identifier of the harvest.
 * @returns A promise that resolves to a `Harvest` object.
 * @throws An error if the harvest is not found.
 * @internal
 */
async function getHarvestSimplified(
    fdm: FdmType,
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"],
): Promise<Harvest> {
    // Get properties of the requested harvest action
    const harvesting = await fdm
        .select({
            b_id_harvesting: schema.cultivationHarvesting.b_id_harvesting,
            b_lu_harvest_date: schema.cultivationHarvesting.b_lu_harvest_date,
            b_lu: schema.cultivationHarvesting.b_lu,
        })
        .from(schema.cultivationHarvesting)
        .where(
            eq(schema.cultivationHarvesting.b_id_harvesting, b_id_harvesting),
        )
        .limit(1)

    // If no harvest is found return an error
    if (harvesting.length === 0) {
        throw new Error("Harvest does not exist")
    }

    const harvest = harvesting[0]

    // Get properties of harvestables for this harvesting
    // CAUTION: Currently only 1:1 joins for harvesting, harvestables and harvestable_analysis is supported. When 1:M joins is supported in these functions (db schema alreayd supports it) than the code below needs to be updated
    const harvestables = await fdm
        .select({
            b_id_harvestable: schema.harvestables.b_id_harvestable,
        })
        .from(schema.harvestables)
        .leftJoin(
            schema.cultivationHarvesting,
            eq(
                schema.harvestables.b_id_harvestable,
                schema.cultivationHarvesting.b_id_harvestable,
            ),
        )
        .where(
            eq(
                schema.cultivationHarvesting.b_id_harvesting,
                harvest.b_id_harvesting,
            ),
        )
        .limit(1)

    harvest.harvestable = harvestables[0]

    // Get properties of harvestable analyses for this harvesting
    const harvestableAnalyses = await fdm
        .select({
            b_id_harvestable_analysis:
                schema.harvestableAnalyses.b_id_harvestable_analysis,
            b_lu_yield: schema.harvestableAnalyses.b_lu_yield,
            b_lu_n_harvestable: schema.harvestableAnalyses.b_lu_n_harvestable,
            b_lu_n_residue: schema.harvestableAnalyses.b_lu_n_residue,
            b_lu_p_harvestable: schema.harvestableAnalyses.b_lu_p_harvestable,
            b_lu_p_residue: schema.harvestableAnalyses.b_lu_p_residue,
            b_lu_k_harvestable: schema.harvestableAnalyses.b_lu_k_harvestable,
            b_lu_k_residue: schema.harvestableAnalyses.b_lu_k_residue,
        })
        .from(schema.harvestables)
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
            eq(
                schema.harvestableSampling.b_id_harvestable,
                harvest.harvestable.b_id_harvestable,
            ),
        )
        .limit(1)

    harvest.harvestable.harvestable_analyses = harvestableAnalyses

    return harvest
}
