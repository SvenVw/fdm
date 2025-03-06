import { describe, it, expect, vi } from "vitest"
import { getFertilizersCatalogue } from "./index"
import { getCatalogueSrm } from "./catalogues/srm"

describe("getFertilizersCatalogue", () => {
    it("should return the SRM catalogue when catalogueName is 'srm'", () => {
        const expectedCatalogue = getCatalogueSrm()
        const actualCatalogue = getFertilizersCatalogue("srm")
        expect(actualCatalogue).toEqual(expectedCatalogue)
    })

    it("should throw an error when an invalid catalogueName is provided", () => {
        expect(() =>
            getFertilizersCatalogue("invalid-catalogue"),
        ).toThrowError("catalogue invalid-catalogue is not recognized")
    })

    it("should return a non-empty array for 'srm' catalogue", () => {
        const catalogue = getFertilizersCatalogue("srm")
        expect(Array.isArray(catalogue)).toBe(true)
        expect(catalogue.length).toBeGreaterThan(0)
    })

    it("should check if all items in the srm catalogue have the correct source", () => {
        const catalogue = getFertilizersCatalogue("srm")
        for (const item of catalogue) {
            expect(item.p_source).toBe("srm")
        }
    })
})

describe("getCatalogueSrm", () => {
    it("should return an array of CatalogueFertilizerItem", () => {
        const catalogue = getCatalogueSrm()
        expect(Array.isArray(catalogue)).toBe(true)
        for (const item of catalogue) {
            expect(typeof item).toBe("object")
            expect(item).toHaveProperty("p_source")
            expect(item).toHaveProperty("p_id_catalogue")
            expect(item).toHaveProperty("p_name_nl")
            expect(item).toHaveProperty("p_name_en")
            expect(item).toHaveProperty("p_description")
            expect(item).toHaveProperty("p_dm")
            expect(item).toHaveProperty("p_density")
            expect(item).toHaveProperty("p_om")
            expect(item).toHaveProperty("p_a")
            expect(item).toHaveProperty("p_hc")
            expect(item).toHaveProperty("p_eom")
            expect(item).toHaveProperty("p_eoc")
            expect(item).toHaveProperty("p_c_rt")
            expect(item).toHaveProperty("p_c_of")
            expect(item).toHaveProperty("p_c_if")
            expect(item).toHaveProperty("p_c_fr")
            expect(item).toHaveProperty("p_cn_of")
            expect(item).toHaveProperty("p_n_rt")
            expect(item).toHaveProperty("p_n_if")
            expect(item).toHaveProperty("p_n_of")
            expect(item).toHaveProperty("p_n_wc")
            expect(item).toHaveProperty("p_p_rt")
            expect(item).toHaveProperty("p_k_rt")
            expect(item).toHaveProperty("p_mg_rt")
            expect(item).toHaveProperty("p_ca_rt")
            expect(item).toHaveProperty("p_ne")
            expect(item).toHaveProperty("p_s_rt")
            expect(item).toHaveProperty("p_s_wc")
            expect(item).toHaveProperty("p_cu_rt")
            expect(item).toHaveProperty("p_zn_rt")
            expect(item).toHaveProperty("p_na_rt")
            expect(item).toHaveProperty("p_si_rt")
            expect(item).toHaveProperty("p_b_rt")
            expect(item).toHaveProperty("p_mn_rt")
            expect(item).toHaveProperty("p_ni_rt")
            expect(item).toHaveProperty("p_fe_rt")
            expect(item).toHaveProperty("p_mo_rt")
            expect(item).toHaveProperty("p_co_rt")
            expect(item).toHaveProperty("p_as_rt")
            expect(item).toHaveProperty("p_cd_rt")
            expect(item).toHaveProperty("p_cr_rt")
            expect(item).toHaveProperty("p_cr_vi")
            expect(item).toHaveProperty("p_pb_rt")
            expect(item).toHaveProperty("p_hg_rt")
            expect(item).toHaveProperty("p_cl_cr")
            expect(item).toHaveProperty("p_type_manure")
            expect(item).toHaveProperty("p_type_mineral")
            expect(item).toHaveProperty("p_type_compost")
        }
    })

    it("should return at least one item", () => {
        const catalogue = getCatalogueSrm()
        expect(catalogue.length).toBeGreaterThan(0)
    })
    
    it('should handle undefined values in srm.json', () => {
        // Mock the srm.json data with some undefined values
        const originalSrm = require("./catalogues/srm.json")
        const modifiedSrm = JSON.parse(JSON.stringify(originalSrm));
        modifiedSrm[0].p_dm = undefined;
        modifiedSrm[0].p_density = undefined;
        modifiedSrm[0].p_type_manure = undefined;

        // Replace the srm.json import with a mocked version
        vi.mock("./catalogues/srm.json", () => ({ default: modifiedSrm }))

        // Re-import after mocking
        const { getCatalogueSrm } = require("./catalogues/srm")
        const catalogue = getCatalogueSrm();

        // Restore the original srm.json
        vi.unmock("./catalogues/srm.json")
        vi.doUnmock("./catalogues/srm")
        vi.mock("./catalogues/srm.json", () => ({ default: originalSrm }))
        
        expect(catalogue.length).toBeGreaterThan(0);

        // Check if the specific fields that were undefined are now null
        const item = catalogue[0];
        expect(item.p_dm).toBeNull();
        expect(item.p_density).toBeNull();
        expect(item.p_type_manure).toBeUndefined();
    });
})
