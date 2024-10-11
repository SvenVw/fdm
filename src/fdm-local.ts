import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { PGlite } from '@electric-sql/pglite'
import { drizzle } from 'drizzle-orm/pglite'
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './db/schema'

import { getFieldType } from './fdm-server.d'

export class FdmLocal {
  /**
* Class of fdm to interact with the Farm Data Model
* @param isPersisted  - Whether to store the data persistent on the local file system. Requires {@link filePath} to be included
* @param filePath - The location where to store the data
* @returns A fdm class with the functions to interact with the data
* @experimental
*/

  client: PGlite
  db: ReturnType<typeof drizzle>

  constructor (isPersisted: boolean, filePath: string) {
    let dataDir = 'memory://'
    if (isPersisted) {
      // Check if file is accessible
      // access(filePath, constants.R_OK | constants.W_OK, (err) => {
      //     console.error(`${filePath} ${err ? 'is not' : 'is'} readable and writable`);
      // });

      // Set location of db file
      dataDir = filePath
    }

    // Create the db instance
    this.client = new PGlite(dataDir)
    this.db = drizzle(this.client, { schema })
  }

  // Migrate the databe to the latest version
  async migrateDatabase (migrationsFolderPath: string = './node_modules/@nmi/fdm/dist/db/migrations'): Promise<void> {
    // This will run migrations on the database, skipping the ones already applied
    await migrate(this.db, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })
  }

  /**
  * Add a new farm.
  *
  * @param b_name_farm - Name of the farm
  * @param b_sector - Sector(s) for which the farm is active
  * @returns A Promise that resolves when the farm has been added and returns the value for b_id_farm
  * @alpha
  */
  public async addFarm (b_name_farm: schema.farmsTypeInsert['b_name_farm'], b_sector: schema.farmsTypeInsert['b_sector']): Promise<schema.farmsTypeInsert['b_id_farm']> {
    // Generate an ID for the farm
    const b_id_farm = nanoid()

    // Insert the farm in the dab
    const farmData = {
      b_id_farm,
      b_name_farm,
      b_sector
    }
    await this.db
      .insert(schema.farms)
      .values(farmData)

    return b_id_farm
  }

  /**
  * Get the details of a specific farm.
  *
  * @param b_id_farm - The id of the farm to be requested.
  * @returns A Promise that resolves with an object that contains the details of a farm.
  * @alpha
  */
  public async getFarm (b_id_farm: schema.farmsTypeInsert['b_id_farm']): Promise<schema.farmsTypeSelect> {
    const farm = await this.db
      .select()
      .from(schema.farms)
      .where(eq(schema.farms.b_id_farm, b_id_farm))
      .limit(1)

    return farm[0]
  }

  /**
  * Update the details of a farm.
  *
  * @param b_id_farm - The id of the farm to be updated.
  * @param b_name_farm - The new value for the name of the farm.
  * @param b_sector - The new list of sectors for which this farm is active.
  * @returns A Promise that resolves with an object that contains the details of a farm.
  * @alpha
  */
  public async updateFarm (b_id_farm: schema.farmsTypeInsert['b_id_farm'], b_name_farm: schema.farmsTypeInsert['b_name_farm'], b_sector: schema.farmsTypeInsert['b_sector']): Promise<schema.farmsTypeSelect> {
    const updatedFarm = await this.db
      .update(schema.farms)
      .set({
        b_name_farm,
        b_sector,
        updated: new Date()
      })
      .where(eq(schema.farms.b_id_farm, b_id_farm))
      .returning({
        b_id_farm: schema.farms.b_id_farm,
        b_name_farm: schema.farms.b_name_farm,
        b_sector: schema.farms.b_sector,
        created: schema.farms.created,
        updated: schema.farms.updated
      })

    return updatedFarm[0]
  }

  /**
   * Add a new field
   *
   * @param b_id_farm - ID of the farm.
   * @param b_name - Name of the field.
   * @param b_manage_start - Start date of managing field.
   * @param b_manage_end - End date of managing field.
   * @param b_manage_type - Type of managing field.
   * @returns A Promise that resolves when the field has been added and returns the value for b_id.
   * @alpha
   */
  public async addField (b_id_farm: schema.farmManagingTypeInsert['b_id_farm'],
    b_name: schema.fieldsTypeInsert['b_name'], b_manage_start: schema.farmManagingTypeInsert['b_manage_start'], b_manage_end: schema.farmManagingTypeInsert['b_manage_end'], b_manage_type: schema.farmManagingTypeInsert['b_manage_type']): Promise<schema.fieldsTypeInsert['b_id']> {
    // Generate an ID for the field
    const b_id = nanoid()

    // Insert field
    const fieldData = {
      b_id,
      b_name
    }
    await this.db
      .insert(schema.fields)
      .values(fieldData)

    // Insert relation between farm and field
    const farmManagingData = {
      b_id,
      b_id_farm,
      b_manage_start,
      b_manage_end,
      b_manage_type
    }
    await this.db
      .insert(schema.farmManaging)
      .values(farmManagingData)

    return b_id
  }

  /**
  * Get the details of a specific field.
  *
  * @param b_id - The id of the field to be requested.
  * @returns A Promise that resolves with an object that contains the details of a field.
  * @alpha
  */
  public async getField (b_id: schema.fieldsTypeSelect['b_id']): Promise<getFieldType> {
    // Get properties of the requested field
    const field = await this.db
      .select({
        b_id: schema.fields.b_id,
        b_name: schema.fields.b_name,
        b_id_farm: schema.farmManaging.b_id_farm,
        b_manage_start: schema.farmManaging.b_manage_start,
        b_manage_end: schema.farmManaging.b_manage_end,
        b_manage_type: schema.farmManaging.b_manage_type,
        created: schema.fields.created,
        updated: schema.fields.updated
      })
      .from(schema.fields)
      .innerJoin(schema.farmManaging, eq(schema.fields.b_id, schema.farmManaging.b_id))
      .where(eq(schema.fields.b_id, b_id))
      .limit(1)

    return field[0]
  }

  /**
   * Update the details of a field
   *
   * @param b_id - ID of the field.
   * @param b_name - Name of the field.
   * @param b_manage_start - Start date of managing field.
   * @param b_manage_end - End date of managing field.
   * @param b_manage_type - Type of managing field.
   * @returns A Promise that resolves when the field has been added and returns the value for b_id.
   * @alpha
   */
  public async updateField (b_id: schema.fieldsTypeInsert['b_id'],
    b_name: schema.fieldsTypeInsert['b_name'], b_manage_start: schema.farmManagingTypeInsert['b_manage_start'], b_manage_end: schema.farmManagingTypeInsert['b_manage_end'], b_manage_type: schema.farmManagingTypeInsert['b_manage_type']): Promise<getFieldType> {
    const updatedField = await this.db.transaction(async (tx) => {
      try {
        await tx.update(schema.fields)
          .set({
            b_name,
            updated: new Date()
          })
          .where(eq(schema.fields.b_id, b_id))

        await tx.update(schema.farmManaging)
          .set({
            b_manage_start,
            b_manage_end,
            b_manage_type,
            updated: new Date()
          })
          .where(eq(schema.farmManaging.b_id, b_id))

        const field = await tx
          .select({
            b_id: schema.fields.b_id,
            b_name: schema.fields.b_name,
            b_id_farm: schema.farmManaging.b_id_farm,
            b_manage_start: schema.farmManaging.b_manage_start,
            b_manage_end: schema.farmManaging.b_manage_end,
            b_manage_type: schema.farmManaging.b_manage_type,
            created: schema.fields.created,
            updated: schema.fields.updated
          })
          .from(schema.fields)
          .innerJoin(schema.farmManaging, eq(schema.fields.b_id, schema.farmManaging.b_id))
          .where(eq(schema.fields.b_id, b_id))
          .limit(1)
        return field[0]
      } catch (error) {
        tx.rollback()
        throw new Error('Update of field failed with error ' + error)
      }
    })

    return updatedField
  }
}
