/**
 * @file This file contains functions for managing cultivations in the FDM.
 *
 * It provides a comprehensive set of CRUD (Create, Read, Update, Delete) operations for cultivations,
 * as well as functions for interacting with the cultivation catalogue. It also includes functionalities
 * for retrieving cultivation plans and handling cultivation-related data.
 */
import {
    and,
    asc,
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
import type {
    Cultivation,
    CultivationCatalogue,
    CultivationDefaultDates,
    CultivationPlan,
} from "./cultivation.d"
import * as schema from "./db/schema"
import { handleError } from "./error"
import type { FdmType } from "./fdm"
import { determineIfFieldIsProductive } from "./field"
import {
    addHarvest,
    getHarvestableTypeOfCultivation,
    getHarvests,
} from "./harvest"
import { createId } from "./id"
import type { Timeframe } from "./timeframe"

/**
 * Retrieves all cultivations from the catalogues that are enabled for a specific farm.
 *
 * This function first checks if the principal has read access to the farm. It then fetches the list
 * of enabled cultivation catalogues for the farm and returns all cultivation entries from those catalogues.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @returns A promise that resolves to an array of `CultivationCatalogue` objects.
 * @throws An error if the principal does not have permission to read the farm's data or if the database query fails.
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
 * Adds a new cultivation entry to the cultivation catalogue.
 *
 * This function allows for the extension of the cultivation catalogue with new types of cultivations.
 * It performs validation to ensure the cultivation does not already exist and that the date formats are correct.
 *
 * @param fdm The FDM instance for database access.
 * @param properties An object containing the properties of the new cultivation entry.
 * @returns A promise that resolves when the cultivation has been successfully added to the catalogue.
 * @throws An error if the cultivation already exists, if the date formats are invalid, or if the database insertion fails.
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
        b_lu_rest_oravib: schema.cultivationsCatalogueTypeInsert["b_lu_rest_oravib"]
        b_lu_variety_options: schema.cultivationsCatalogueTypeInsert["b_lu_variety_options"]
        b_lu_start_default: schema.cultivationsCatalogueTypeInsert["b_lu_start_default"]
        b_date_harvest_default: schema.cultivationsCatalogueTypeInsert["b_date_harvest_default"]
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

            // Validate if b_lu_start_default and b_date_harvest_default follows format MM-dd
            const dateRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[1-2][0-9]|3[0-1])$/
            if (
                properties.b_lu_start_default &&
                !dateRegex.test(properties.b_lu_start_default)
            ) {
                throw new Error(
                    "Invalid b_lu_start_default format. Expected MM-dd.",
                )
            }
            if (
                properties.b_date_harvest_default &&
                !dateRegex.test(properties.b_date_harvest_default)
            ) {
                throw new Error(
                    "Invalid b_date_harvest_default format. Expected MM-dd.",
                )
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
 * Retrieves the default start and end dates for a cultivation in a given year.
 *
 * This function determines the default sowing and harvest dates for a specific cultivation. It handles cases where
 * the cultivation period spans across calendar years and adjusts the dates accordingly.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param b_lu_catalogue The catalogue identifier for the cultivation.
 * @param year The year for which to get the default dates.
 * @returns A promise that resolves to a `CultivationDefaultDates` object containing the start and end dates.
 * @throws An error if the principal does not have permission, the year is invalid, or the cultivation is not found.
 */
export async function getDefaultDatesOfCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_id_farm: schema.farmsTypeSelect["b_id_farm"],
    b_lu_catalogue: schema.cultivationsCatalogueTypeSelect["b_lu_catalogue"],
    year: number,
): Promise<CultivationDefaultDates> {
    try {
        await checkPermission(
            fdm,
            "farm",
            "read",
            b_id_farm,
            principal_id,
            "getDefaultDatesOfCultivation",
        )

        // Validate year
        if (!year || !Number.isInteger(year) || year < 1970 || year >= 2100) {
            throw new Error("Invalid year")
        }

        // Retrieve the enabled cultivation catalogues for the specified farm.
        const enabledCatalogues = await fdm
            .select({
                b_lu_source: schema.cultivationCatalogueSelecting.b_lu_source,
            })
            .from(schema.cultivationCatalogueSelecting)
            .where(
                eq(schema.cultivationCatalogueSelecting.b_id_farm, b_id_farm),
            )

        if (enabledCatalogues.length === 0) {
            throw new Error("Cultivation not found in catalogue")
        }

        // Fetch the specified cultivation's default date information from the enabled catalogues.
        const cultivationsCatalogue = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                b_lu_harvestable: schema.cultivationsCatalogue.b_lu_harvestable,
                b_lu_start_default:
                    schema.cultivationsCatalogue.b_lu_start_default,
                b_date_harvest_default:
                    schema.cultivationsCatalogue.b_date_harvest_default,
            })
            .from(schema.cultivationsCatalogue)
            .where(
                and(
                    inArray(
                        schema.cultivationsCatalogue.b_lu_source,
                        enabledCatalogues.map(
                            (c: { b_lu_source: string }) => c.b_lu_source,
                        ),
                    ),
                    eq(
                        schema.cultivationsCatalogue.b_lu_catalogue,
                        b_lu_catalogue,
                    ),
                ),
            )
            .limit(1)

        if (cultivationsCatalogue.length === 0) {
            throw new Error("Cultivation not found in catalogue")
        }

        // Set default dates of March 15th to September 15th if not provided
        const defaultStart =
            cultivationsCatalogue[0].b_lu_start_default ?? "03-15"
        const defaultEnd =
            cultivationsCatalogue[0].b_date_harvest_default ?? "09-15"

        // Construct the default start date using the provided year.
        const cultivationDefaultDates: CultivationDefaultDates = {
            b_lu_start: new Date(`${year}-${defaultStart}`),
            b_lu_end: new Date(`${year}-${defaultEnd}`),
        }

        // If the calculated end date is earlier than the start date, it implies the sowing
        // occurred in the previous year, so we use the previous year for the start date.
        if (
            cultivationDefaultDates.b_lu_end &&
            cultivationDefaultDates.b_lu_end.getTime() <=
                cultivationDefaultDates.b_lu_start.getTime()
        ) {
            cultivationDefaultDates.b_lu_start = new Date(
                `${year - 1}-${defaultStart}`,
            )
        }

        // For cultivations that can be harvested multiple times or not at all, set b_lu_end to undefined
        if (cultivationsCatalogue[0].b_lu_harvestable !== "once") {
            cultivationDefaultDates.b_lu_end = undefined
        }

        return cultivationDefaultDates
    } catch (err) {
        throw handleError(err, "Exception for getDefaultDatesOfCultivation", {
            principal_id,
            b_id_farm,
            b_lu_catalogue,
            year,
        })
    }
}

