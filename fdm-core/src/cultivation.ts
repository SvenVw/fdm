import { and, eq, isNotNull } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getCultivationType } from './cultivation.d'

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
        b_lu_catalogue: schema.cultivationsCatalogueTypeInsert['b_lu_catalogue'],
        b_lu_source: schema.cultivationsCatalogueTypeInsert['b_lu_source'],
        b_lu_name: schema.cultivationsCatalogueTypeInsert['b_lu_name'],
        b_lu_name_en: schema.cultivationsCatalogueTypeInsert['b_lu_name_en'],
        b_lu_hcat3: schema.cultivationsCatalogueTypeInsert['b_lu_hcat3'],
        b_lu_hcat3_name: schema.cultivationsCatalogueTypeInsert['b_lu_hcat3_name']
    }
): Promise<void> {

    // Insert the cultivation in the db
    await fdm
        .insert(schema.cultivationsCatalogue)
        .values(properties)
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
    b_lu_catalogue: schema.cultivationsTypeInsert['b_lu_catalogue'],
    b_id: schema.fieldSowingTypeInsert['b_id'],
    b_sowing_date: schema.fieldSowingTypeInsert['b_sowing_date'],
): Promise<schema.cultivationsTypeSelect['b_lu']> {

    // Generate an ID for the cultivation
    const b_lu = nanoid()

    await fdm.transaction(async (tx: FdmType) => {
        try {

            // Validate if field exists
            const field = await tx
                .select()
                .from(schema.fields)
                .where(eq(schema.fields.b_id, b_id))
                .limit(1)
            if (field.length === 0) {
                throw new Error('Field does not exist')
            }

            await tx
                .insert(schema.cultivations)
                .values({
                    b_lu: b_lu,
                    b_lu_catalogue: b_lu_catalogue
                })

            await tx
                .insert(schema.fieldSowing)
                .values({
                    b_id: b_id,
                    b_lu: b_lu,
                    b_sowing_date: b_sowing_date
                })

        } catch (error) {
            tx.rollback()
            throw new Error('addCultivation failed with error ' + error)
        }
    })

    return b_lu
}

/**
 * Retrieves the details of a specific cultivation.
 *
 * @param fdm The FDM instance.
 * @param b_lu The ID of the cultivation.
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
 * Retrieves all cultivations for a given field.
 *
 * @param fdm The FDM instance.
 * @param b_id The ID of the field.
 * @returns A Promise that resolves with an array of cultivation details.
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
 * listing the fields associated with that specific cultivation.  The `fields` array contains objects,
 * each specifying the `b_lu` (cultivation ID) and `b_id` (field ID) combination.
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
export async function getCultivationPlan(fdm: FdmType, b_id_farm: schema.farmsTypeSelect['b_id_farm']): Promise<Array<{
    b_lu_catalogue: string;
    b_lu_name: string;
    fields: Array<{
        b_lu: string;
        b_id: string;
    }>;
}>> {

    const cultivations = await fdm
        .select({
            b_lu_catalogue: schema.cultivationsCatalogue.b_lu_catalogue,
            b_lu_name: schema.cultivationsCatalogue.b_lu_name,
            b_lu: schema.cultivations.b_lu,
            b_id: schema.fields.b_id            
        })
        .from(schema.farms)
        .leftJoin(schema.farmManaging, eq(schema.farms.b_id_farm, schema.farmManaging.b_id_farm))
        .leftJoin(schema.fields, eq(schema.farmManaging.b_id, schema.fields.b_id))
        .leftJoin(schema.fieldSowing, eq(schema.fields.b_id, schema.fieldSowing.b_id))
        .leftJoin(schema.cultivations, eq(schema.fieldSowing.b_lu, schema.cultivations.b_lu))
        .leftJoin(schema.cultivationsCatalogue, eq(schema.cultivations.b_lu_catalogue, schema.cultivationsCatalogue.b_lu_catalogue))
        .where(and(
            eq(schema.farms.b_id_farm, b_id_farm), 
            isNotNull(schema.cultivationsCatalogue.b_lu_catalogue))
        )

        const cultivationPlan = cultivations.reduce((acc, curr) => {
            const existingCultivation = acc.find(item => item.b_lu_catalogue === curr.b_lu_catalogue)
            if (existingCultivation) {
                existingCultivation.fields.push({ b_lu: curr.b_lu, b_id: curr.b_id })
            } else {
                acc.push({
                    b_lu_catalogue: curr.b_lu_catalogue,
                    b_lu_name: curr.b_lu_name,
                    fields: [{ b_lu: curr.b_lu, b_id: curr.b_id }]
                });
            }
            return acc
        }, []);

        return cultivationPlan
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
            await tx
                .delete(schema.fieldSowing)
                .where(eq(schema.fieldSowing.b_lu, b_lu))

            const deletedResult = await tx
                .delete(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))
                .returning({b_lu: schema.cultivations.b_lu})

            if (deletedResult.rowCount === 0) {
                throw new Error(`Cultivation with b_lu ${b_lu} does not exist`)
            }
        }
        catch (error) {
            tx.rollback()
            throw new Error(`Failed to remove cultivation: ${error}`);
        }
    })
}