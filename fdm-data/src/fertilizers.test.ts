import { describe, expect, it, beforeEach } from 'vitest'
import { createFdmLocal, migrateFdmLocal, type FdmType } from 'fdm-core'
import { extendFertilizersCatalogue } from './fertilizers'

describe('Fertilizers Data', () => {
    let fdm: FdmType

    beforeEach(async () => {
        fdm = await createFdmLocal('memory://')
        await migrateFdmLocal(fdm)
    })

    it('should throw error if dataset is not recognized', async () => {
        await expect(extendFertilizersCatalogue(fdm, 'not-existing-dataset')).rejects.toThrowError('Dataset not-existing-dataset is not recognized')
    })

    it('should extend fertilizers catalogue with test dataset', async () => {
        await extendFertilizersCatalogue(fdm, 'test')

        const result = await fdm.select().from(fdm.schema.fertilizersCatalogue)
        expect(result.length).toBe(1)
        expect(result[0].p_name_nl).toBe('KAS')
        expect(result[0].p_description).toBe('A test product for KAS')
        expect(result[0].p_n_rt).toBe(27)
    })
})