/**
 * Adds a new cultivation to a field.
 *
 * This function creates a new cultivation record and associates it with a field. It performs several validation checks,
 * such as ensuring the dates are valid, the field and cultivation catalogue entry exist, and that there are no
 * duplicate cultivations. It also automatically adds a harvest record if the cultivation is of a type that is
 * harvested only once and an end date is provided.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_lu_catalogue The catalogue identifier for the cultivation.
 * @param b_id The unique identifier of the field.
 * @param b_lu_start The start date of the cultivation.
 * @param b_lu_end The end date of the cultivation (optional).
 * @param m_cropresidue A boolean indicating if crop residue is left (optional).
 * @param b_lu_variety The variety of the cultivation (optional).
 * @returns A promise that resolves to the unique identifier of the newly created cultivation.
 * @throws An error if any of the validation checks fail or if the database insertion fails.
 */
export async function addCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu_catalogue: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_id: schema.cultivationStartingTypeInsert["b_id"],
    b_lu_start: schema.cultivationStartingTypeInsert["b_lu_start"],
    b_lu_end?: schema.cultivationEndingTypeInsert["b_lu_end"],
    m_cropresidue?: schema.cultivationEndingTypeInsert["m_cropresidue"],
    b_lu_variety?: schema.cultivationsTypeInsert["b_lu_variety"],
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
                if (b_lu_end.getTime() <= b_lu_start.getTime()) {
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

            // Validate when b_lu_variety is provided for the cultivation that the variety provided is listed as an option in the cultivation catalogue
            if (b_lu_variety) {
                const catalogueEntry = await tx
                    .select({
                        b_lu_variety_options:
                            schema.cultivationsCatalogue.b_lu_variety_options,
                    })
                    .from(schema.cultivationsCatalogue)
                    .where(
                        eq(
                            schema.cultivationsCatalogue.b_lu_catalogue,
                            b_lu_catalogue,
                        ),
                    )
                    .limit(1)

                if (
                    catalogueEntry.length > 0 &&
                    catalogueEntry[0].b_lu_variety_options &&
                    !catalogueEntry[0].b_lu_variety_options.includes(
                        b_lu_variety,
                    )
                ) {
                    throw new Error(
                        "Variety not available for this cultivation",
                    )
                }
            }

            await tx.insert(schema.cultivations).values({
                b_lu: b_lu,
                b_lu_catalogue: b_lu_catalogue,
                b_lu_variety: b_lu_variety,
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
            m_cropresidue,
            b_lu_variety,
        })
    }
}

