import { describe, expect, it, beforeEach, afterAll } from 'vitest'
import { createFdmServer, migrateFdmServer } from '@svenvw/fdm-core'
import { extendCultivationsCatalogue } from './index'
import { getCatalogueBrp } from './catalogues/brp'
import { type FdmServerType } from '@svenvw/fdm-core'


describe('Cultivations Catalogue', () => {
    let fdm: FdmServerType

    beforeEach(async () => {
        const host = process.env.POSTGRES_HOST
        const port = Number(process.env.POSTGRES_PORT)
        const user = process.env.POSTGRES_USER
        const password = process.env.POSTGRES_PASSWORD
        const database = process.env.POSTGRES_DB
        const migrationsFolderPath = 'src/db/migrations'

        fdm = await createFdmServer(host, port, user, password, database)
        await migrateFdmServer(fdm, migrationsFolderPath)
    })

    afterAll(async () => {
        // Clean up if necessary
    })


    it('should extend cultivations catalogue with brp', async () => {
        const catalogueName = 'brp'
        await extendCultivationsCatalogue(fdm, catalogueName)

        // Retrieve the catalogue from the database to verify
        const dbCatalogue = await fdm.select().from(fdm.fdmSchema.cultivationsCatalogue)

        // Get the expected catalogue
        const expectedCatalogue = getCatalogueBrp()

        // Check if all expected entries are in the database
        expect(dbCatalogue.length).toBeGreaterThanOrEqual(expectedCatalogue.length)

        for (const expectedItem of expectedCatalogue) {
          const dbItem = dbCatalogue.find(item => item.b_lu_catalogue === expectedItem.b_lu_catalogue)
          expect(dbItem).toBeDefined()
          expect(dbItem!.b_lu_source).toBe(expectedItem.b_lu_source)
          expect(dbItem!.b_lu_name).toBe(expectedItem.b_lu_name)
          expect(dbItem!.b_lu_name_en).toBe(expectedItem.b_lu_name_en)
          expect(dbItem!.b_lu_hcat3).toBe(expectedItem.b_lu_hcat3)
          expect(dbItem!.b_lu_hcat3_name).toBe(expectedItem.b_lu_hcat3_name)
        }

    })

    it('should throw error if catalogue name is not recognized', async () => {

        const catalogueName = 'invalid_catalogue_name'
        await expect(extendCultivationsCatalogue(fdm, catalogueName)).rejects.toThrowError(`catalogue ${catalogueName} is not recognized`)

    })

})

