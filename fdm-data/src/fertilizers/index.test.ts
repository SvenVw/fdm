import { describe, expect, it, beforeEach, afterAll } from 'vitest'
import { getFertilizersFromCatalogue, fdmSchema as schema, type FdmType } from '@svenvw/fdm-core'
import { extendFertilizersCatalogue } from '.'

import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'

describe('Fertilizers Data [server]', () => {
    let fdm: FdmType

    beforeEach(async () => {

        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
        const user = process.env.POSTGRES_USER
        const password = process.env.POSTGRES_PASSWORD
        const database = process.env.POSTGRES_DB
        const migrationsFolderPath = 'node_modules/@svenvw/fdm-core/dist/db/migrations'
        
        // Does not work yet :(
        // const fdm = await createFdmServer(
        //     host,
        //     port,
        //     user,
        //     password,
        //     database
        //   )
        // await migrateFdmServer(fdm)

        // Workaround
        fdm = drizzle({
            connection : {
              user : user,
              password : password,
              host : host,
              port : port,
              database : database
            },
            logger: false,
            schema: schema
          })
          
          // Run migration
          await migrate(fdm, { migrationsFolder: migrationsFolderPath, migrationsSchema: 'fdm-migrations' })
        
    })

    afterAll(async () => {
        try {
            // Clean up test data
            await fdm.delete(schema.fertilizerPicking).execute();
            await fdm.delete(schema.fertilizersCatalogue).execute();
        } catch (error) {
            console.error('Failed to cleanup:', error);
            throw error;
        }
    })

    it('should throw error if dataset is not recognized', async () => {
        await expect(extendFertilizersCatalogue(fdm, 'not-existing-dataset')).rejects.toThrowError('catalogue not-existing-dataset is not recognized')
    })

    it('should extend fertilizers catalogue with srm dataset', async () => {
        await extendFertilizersCatalogue(fdm, 'srm')

        const result = await getFertilizersFromCatalogue(fdm)
        expect(result.length).toBeGreaterThan(0)
    })
})