/**
 * Retrieves a single cultivation by its unique identifier.
 *
 * This function checks if the principal has read access to the cultivation and then fetches the
 * cultivation's details from the database.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_lu The unique identifier of the cultivation.
 * @returns A promise that resolves to a `Cultivation` object.
 * @throws An error if the principal does not have permission or if the cultivation is not found.
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
                b_lu_variety: schema.cultivations.b_lu_variety,
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
 * Retrieves all cultivations for a specific field, optionally filtered by a timeframe.
 *
 * This function checks if the principal has read access to the field and then fetches all
 * associated cultivations. The results can be filtered to a specific time range.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id The unique identifier of the field.
 * @param timeframe An optional timeframe to filter the cultivations.
 * @returns A promise that resolves to an array of `Cultivation` objects.
 * @throws An error if the principal does not have permission or if the database query fails.
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

        const timeframeCondition = buildCultivationTimeframeCondition(timeframe)

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
                b_lu_variety: schema.cultivations.b_lu_variety,
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
                timeframeCondition
                    ? and(
                          eq(schema.cultivationStarting.b_id, b_id),
                          timeframeCondition,
                      )
                    : eq(schema.cultivationStarting.b_id, b_id),
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
 * Retrieves a detailed cultivation plan for a farm, including fields, fertilizers, and harvests.
 *
 * This function provides a comprehensive overview of all cultivations on a farm. It aggregates data
 * from various tables to build a nested structure that is easy to work with on the client-side.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_id_farm The unique identifier of the farm.
 * @param timeframe An optional timeframe to filter the cultivations.
 * @returns A promise that resolves to an array of `CultivationPlan` objects.
 * @throws An error if the principal does not have permission or if the database query fails.
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

        const timeframeCondition = buildCultivationTimeframeCondition(timeframe)

        const cultivations = await fdm
            .select({
                b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
                b_lu_name: schema.cultivationsCatalogue.b_lu_name,
                b_lu_variety: schema.cultivations.b_lu_variety,
                b_lu: schema.cultivations.b_lu,
                b_id: schema.fields.b_id,
                b_name: schema.fields.b_name,
                b_area: sql<number>`ROUND((ST_Area(b_geometry::geography)/10000)::NUMERIC, 2)::FLOAT`,
                b_perimeter: sql<number>`ROUND((ST_Length(ST_ExteriorRing(b_geometry)::geography))::NUMERIC, 2)::FLOAT`,
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
                timeframeCondition
                    ? and(
                          eq(schema.farms.b_id_farm, b_id_farm),
                          isNotNull(
                              schema.cultivationsCatalogue.b_lu_catalogue,
                          ),
                          isNotNull(schema.cultivationStarting.b_id),
                          timeframeCondition,
                      )
                    : and(
                          eq(schema.farms.b_id_farm, b_id_farm),
                          isNotNull(
                              schema.cultivationsCatalogue.b_lu_catalogue,
                          ),
                          isNotNull(schema.cultivationStarting.b_id),
                      ),
            )

        const cultivationPlan = cultivations.reduce(
            (acc: CultivationPlan[], curr: (typeof cultivations)[0]) => {
                let existingCultivation = acc.find(
                    (item) =>
                        item.b_lu_catalogue === curr.b_lu_catalogue &&
                        item.b_lu_variety === curr.b_lu_variety &&
                        (item.b_lu_start?.getTime() ?? 0) ===
                            (curr.b_lu_start?.getTime() ?? 0) &&
                        (item.b_lu_end?.getTime() ?? 0) ===
                            (curr.b_lu_end?.getTime() ?? 0),
                )

                if (!existingCultivation) {
                    existingCultivation = {
                        b_lu_catalogue: curr.b_lu_catalogue,
                        b_lu_name: curr.b_lu_name,
                        b_lu_variety: curr.b_lu_variety,
                        b_area: 0,
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
                        b_area: curr.b_area,
                        b_name: curr.b_name,
                        b_isproductive: determineIfFieldIsProductive(
                            curr.b_area,
                            curr.b_perimeter,
                            curr.b_name,
                        ),
                        fertilizer_applications: [],
                        harvests: [],
                    }
                    existingCultivation.fields.push(existingField)
                    if (curr.b_area) {
                        existingCultivation.b_area += curr.b_area
                    }
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

/**
 * Removes a cultivation and all its associated data.
 *
 * This function performs a cascaded delete of a cultivation, including its starting and ending records,
 * as well as any associated harvests. It is an atomic operation that ensures data consistency.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_lu The unique identifier of the cultivation to remove.
 * @returns A promise that resolves when the cultivation has been successfully removed.
 * @throws An error if the principal does not have permission or if the cultivation does not exist.
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
 * Updates the properties of an existing cultivation.
 *
 * This function allows for the modification of a cultivation's details, such as its start and end dates,
 * variety, and catalogue entry. It performs validation to ensure the data remains consistent.
 *
 * @param fdm The FDM instance for database access.
 * @param principal_id The identifier of the principal making the request.
 * @param b_lu The unique identifier of the cultivation to update.
 * @param b_lu_catalogue The new catalogue identifier for the cultivation (optional).
 * @param b_lu_start The new start date for the cultivation (optional).
 * @param b_lu_end The new end date for the cultivation (optional).
 * @param m_cropresidue A boolean indicating if crop residue is left (optional).
 * @param b_lu_variety The new variety for the cultivation (optional).
 * @returns A promise that resolves when the cultivation has been successfully updated.
 * @throws An error if the principal does not have permission, the cultivation does not exist, or the provided data is invalid.
 */
