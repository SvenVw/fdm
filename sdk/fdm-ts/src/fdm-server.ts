// import { access, constants } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { buildSchema } from 'drizzle-graphql';
import postgres from 'postgres';
import * as schema from './db/schema';
import { farms } from './db/schema';

export class fdmServer {
  /**
* Class of fdmServer to interact with the Farm Data Model
* @param host  -
* @param port - 
* @param user - 
* @param password - 
* @param database - 
* @returns A fdm class with the functions to interact with the data
* @public
*/

  client: ReturnType<typeof postgres>
  db: ReturnType<typeof drizzle>

  constructor(host: string, port: number, user: string, password: string, database:string) {

    // Create a client
    this.client = postgres({
        host: host,
        port: port,
        user: user,
        password: password,
        database: database,
        max: 1,
    })

    // Create the db instance
    this.db = drizzle(this.client, { schema })

  }

  // Migrate the databe to the latest version
  async migrateDatabase() {

    // This will run migrations on the database, skipping the ones already applied
    await migrate(this.db, { migrationsFolder: 'src/db/migrations', migrationsSchema: 'fdm-migrations' });

  }

  /**
   * Returns the GraphQL schema for the Farm Data Model
   * 
   * @param farmData - An object containing the data for the new farm.
   * @returns A Promise that resolves when the farm has been added.
   */
  public getGraphQlSchema() {
    const { schema } = buildSchema(this.db)

    return schema
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