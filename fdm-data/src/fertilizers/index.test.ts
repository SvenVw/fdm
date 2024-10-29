import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmLocal, migrateFdmLocal, type FdmType } from 'fdm-core'
import { extendFertilizersCatalogue } from '.'

describe('Fertilizers Data', () => {
    let fdm: FdmType

    beforeEach(async () => {
        fdm = await createFdmLocal('memory://')
        await migrateFdmLocal(fdm)
    })

    it('should throw error if dataset is not recognized', async () => {
        await expect(extendFertilizersCatalogue(fdm, 'not-existing-dataset')).rejects.toThrowError('catalogue not-existing-dataset is not recognized')
    })

    it('should extend fertilizers catalogue with srm dataset', async () => {
        await extendFertilizersCatalogue(fdm, 'srm')

        const result = await fdm.select().from(fdm.schema.fertilizersCatalogue)
        expect(result.length).toBeGreaterThan(0)
    })
})