export async function updateCultivation(
    fdm: FdmType,
    principal_id: PrincipalId,
    b_lu: schema.cultivationsTypeSelect["b_lu"],
    b_lu_catalogue?: schema.cultivationsTypeInsert["b_lu_catalogue"],
    b_lu_start?: schema.cultivationStartingTypeInsert["b_lu_start"],
    b_lu_end?: schema.cultivationEndingTypeInsert["b_lu_end"],
    m_cropresidue?: schema.cultivationEndingTypeInsert["m_cropresidue"],
    b_lu_variety?: schema.cultivationsTypeInsert["b_lu_variety"],
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

            if (b_lu_variety !== undefined) {
                if (b_lu_variety) {
                    // Determine which catalogue to validate against (new vs existing)
                    const catalogueIdToValidate =
                        b_lu_catalogue ?? existingCultivation[0].b_lu_catalogue

                    // Validate if variety is listed as option for this cultivation
                    const catalogueEntry = await tx
                        .select({
                            b_lu_variety_options:
                                schema.cultivationsCatalogue
                                    .b_lu_variety_options,
                        })
                        .from(schema.cultivationsCatalogue)
                        .where(
                            eq(
                                schema.cultivationsCatalogue.b_lu_catalogue,
                                catalogueIdToValidate, // Use new catalogue if provided
                            ),
                        )
                        .limit(1)

                    if (
                        catalogueEntry.length > 0 &&
                        catalogueEntry[0].b_lu_variety_options &&
                        !catalogueEntry[0].b_lu_variety_options.includes(
                            b_lu_variety,
                        )
                    ) {
                        throw new Error(
                            "Variety not available for this cultivation",
                        )
                    }
                }

                await tx
                    .update(schema.cultivations)
                    .set({ b_lu_variety: b_lu_variety, updated: updated })
                    .where(eq(schema.cultivations.b_lu, b_lu))
            }

            if (b_lu_start) {
                // Validate if sowing date is before termination date
                if (b_lu_end === undefined) {
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

                    if (result.length > 0 && result[0].b_lu_end) {
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
                    .set({ b_lu_start: b_lu_start, updated: updated })
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
                    })
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))
            }

            if (m_cropresidue !== undefined) {
                await tx
                    .update(schema.cultivationEnding)
                    .set({
                        updated: updated,
                        m_cropresidue: m_cropresidue,
                    })
                    .where(eq(schema.cultivationEnding.b_lu, b_lu))
            }

            if (b_lu_end) {
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
            m_cropresidue,
            b_lu_variety,
        })
    }
}

