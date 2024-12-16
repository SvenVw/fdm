import { and, eq, isNotNull, or } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { cultivationPlanType, getCultivationType } from './cultivation.d'

/**
 * Retrieves cultivations available in the catalogue.
 *
 * @param fdm The FDM instance.
 * @returns A Promise that resolves with an array of cultivation catalogue entries.
 * @alpha
 */
export async function getCultivationsFromCatalogue(fdm: FdmType): Promise<schema.cultivationsCatalogueTypeSelect[]> {

    const cultivationsCatalogue = await fdm
        .select()
        .from(schema.cultivationsCatalogue)

    return cultivationsCatalogue
}


/**
 * Adds a new cultivation to the catalogue if it doesn't already exist.
 *
 * @remarks
 * This function performs the addition within a transaction to ensure data consistency.
 * It first checks if a cultivation with the same catalogue ID exists before inserting.
 *
 * @param fdm - The database manager instance
 * @param properties - The cultivation properties
 * @param properties.b_lu_catalogue - Unique catalogue identifier
 * @param properties.b_lu_source - Source of the cultivation
 * @param properties.b_lu_name - Name of the cultivation
 * @param properties.b_lu_name_en - English name of the cultivation
 * @param properties.b_lu_hcat3 - Category identifier
 * @param properties.b_lu_hcat3_name - Category name
 *
 * @throws Error when a cultivation with the same catalogue ID already exists
 * @throws Error when the database operation fails
 *
 * @returns Promise that resolves when the cultivation is successfully added
 *
 * @alpha
 */
export async function addCultivationToCatalogue(
    fdm: FdmType,
    properties: {
        b_lu_catalogue: schema.cultivationsCatalogueTypeInsert['b_lu_catalogue'],
        b_lu_source: schema.cultivationsCatalogueTypeInsert['b_lu_source'],
        b_lu_name: schema.cultivationsCatalogueTypeInsert['b_lu_name'],
        b_lu_name_en: schema.cultivationsCatalogueTypeInsert['b_lu_name_en'],
        b_lu_hcat3: schema.cultivationsCatalogueTypeInsert['b_lu_hcat3'],
        b_lu_hcat3_name: schema.cultivationsCatalogueTypeInsert['b_lu_hcat3_name']
    }
): Promise<void> {
    await fdm.transaction(async (tx: FdmType) => {
        // Check for existing cultivation
        const existing = await tx
            .select()
            .from(schema.cultivationsCatalogue)
            .where(eq(schema.cultivationsCatalogue.b_lu_catalogue, properties.b_lu_catalogue))
            .limit(1)

        if (existing.length > 0) {
            throw new Error('Cultivation already exists in catalogue')
        }

        // Insert the cultivation in the db
        await tx
            .insert(schema.cultivationsCatalogue)
            .values(properties)
    })
}



/**
 * Adds a new cultivation to a field with validation checks.
 *
 * @remarks
 * This function performs several validation checks before adding the cultivation:
 * - Validates the sowing date format (YYYY-MM-DD)
 * - Verifies the field exists
 * - Confirms the cultivation exists in the catalogue
 * - Checks for duplicate cultivations
 *
 * @param fdm - The database management instance
 * @param b_lu_catalogue - The catalogue identifier for the cultivation type
 * @param b_id - The identifier of the field where the cultivation will be added
 * @param b_sowing_date - The sowing date in YYYY-MM-DD format
 * @returns A Promise resolving to the newly generated cultivation ID (b_lu)
 * @throws Error if:
 * - The sowing date format is invalid
 * - The specified field does not exist
 * - The cultivation type does not exist in the catalogue
 * - A duplicate cultivation already exists for the field
 * - Database operations fail
 *
 * @alpha
 */
export async function addCultivation(
    fdm: FdmType,
    b_lu_catalogue: schema.cultivationsTypeInsert['b_lu_catalogue'],
    b_id: schema.fieldSowingTypeInsert['b_id'],
    b_sowing_date: schema.fieldSowingTypeInsert['b_sowing_date'],
): Promise<schema.cultivationsTypeSelect['b_lu']> {
    // ... function implementation ...
}

/**
 * Retrieves the details of a specific cultivation.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation.
 * @returns A promise that resolves with the cultivation details.
 * @throws If the cultivation does not exist.
 */
