// import { access, constants } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator'
import * as schema from './db/schema';
import { farms } from './db/schema';

export class fdmLocal {
  /**
* Class of fdm to interact with the Farm Data Model
* @param isPersisted  - Whether to store the data persistent on the local file system. Requires {@link filePath} to be included
* @param filePath - The location where to store the data
* @returns A fdm class with the functions to interact with the data
* @public
*/

  client: PGlite
  db: ReturnType<typeof drizzle>

  constructor(isPersisted: boolean, filePath: string) {

    let dataDir = 'memory://'
    if (isPersisted == true) {

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
  async migrateDatabase() {

    // This will run migrations on the database, skipping the ones already applied
    await migrate(this.db, { migrationsFolder: 'src/db/migrations' });

  }

  /**
* Adds a new farm to the 'farms' table.
* 
* @param farmData - An object containing the data for the new farm.
* @returns A Promise that resolves when the farm has been added.
*/
  public async addFarm(farmData: schema.farmsTypeInsert): Promise<void> {
    await this.db.insert(farms).values(farmData);
  }
}