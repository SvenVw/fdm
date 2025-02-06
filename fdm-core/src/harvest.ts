// TODO: Support combining harvesting actions into a single harvestable with multiple analyses.
// Currently, each harvesting action is treated as a separate harvestable with a single analysis.
// The database schema supports combined harvests, but the functions here do not yet implement this feature.
// The current join structure is: cultivations (1) => cultivation_harvesting (M) => harvestables (1) => harvestable_sampling (1) => harvestable_analyses (1)

import { desc, eq } from "drizzle-orm"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { createId } from "./id"
import type { HarvestType } from "./harvest.d"

/**
 * Add a harvest to a cultivation.
 *
 * This function simplifies adding a harvest to a cultivation. It assumes that the harvest is not combined with another harvestable and that a same day analysis is performed on this harvest.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation.
 * @param b_harvesting_date The date of the harvest.
 * @param b_lu_yield The amount of yield as dry matter for this harvest, expressed as kg / ha
 * @param b_lu_n_harvestable Total nitrogen content of harvested crop in harvestable yield, expressed as g N / kg
 * @param b_lu_n_residue Total nitrogen content of harvested crop in crop residue, expressed as g N / kg
 * @param b_lu_p_harvestable Total phosphorus content of harvested crop in harvestable yield, expressed as g P2O5 / kg
 * @param b_lu_p_residue Total phosphorus content of harvested crop in crop residue, expressed as g P2O5 / kg
 * @param b_lu_k_harvestable Total potasium content of harvested crop in harvestable yield, expressed as g K2O / kg
 * @param b_lu_k_residue Total potasium content of harvested crop in crop residue, expressed as g K2O / kg
 *
 * @returns A Promise that resolves with the ID of the new harvest.
 * @throws If the cultivation or field does not exist or if the insertion fails.
 */
