import { access, constants } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';

export class fdm {
    /**
  * Class of fdm to interact with the Farm Data Model
  * @param isPersisted  - Whether to store the data persistent on the local file system. Requires {@link filePath} to be included
  * @param filePath - The location where to store the data
  * @returns A fdm class with the functions to interact with the data
  * @public
  */

    db: any // Unknown type yet

    constructor(isPersisted: boolean, filePath: string) {

        let dataDir = 'memory://'
        if (isPersisted) {

            // Check if file is accessible
            access(filePath, constants.R_OK | constants.W_OK, (err) => {
                console.error(`${filePath} ${err ? 'is not' : 'is'} readable and writable`);
            });

            // Set location of db file
            dataDir = filePath
        }

        // Create the db instance
        const client = new PGlite(dataDir)
        this.db = drizzle(client)

    }
}