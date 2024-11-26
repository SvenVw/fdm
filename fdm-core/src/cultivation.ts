import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

import * as schema from './db/schema'
import { type FdmType } from './fdm'
import { getCultivationType } from './cultivation.d'

/**
 * Get cultivations available in catalogue
 *
 * @param fdm - 
 * @returns A Promise that resolves with an array of cultivations and the details.
 * @alpha
 */
export async function getCultivationsFromCatalogue(fdm: FdmType): Promise<schema.cultivationsCatalogueTypeSelect[]> {

    const cultivationsCatalogue = await fdm
        .select()
        .from(schema.cultivationsCatalogue)

    return cultivationsCatalogue
}

/**
 * Add cultivation to the catalogue
 *
 * @param fdm - 
 * @returns A Promise that resolves when the cultivation is added to the catalogue
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
 * Add cultivation to field
 *
 * @param fdm - 
 * @param b_lu_catalogue - Catalogue id of the cultivation
 * @param b_id - ID of the field
 * @param b_sowing_date - Date on which the cultivation is started
 * @returns A Promise that resolves with the id of the cultivation
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
 * Get the details of a cultivation
 * 
 * @param fdm 
 * @param b_lu- ID of requested cultivation
 * @returns A promise that resolves with properties of requested cultivation
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

    return cultivation[0]
}

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
 * Remove cultivation from farm
 *
 * @param fdm - 
 * @param b_lu - ID of the cultivation to be removed
 * @returns A Promise that resolves when the cultivation is removed from the field
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

            await tx
                .delete(schema.cultivations)
                .where(eq(schema.cultivations.b_lu, b_lu))

        }
        catch (error) {
            tx.rollback()
            throw new Error('removeCultivation failed with error ' + error)
        }
    })
}