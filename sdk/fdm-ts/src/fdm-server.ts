// import { access, constants } from 'node:fs';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from './db/schema';

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

  constructor(host: string, port: number | undefined, user: string, password: string, database:string) {

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

    // Migrate the db to the latest version, if needed
    this.migrateDatabase()
  }

  // Migrate the databe to the latest version
  private migrateDatabase() {

    // This will run migrations on the database, skipping the ones already applied
    migrate(this.db, { migrationsFolder: '/schema/migrations', migrationsSchema: 'fdm-migrations' });

  }
}