export async function getCultivation(fdm: FdmType, b_lu: schema.cultivationsTypeSelect['b_lu']): Promise<getCultivationType> {

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
            b_id: schema.fieldSowing.b_id
        })
        .from(schema.cultivations)
        .leftJoin(schema.fieldSowing, eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu))
        .leftJoin(schema.cultivationsCatalogue, eq(schema.cultivations.b_lu_catalogue, schema.cultivationsCatalogue.b_lu_catalogue))
        .where(eq(schema.cultivations.b_lu, b_lu))
        .limit(1)

    // If no cultivation is found return an error
    if (cultivation.length === 0) {
        throw new Error('Cultivation does not exist')
    }

    return cultivation[0]
}


/**
 * Retrieves cultivation details for a specific field from the database.
 *
 * @remarks
 * Performs a complex database query joining cultivations, field sowing, and cultivation catalogue tables
 * to fetch comprehensive cultivation information including names, categories, and sowing dates.
 *
 * @param fdm - Database manager instance for executing queries
 * @param b_id - Unique identifier of the field to fetch cultivations for
 * @returns Promise resolving to an array of cultivation records containing details like
 *          cultivation name, category, source, sowing date, and related identifiers
 *
 * @throws Will throw if database query fails or if connection is lost
 * @alpha
 */
export async function getCultivations(fdm: FdmType, b_id: schema.fieldSowingTypeSelect['b_id']): Promise<getCultivationType[]> {

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
            b_id: schema.fieldSowing.b_id
        })
        .from(schema.cultivations)
        .leftJoin(schema.fieldSowing, eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu))
        .leftJoin(schema.cultivationsCatalogue, eq(schema.cultivations.b_lu_catalogue, schema.cultivationsCatalogue.b_lu_catalogue))
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
export async function getCultivationPlan(fdm: FdmType, b_id_farm: schema.farmsTypeSelect['b_id_farm']): Promise<cultivationPlanType[]> {
    if (!b_id_farm) {
        throw new Error('Farm ID is required')
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
                p_app_id: schema.fertilizerApplication.p_app_id
            })
            .from(schema.farms)
            .leftJoin(schema.farmManaging, eq(schema.farms.b_id_farm, schema.farmManaging.b_id_farm))
            .leftJoin(schema.fields, eq(schema.farmManaging.b_id, schema.fields.b_id))
            .leftJoin(schema.fieldSowing, eq(schema.fields.b_id, schema.fieldSowing.b_id))
            .leftJoin(schema.cultivations, eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu))
            .leftJoin(schema.cultivationsCatalogue, eq(schema.cultivations.b_lu_catalogue, schema.cultivationsCatalogue.b_lu_catalogue))
            .leftJoin(schema.fertilizerApplication, eq(schema.fertilizerApplication.b_id, schema.fields.b_id))
            .leftJoin(schema.fertilizerPicking, eq(schema.fertilizerPicking.p_id, schema.fertilizerApplication.p_id))
            .leftJoin(schema.fertilizersCatalogue, eq(schema.fertilizersCatalogue.p_id_catalogue, schema.fertilizerPicking.p_id_catalogue))
            .where(and(
                eq(schema.farms.b_id_farm, b_id_farm),
                isNotNull(schema.cultivationsCatalogue.b_lu_catalogue))
            )

            const cultivationPlan = cultivations.reduce((acc: cultivationPlanType[], curr: any) => {
                let existingCultivation = acc.find(item => item.b_lu_catalogue === curr.b_lu_catalogue);
            
                if (!existingCultivation) {
                    existingCultivation = {
                        b_lu_catalogue: curr.b_lu_catalogue,
                        b_lu_name: curr.b_lu_name,
                        fields: []
                    };
                    acc.push(existingCultivation);
                }
            
                let existingField = existingCultivation.fields.find(field => field.b_id === curr.b_id);
            
                if (!existingField) {
                    existingField = {
                        b_lu: curr.b_lu,
                        b_id: curr.b_id,
                        b_name: curr.b_name,
                        fertilizer_applications: []
                    };
                    existingCultivation.fields.push(existingField);
                }
            
                if (curr.p_app_id) {  // Only add if it's a fertilizer application
                    existingField.fertilizer_applications.push({
                        p_id_catalogue: curr.p_id_catalogue,
                        p_name_nl: curr.p_name_nl,
                        p_app_amount: curr.p_app_amount,
                        p_app_method: curr.p_app_method,
                        p_app_date: curr.p_app_date,
                        p_app_id: curr.p_app_id
                    });
                }
            
                return acc;
            }, []);

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
    b_lu: schema.cultivationsTypeInsert['b_lu']
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

        }
        catch (error) {

            throw new Error(`Failed to remove cultivation: ${error}`);
        }
    })
}