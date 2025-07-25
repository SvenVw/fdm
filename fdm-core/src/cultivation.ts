import {
    and,
    asc,
    desc,
    eq,
    gte,
    inArray,
    isNotNull,
    lte,
    or,
    type SQL,
} from "drizzle-orm"
import { checkPermission } from "./authorization"
import type { PrincipalId } from "./authorization.d"
import type {
    Cultivation,
    CultivationCatalogue,
    CultivationPlan,
} from "./cultivation.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import {
    addHarvest,
    getHarvestableTypeOfCultivation,
    getHarvests,
} from "./harvest"
import { createId } from "./id"
import type { Timeframe } from "./timeframe"

/**
 * Retrieves cultivations available in the enabled catalogues for a farm.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id The ID of the principal making the request.
 * @param b_id_farm The ID of the farm.
 * @returns A Promise that resolves with an array of cultivation catalogue entries.
 * @alpha
 */
export async function getCultivationsFromCatalogue(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
): Promise<CultivationCatalogue[]> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getCultivationsFromCatalogue",
        )

        // Get enabled catalogues for the farm
        const enabledCatalogues = await fdm
            .select({
                b_lu_source: schema.cultivationCatalogueSelecting.b_lu_source,
            })
            .from(schema.cultivationCatalogueSelecting)
            .where(
                eq(schema.cultivationCatalogueSelecting.b_id_farm, b_id_farm),
            )

        // If no catalogues are enabled, return empty array
        if (enabledCatalogues.length === 0) {
            return []
        }

        // Get cultivations from enabled catalogues
        const cultivationsCatalogue = await fdm
            .select()
            .from(schema.cultivationsCatalogue)
            .where(
                inArray(
                    schema.cultivationsCatalogue.b_lu_source,
                    enabledCatalogues.map(
                        (c: { b_lu_source: string }) => c.b_lu_source,
                    ),
                ),
            )

        return cultivationsCatalogue
    } catch (err) {
        throw handleError(err, "Exception for getCultivationsFromCatalogue", {
            principal_id,
            b_id_farm,
        })
    }
}

/**
 * Adds a new cultivation to the catalogue.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
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
        b_lu_croprotation: schema.cultivationsCatalogueTypeInsert["b_lu_croprotation"]
        b_lu_yield: schema.cultivationsCatalogueTypeInsert["b_lu_yield"]
        b_lu_hi: schema.cultivationsCatalogueTypeInsert["b_lu_hi"]
        b_lu_n_harvestable: schema.cultivationsCatalogueTypeInsert["b_lu_n_harvestable"]
        b_lu_n_residue: schema.cultivationsCatalogueTypeInsert["b_lu_n_residue"]
        b_n_fixation: schema.cultivationsCatalogueTypeInsert["b_n_fixation"]
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
 * Adds a new cultivation to a specific field.
 *
 * The function validates that the sowing and (if provided) termination dates are valid Date objects and that the termination date is after the sowing date. It ensures the target field and cultivation catalogue entry exist and that no duplicate cultivation is recorded. A permission check is performed before any database operations. If a termination date is provided for a cultivation that is harvestable only once, a harvest record is automatically scheduled for the termination date.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The identifier of the principal performing the operation.
 * @param b_lu_catalogue - The catalogue ID corresponding to the cultivation entry.
 * @param b_id - The identifier of the field to which the cultivation is added.
 * @param b_lu_start - The sowing date of the cultivation.
 * @param b_lu_end - The optional termination date of the cultivation.
 * @param m_cropresidue - (Optional) Whether crop residues are left on the field or not after termination of the cultivation.
 * @returns A promise that resolves with the unique ID of the newly added cultivation.
 * @throws {Error} If the sowing date is invalid, the termination date is invalid or not after the sowing date, the field or catalogue entry does not exist, or a duplicate cultivation is detected.
 * @alpha
 */