/**
 * Builds a Drizzle ORM condition for filtering cultivations by a timeframe.
 *
 * This function creates a SQL condition that can be used in a `where` clause to select cultivations
 * that are active within the given timeframe. It correctly handles cultivations that have a start date
 * but no end date.
 *
 * @param timeframe The timeframe to filter by.
 * @returns A Drizzle ORM `SQL` object, or `undefined` if no timeframe is provided.
 * @internal
 */
export const buildCultivationTimeframeCondition = (
    timeframe: Timeframe | undefined,
): SQL | undefined => {
    if (!timeframe?.start || !timeframe?.end) {
        return undefined
    }

    // A cultivation is within the timeframe if:
    // 1. It has an end date AND (it starts within, ends within, or spans the timeframe)
    // OR
    // 2. It does NOT have an end date AND its start date is on or before the timeframe's end.
    return or(
        // Case 1: Cultivation has an end date and overlaps with the timeframe
        and(
            isNotNull(schema.cultivationEnding.b_lu_end),
            or(
                // Cultivation starts within the timeframe
                and(
                    gte(schema.cultivationStarting.b_lu_start, timeframe.start),
                    lte(schema.cultivationStarting.b_lu_start, timeframe.end),
                ),
                // Cultivation ends within the timeframe
                and(
                    gte(schema.cultivationEnding.b_lu_end, timeframe.start),
                    lte(schema.cultivationEnding.b_lu_end, timeframe.end),
                ),
                // Cultivation spans the entire timeframe
                and(
                    lte(schema.cultivationStarting.b_lu_start, timeframe.start),
                    gte(schema.cultivationEnding.b_lu_end, timeframe.end),
                ),
            ),
        ),
        // Case 2: Cultivation has no end date and its start is on or before the timeframe's end
        and(
            isNull(schema.cultivationEnding.b_lu_end),
            lte(schema.cultivationStarting.b_lu_start, timeframe.end),
        ),
    )
}