export async function addHarvest(
    fdm: FdmType,
    b_lu: schema.cultivationHarvestingTypeInsert["b_lu"],
    b_harvesting_date: schema.cultivationHarvestingTypeInsert["b_harvesting_date"],
    b_lu_yield: schema.harvestableAnalysesTypeInsert["b_lu_yield"],
    b_lu_n_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_n_harvestable"],
    b_lu_n_residue?: schema.harvestableAnalysesTypeInsert["b_lu_n_residue"],
    b_lu_p_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_p_harvestable"],
    b_lu_p_residue?: schema.harvestableAnalysesTypeInsert["b_lu_p_residue"],
    b_lu_k_harvestable?: schema.harvestableAnalysesTypeInsert["b_lu_k_harvestable"],
    b_lu_k_residue?: schema.harvestableAnalysesTypeInsert["b_lu_k_residue"],
): Promise<schema.harvestablesTypeSelect["b_id_harvestable"]> {
    try {
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
                b_harvesting_date,
            )

            // Insert the harvestable in the db
            const b_id_harvestable = createId()
            await tx.insert(schema.harvestables).values({
                b_id_harvestable: b_id_harvestable,
                b_lu_yield: b_lu_yield,
            })

            // Insert the harvest in the db
            const b_id_harvesting = createId()
            await tx.insert(schema.cultivationHarvesting).values({
                b_id_harvesting: b_id_harvesting,
                b_id_harvestable: b_id_harvestable,
                b_lu: b_lu,
                b_harvesting_date: b_harvesting_date,
            })

            // Terminate the cultivation if cultivation can only be harvested once
            if (b_lu_harvestable === "once") {
                await tx
                    .update(schema.cultivationTerminating)
                    .set({ b_terminating_date: b_harvesting_date })
                    .where(eq(schema.cultivationTerminating.b_lu, b_lu))
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
                b_sampling_date: b_harvesting_date,
            })

            return b_id_harvesting
        })
    } catch (err) {
        throw handleError(err, "Exception for addHarvest", {
            b_lu,
            b_harvesting_date,
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
 * Retrieves the details of a specific harvest.
 *
 * @param fdm The FDM instance.
 * @param b_id_harvesting The ID of the harvesting action.
 * @returns A promise that resolves with the harvest details.
 * @throws If the harvest does not exist.
 */
export async function getHarvest(
    fdm: FdmType,
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"],
): Promise<HarvestType> {
    try {
        // Get properties of the requested harvest action
        const harvesting = await fdm
            .select({
                b_id_harvesting: schema.cultivationHarvesting.b_id_harvesting,
                b_harvesting_date:
                    schema.cultivationHarvesting.b_harvesting_date,
                b_lu: schema.cultivationHarvesting.b_lu,
            })
            .from(schema.cultivationHarvesting)
            .where(
                eq(
                    schema.cultivationHarvesting.b_id_harvesting,
                    b_id_harvesting,
                ),
            )
            .limit(1)

        // If no harvest is found return an error
        if (harvesting.length === 0) {
            throw new Error("Harvest does not exist")
        }

        const result = harvesting[0]

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
                    result.b_id_harvesting,
                ),
            )
            .limit(1)

        result.harvestable = harvestables

        // Get properties of harvestable analyses for this harvesting
        const harvestableAnalyses = await fdm
            .select({
                b_id_harvestable_analysis:
                    schema.harvestableAnalyses.b_id_harvestable_analysis,
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
                    result.harvestable[0].b_id_harvestable,
                ),
            )
            .limit(1)

        result.harvestable[0].harvestableAnalysis = harvestableAnalyses

        return result
    } catch (err) {
        throw handleError(err, "Exception for getHarvest", { b_id_harvesting })
    }
}

/**
 * Retrieves all harvests for a given cultivation.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation.
 * @returns A Promise that resolves with an array of harvest details.
 */
export async function getHarvests(
    fdm: FdmType,
    b_lu: schema.cultivationHarvestingTypeSelect["b_lu"],
): Promise<HarvestType[]> {
    try {
        const harvests = await fdm
            .select({
                b_id_harvesting: schema.cultivationHarvesting.b_id_harvesting,
                b_harvesting_date:
                    schema.cultivationHarvesting.b_harvesting_date,
                b_lu: schema.cultivationHarvesting.b_lu,
            })
            .from(schema.cultivationHarvesting)
            .where(eq(schema.cultivationHarvesting.b_lu, b_lu))
            .orderBy(desc(schema.cultivationHarvesting.b_harvesting_date))

        // Get details of each harvest
        const result = await Promise.all(
            harvests.map(async (harvest: HarvestType) => {
                const harvestDetails = await getHarvest(
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
 * Removes a harvest record and associated data.
 *
 * @param fdm The FDM database instance.
 * @param b_id_harvesting The ID of the harvest record to remove.
 * @throws If there's an error during the database transaction.
 */
export async function removeHarvest(
    fdm: FdmType,
    b_id_harvesting: schema.cultivationHarvestingTypeSelect["b_id_harvesting"],
): Promise<void> {
    try {
        return await fdm.transaction(async (tx: FdmType) => {
            const harvest = await getHarvest(tx, b_id_harvesting)

            const b_id_harvestable = harvest.harvestable[0].b_id_harvestable
            const b_id_harvestable_analysis =
                harvest.harvestable[0].harvestableAnalysis[0]
                    .b_id_harvestable_analysis
            const b_lu = harvest.b_lu

            console.log(b_id_harvesting)
            console.log(b_id_harvestable)
            console.log(b_id_harvestable_analysis)

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
                    .update(schema.cultivationTerminating)
                    .set({ b_terminating_date: null, updated: new Date() })
                    .where(eq(schema.cultivationTerminating.b_lu, b_lu))
            }
        })
    } catch (err) {
        throw handleError(err, "Exception for removeHarvest", {
            b_id_harvesting,
        })
    }
}

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

export async function checkHarvestDateCompability(
    tx: FdmType,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
    b_harvesting_date: schema.cultivationHarvestingTypeInsert["b_harvesting_date"],
) {
    // console.log(b_harvesting_date)
    if (!b_harvesting_date) {
        // Handle undefined dates *before* anything else
        throw new Error("Argument b_harvesting_date is missing")
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
            b_sowing_date: schema.fieldSowing.b_sowing_date,
        })
        .from(schema.fieldSowing)
        .where(eq(schema.fieldSowing.b_lu, b_lu))
        .limit(1)

    if (sowingDate.length === 0 || sowingDate[0].b_sowing_date === null) {
        throw new Error("Sowing date does not exist")
    }

    // If cultivation has harvest date before sowing date throw an error
    if (b_harvesting_date.getTime() <= sowingDate[0].b_sowing_date.getTime()) {
        throw new Error("Harvest date must be after sowing date")
    }

    const terminatingDate = await tx
        .select({
            b_terminating_date:
                schema.cultivationTerminating.b_terminating_date,
        })
        .from(schema.cultivationTerminating)
        .where(eq(schema.cultivationTerminating.b_lu, b_lu))
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
            terminatingDate[0].b_terminating_date &&
            b_harvesting_date.getTime() !==
                terminatingDate[0].b_terminating_date.getTime()
        ) {
            throw new Error(
                "Harvest date must be equal to terminating date for this cultivation",
            )
        }
    }

    // If cultivation can be harvested multiple times, check if harvest is before termination date
    if (
        b_lu_harvestable === "multiple" &&
        terminatingDate[0].b_terminating_date &&
        b_harvesting_date.getTime() >
            terminatingDate[0].b_terminating_date.getTime()
    ) {
        throw new Error(
            "Harvest date must be before terminating date for this cultivation",
        )
    }

    return b_lu_harvestable
}