export async function addCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu_catalogue: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_id: schema.cultivationStartingTypeInsert["b_id"],
    b_lu_start: schema.cultivationStartingTypeInsert["b_lu_start"],
    b_lu_end?: schema.cultivationEndingTypeInsert["b_lu_end"],
    m_cropresidue?: schema.cultivationEndingTypeInsert["m_cropresidue"],
): Promise<schema.cultivationsTypeSelect["b_lu"]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "write",
            b_id,
            principal_id,
            "addCultivation",
        )

        return await fdm.transaction(async (tx: FdmType) => {
            // Generate an ID for the cultivation
            const b_lu = createId()

            // Validate b_lu_start is a Date object
            if (!(b_lu_start instanceof Date)) {
                throw new Error("Invalid sowing date: Must be a Date object")
            }

            if (b_lu_end) {
                // Validate if terminate date is a Date object
                if (!(b_lu_end instanceof Date)) {
                    throw new Error(
                        "Invalid terminate date: Must be a Date object",
                    )
                }

                // Validate if terminate date is after sowing date
                if (b_lu_end <= b_lu_start) {
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
                .from(schema.cultivationStarting)
                .leftJoin(
                    schema.cultivations,
                    eq(
                        schema.cultivationStarting.b_lu,
                        schema.cultivations.b_lu,
                    ),
                )
                .where(
                    and(
                        eq(schema.cultivationStarting.b_id, b_id),
                        or(
                            eq(schema.cultivationStarting.b_lu, b_lu),
                            and(
                                eq(
                                    schema.cultivationStarting.b_lu_start,
                                    b_lu_start,
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

            await tx.insert(schema.cultivationStarting).values({
                b_id: b_id,
                b_lu: b_lu,
                b_lu_start: b_lu_start,
            })

            await tx.insert(schema.cultivationEnding).values({
                b_lu: b_lu,
                b_lu_end: b_lu_end,
                m_cropresidue: m_cropresidue,
            })

            if (b_lu_end) {
                const harvestableType = await getHarvestableTypeOfCultivation(
                    tx,
                    b_lu,
                )

                if (harvestableType === "once") {
                    // If cultivation can only be harvested once, add harvest on terminate date
                    await addHarvest(
                        tx,
                        principal_id,
                        b_lu,
                        b_lu_end,
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
            b_lu_start,
            b_lu_end,
        })
    }
}

/**
 * Retrieves details of a specific cultivation after verifying access permissions.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The identifier of the principal requesting access.
 * @param b_lu - The unique identifier of the cultivation.
 * @returns A promise that resolves with the cultivation details.
 * @throws {Error} If no cultivation matches the provided identifier.
 *
 * @remark A permission check is performed to ensure the requesting principal has read access.
 */
export async function getCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
): Promise<Cultivation> {
    try {
        await checkPermission(
            fdm,
            "cultivation",
            "read",
            b_lu,
            principal_id,
            "getCultivation",
        )

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
                b_lu_croprotation:
                    schema.cultivationsCatalogue.b_lu_croprotation,
                b_lu_start: schema.cultivationStarting.b_lu_start,
                b_lu_end: schema.cultivationEnding.b_lu_end,
                m_cropresidue: schema.cultivationEnding.m_cropresidue,
                b_id: schema.cultivationStarting.b_id,
            })
            .from(schema.cultivations)
            .leftJoin(
                schema.cultivationStarting,
                eq(schema.cultivationStarting.b_lu, schema.cultivations.b_lu),
            )
            .leftJoin(
                schema.cultivationEnding,
                eq(schema.cultivationEnding.b_lu, schema.cultivations.b_lu),
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
 * Retrieves all cultivations associated with a specific field.
 *
 * This function verifies that the requesting principal has read access to the field, then queries the database
 * and returns an array of cultivation records.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - Identifier of the principal requesting access.
 * @param b_id - Identifier of the field.
 * @param timeframe - Optional timeframe to filter cultivations by start and end dates.
 *
 * @returns A Promise resolving to an array of cultivation details.
 *
 * @throws {Error} If the principal does not have read permission or if the database query fails.
 *
 * @alpha
 */
export async function getCultivations(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id: schema.cultivationStartingTypeSelect["b_id"],
    timeframe?: Timeframe,
): Promise<Cultivation[]> {
    try {
        await checkPermission(
            fdm,
            "field",
            "read",
            b_id,
            principal_id,
            "getCultivations",
        )

        const startingDateCondition = buildDateRangeCondition(
            timeframe?.start,
            timeframe?.end,
        )
        const endingDateCondition = buildDateRangeConditionEnding(
            timeframe?.start,
            timeframe?.end,
        )
        const timeframeClause = or(startingDateCondition, endingDateCondition)

        const cultivations = await fdm
            .select({
                b_lu: schema.cultivations.b_lu,
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                b_lu_source: schema.cultivationsCatalogue.b_lu_source,
                b_lu_name: schema.cultivationsCatalogue.b_lu_name,
                b_lu_name_en: schema.cultivationsCatalogue.b_lu_name_en,
                b_lu_hcat3: schema.cultivationsCatalogue.b_lu_hcat3,
                b_lu_hcat3_name: schema.cultivationsCatalogue.b_lu_hcat3_name,
                b_lu_croprotation:
                    schema.cultivationsCatalogue.b_lu_croprotation,
                b_lu_start: schema.cultivationStarting.b_lu_start,
                b_lu_end: schema.cultivationEnding.b_lu_end,
                m_cropresidue: schema.cultivationEnding.m_cropresidue,
                b_id: schema.cultivationStarting.b_id,
            })
            .from(schema.cultivations)
            .leftJoin(
                schema.cultivationStarting,
                eq(schema.cultivationStarting.b_lu, schema.cultivations.b_lu),
            )
            .leftJoin(
                schema.cultivationEnding,
                eq(schema.cultivationEnding.b_lu, schema.cultivations.b_lu),
            )
            .leftJoin(
                schema.cultivationsCatalogue,
                eq(
                    schema.cultivations.b_lu_catalogue,
                    schema.cultivationsCatalogue.b_lu_catalogue,
                ),
            )
            .where(
                and(eq(schema.cultivationStarting.b_id, b_id), timeframeClause),
            )
            .orderBy(
                desc(schema.cultivationStarting.b_lu_start),
                asc(schema.cultivationsCatalogue.b_lu_name),
            )

        return cultivations
    } catch (err) {
        throw handleError(err, "Exception for getCultivations", { b_id })
    }
}

/**
 * Retrieves a comprehensive cultivation plan for a specified farm.
 *
 * This function aggregates cultivation data from multiple related tables and returns an array of cultivation
 * entries. Each entry includes the catalogue identifier, its name, sowing and termination dates (if available),
 * and an array of fields on which the cultivation was applied. Each field entry details associated fertilizer
 * applications and harvest records (with accompanying analyses).
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The identifier of the principal requesting access to the cultivation plan.
 * @param b_id_farm - The unique ID of the farm for which the cultivation plan is to be retrieved.
 * @param timeframe - Optional timeframe to filter cultivations by start and end dates.
 *
 * @returns A Promise that resolves to an array representing the cultivation plan. Each element in the array has the following structure:
 *
 * ```
 * {
 *   b_lu_catalogue: string;   // Unique ID of the cultivation catalogue item
 *   b_lu_name: string;        // Name of the cultivation
 *   b_lu_start: Date;      // Sowing date for the cultivation (if available)
 *   b_lu_end: Date; // Termination date for the cultivation (if available)
 *   m_cropresidue: boolean // Whether crop residues are left on the field or not after termination of the cultivation
 *   fields: [
 *     {
 *       b_lu: string;        // Unique ID of the cultivation record
 *       b_id: string;        // Unique ID of the field
 *       b_name: string;      // Name of the field
 *       fertilizer_applications: [
 *         {
 *           p_id_catalogue: string; // Fertilizer catalogue ID
 *           p_name_nl: string;      // Fertilizer name (Dutch)
 *           p_app_amount: number;   // Amount applied
 *           p_app_method: string;   // Application method
 *           p_app_date: Date;       // Application date
 *           p_app_id: string;       // Unique ID of the fertilizer application
 *         }
 *       ],
 *       harvests: [
 *         {
 *           b_id_harvesting: string;  // Unique ID of the harvest record
 *           b_lu_harvest_date: Date;  // Harvest date
 *           harvestable: {
 *               b_id_harvestable: string; // Unique ID of the harvestable
 *               harvestable_analyses: [
 *                 {
 *                   b_lu_yield: number;         // Yield in kg/ha
 *                   b_lu_n_harvestable: number;   // N content in harvestable yield (g N/kg)
 *                   b_lu_n_residue: number;       // N content in residue (g N/kg)
 *                   b_lu_p_harvestable: number;   // P content in harvestable yield (g P2O5/kg)
 *                   b_lu_p_residue: number;       // P content in residue (g P2O5/kg)
 *                   b_lu_k_harvestable: number;   // K content in harvestable yield (g K2O/kg)
 *                   b_lu_k_residue: number;       // K content in residue (g K2O/kg)
 *                 }
 *               ]
 *             }
 *         }
 *       ]
 *     }
 *   ]
 * }
 * ```
 * If no cultivations are found for the specified farm, an empty array is returned.
 *
 * @example
 * ```typescript
 * const cultivationPlan = await getCultivationPlan(fdm, 'principal123', 'farm123');
 * if (cultivationPlan.length) {
 *   console.log("Cultivation Plan:", cultivationPlan);
 * } else {
 *   console.log("No cultivations found for this farm.");
 * }
 * ```
 *
 * @alpha
 */
export async function getCultivationPlan(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    timeframe?: Timeframe,
): Promise<CultivationPlan[]> {
    try {
        if (!b_id_farm) {
            throw new Error("Farm ID is required")
        }
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getCultivationPlan",
        )

        const startingDateCondition = buildDateRangeCondition(
            timeframe?.start,
            timeframe?.end,
        )
        const endingDateCondition = buildDateRangeConditionEnding(
            timeframe?.start,
            timeframe?.end,
        )
        const timeframeClause = or(startingDateCondition, endingDateCondition)

        const cultivations = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                b_lu_name: schema.cultivationsCatalogue.b_lu_name,
                b_lu: schema.cultivations.b_lu,
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                b_lu_start: schema.cultivationStarting.b_lu_start,
                b_lu_end: schema.cultivationEnding.b_lu_end,
                m_cropresidue: schema.cultivationEnding.m_cropresidue,
                p_id_catalogue: schema.fertilizersCatalogue.p_id_catalogue,
                p_name_nl: schema.fertilizersCatalogue.p_name_nl,
                p_app_amount: schema.fertilizerApplication.p_app_amount,
                p_app_method: schema.fertilizerApplication.p_app_method,
                p_app_date: schema.fertilizerApplication.p_app_date,
                p_app_id: schema.fertilizerApplication.p_app_id,
                b_id_harvesting: schema.cultivationHarvesting.b_id_harvesting,
                b_lu_harvest_date:
                    schema.cultivationHarvesting.b_lu_harvest_date,
                b_id_harvestable: schema.harvestables.b_id_harvestable,
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
                schema.cultivationStarting,
                eq(schema.fields.b_id, schema.cultivationStarting.b_id),
            )
            .leftJoin(
                schema.cultivationEnding,
                eq(
                    schema.cultivationEnding.b_lu,
                    schema.cultivationStarting.b_lu,
                ),
            )
            .leftJoin(
                schema.cultivations,
                eq(schema.cultivationStarting.b_lu, schema.cultivations.b_lu),
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
                    isNotNull(schema.cultivationStarting.b_id),
                    timeframeClause,
                ),
            )

        const cultivationPlan = cultivations.reduce(
            (acc: CultivationPlan[], curr: (typeof cultivations)[0]) => {
                let existingCultivation = acc.find(
                    (item) =>
                        item.b_lu_catalogue === curr.b_lu_catalogue &&
                        (item.b_lu_start?.getTime() ?? 0) ===
                            (curr.b_lu_start?.getTime() ?? 0) &&
                        (item.b_lu_end?.getTime() ?? 0) ===
                            (curr.b_lu_end?.getTime() ?? 0),
                )

                if (!existingCultivation) {
                    if (timeframe) {
                        if (
                            !isCultivationWithinTimeframe(
                                curr.b_lu_start,
                                curr.b_lu_end,
                                timeframe,
                            )
                        ) {
                            return acc
                        }
                    }
                    existingCultivation = {
                        b_lu_catalogue: curr.b_lu_catalogue,
                        b_lu_name: curr.b_lu_name,
                        b_lu_start: curr.b_lu_start,
                        b_lu_end: curr.b_lu_end,
                        m_cropresidue: curr.m_cropresidue,
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
                        b_lu_harvest_date: curr.b_lu_harvest_date,
                        harvestable: {
                            b_id_harvestable: curr.b_id_harvestable,
                            harvestable_analyses: [
                                {
                                    b_lu_yield: curr.b_lu_yield,
                                    b_lu_n_harvestable: curr.b_lu_n_harvestable,
                                    b_lu_n_residue: curr.b_lu_n_residue,
                                    b_lu_p_harvestable: curr.b_lu_p_harvestable,
                                    b_lu_p_residue: curr.b_lu_p_residue,
                                    b_lu_k_harvestable: curr.b_lu_k_harvestable,
                                    b_lu_k_residue: curr.b_lu_k_residue,
                                },
                            ],
                        },
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

export function isCultivationWithinTimeframe(
    b_lu_start: Date | null,
    b_lu_end: Date | null,
    timeframe: Timeframe,
): boolean {
    if (!b_lu_start || !timeframe.start || !timeframe.end) return false

    if (b_lu_end) {
        return (
            (b_lu_start >= timeframe.start && b_lu_start <= timeframe.end) ||
            (b_lu_end >= timeframe.start && b_lu_end <= timeframe.end) ||
            (b_lu_start <= timeframe.start && b_lu_end >= timeframe.end)
        )
    }
    return b_lu_start >= timeframe.start && b_lu_start <= timeframe.end
}

/**
 * Removes a cultivation and its related sowing and termination records from the database.
 *
 * The function first verifies that the principal has permission to perform the removal, then executes a transaction that
 * deletes the cultivation's termination, sowing, and main records. An error is thrown if the cultivation does not exist
 * or if the deletion fails.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param b_lu - The unique identifier of the cultivation to remove.
 *
 * @returns A Promise that resolves once the removal is complete.
 *
 * @throws {Error} If the cultivation is not found or the deletion operation fails.
 *
 * @alpha
 */
export async function removeCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeInsert["b_lu"],
): Promise<void> {
    try {
        await checkPermission(
            fdm,
            "cultivation",
            "write",
            b_lu,
            principal_id,
            "removeCultivation",
        )
        return await fdm.transaction(async (tx: FdmType) => {
            const existing = await tx
                .select()
                .from(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .limit(1)

            if (existing.length === 0) {
                throw new Error("Cultivation does not exist")
            }

            // Delete associated harvest records first
            await tx
                .delete(schema.cultivationHarvesting)
                .where(eq(schema.cultivationHarvesting.b_lu, b_lu))

            await tx
                .delete(schema.cultivationEnding)
                .where(eq(schema.cultivationEnding.b_lu, b_lu))

            await tx
                .delete(schema.cultivationStarting)
                .where(eq(schema.cultivationStarting.b_lu, b_lu))

            await tx
                .delete(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
        })
    } catch (err) {
        throw handleError(err, "Exception for removeCultivation", { b_lu })
    }
}

/**
 * Updates the specified cultivation's details.
 *
 * Performs permission checks and validates that the new dates are logically consistent and that the referenced cultivation and catalogue entries exist. Depending on the inputs, it updates the main cultivation record along with its related sowing, termination, and, if applicable, harvest records.
 *
 * @param fdm The FDM instance providing the connection to the database. The instance can be created with {@link createFdmServer}.
 * @param principal_id - The ID of the principal authorized to perform this update.
 * @param b_lu - The unique cultivation identifier.
 * @param b_lu_catalogue - (Optional) The new catalogue ID; if provided, it must correspond to an existing catalogue entry.
 * @param b_lu_start - (Optional) The updated sowing date; when provided with a termination date, it must precede it.
 * @param b_lu_end - (Optional) The updated termination date; if provided, it must be later than the sowing date.
 * @param m_cropresidue - (Optional) Whether crop residues are left on the field or not after termination of the cultivation.
 * @returns A Promise that resolves upon successful completion of the update.
 *
 * @throws {Error} If the cultivation does not exist, if date validations fail, or if the update operation encounters an issue.
 *
 * @alpha
 */
export async function updateCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
    b_lu_catalogue?: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_lu_start?: schema.cultivationStartingTypeInsert["b_lu_start"],
    b_lu_end?: schema.cultivationEndingTypeInsert["b_lu_end"],
    m_cropresidue?: schema.cultivationEndingTypeInsert["m_cropresidue"],
): Promise<void> {
    try {
        const updated = new Date()

        await checkPermission(
            fdm,
            "cultivation",
            "write",
            b_lu,
            principal_id,
            "updateCultivation",
        )

        if (
            b_lu_start &&
            b_lu_end &&
            b_lu_end.getTime() <= b_lu_start.getTime()
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

            if (b_lu_start) {
                // Validate if sowing date is before termination date
                if (!b_lu_end) {
                    const result = await tx
                        .select({
                            b_lu_end: schema.cultivationEnding.b_lu_end,
                        })
                        .from(schema.cultivationEnding)
                        .where(
                            and(
                                eq(schema.cultivationEnding.b_lu, b_lu),
                                isNotNull(schema.cultivationEnding.b_lu_end),
                            ),
                        )
                        .limit(1)

                    if (result.length > 0) {
                        if (
                            b_lu_start.getTime() >= result[0].b_lu_end.getTime()
                        ) {
                            throw new Error(
                                "Sowing date must be before termination date",
                            )
                        }
                    }
                }

                await tx
                    .update(schema.cultivationStarting)
                    .set({ updated: updated, b_lu_start: b_lu_start })
                    .where(eq(schema.cultivationStarting.b_lu, b_lu))
            }

            if (b_lu_end) {
                // Validate if terminatinge date is after sowing date
                if (!b_lu_start) {
                    const result = await tx
                        .select({
                            b_lu_start: schema.cultivationStarting.b_lu_start,
                        })
                        .from(schema.cultivationStarting)
                        .where(
                            and(
                                eq(schema.cultivationStarting.b_lu, b_lu),
                                isNotNull(
                                    schema.cultivationStarting.b_lu_start,
                                ),
                            ),
                        )
                        .limit(1)

                    if (result.length > 0) {
                        if (
                            result[0].b_lu_start.getTime() >= b_lu_end.getTime()
                        ) {
                            throw new Error(
                                "Terminate date must be after sowing date",
                            )
                        }
                    }
                }

                await tx
                    .update(schema.cultivationEnding)
                    .set({
                        updated: updated,
                        b_lu_end: b_lu_end,
                        m_cropresidue: m_cropresidue,
                    })
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))

                const harvestableType = await getHarvestableTypeOfCultivation(
                    tx,
                    b_lu,
                )
                if (harvestableType === "once") {
                    // If harvestable type is "once", add harvest on terminate date
                    const harvests = await getHarvests(tx, principal_id, b_lu)
                    if (harvests.length > 0) {
                        await tx
                            .update(schema.cultivationHarvesting)
                            .set({
                                updated: updated,
                                b_lu_harvest_date: b_lu_end,
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
                            principal_id,
                            b_lu,
                            b_lu_end,
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
            b_lu_start,
            b_lu_end,
        })
    }
}

// Helper function to build date range conditions
export const buildDateRangeCondition = (
    dateStart: Date | null | undefined,
    dateEnd: Date | null | undefined,
): SQL | undefined => {
    if (!dateStart && !dateEnd) {
        return undefined
    }
    const startCondition = dateStart
        ? gte(schema.cultivationStarting.b_lu_start, dateStart)
        : undefined
    const endCondition = dateEnd
        ? lte(schema.cultivationStarting.b_lu_start, dateEnd)
        : undefined

    if (startCondition && endCondition) {
        return and(startCondition, endCondition)
    }
    if (startCondition) {
        return startCondition
    }
    return endCondition
}

// Helper function to build date range conditions for ending
export const buildDateRangeConditionEnding = (
    dateStart: Date | null | undefined,
    dateEnd: Date | null | undefined,
): SQL | undefined => {
    if (!dateStart && !dateEnd) {
        return undefined
    }
    const startCondition = dateStart
        ? or(
              gte(schema.cultivationEnding.b_lu_end, dateStart),
              and(
                  isNotNull(schema.cultivationEnding.b_lu_end),
                  gte(schema.cultivationStarting.b_lu_start, dateStart),
              ),
          )
        : undefined
    const endCondition = dateEnd
        ? or(
              lte(schema.cultivationEnding.b_lu_end, dateEnd),
              and(
                  isNotNull(schema.cultivationEnding.b_lu_end),
                  lte(schema.cultivationStarting.b_lu_start, dateEnd),
              ),
          )
        : undefined

    if (startCondition && endCondition) {
        return and(startCondition, endCondition)
    }
    if (startCondition) {
        return startCondition
    }
    return endCondition
}
