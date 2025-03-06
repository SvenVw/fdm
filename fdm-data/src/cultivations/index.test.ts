import { describe, it, expect} from "vitest"
import { getCultivationCatalogue } from "./index"
import { getCatalogueBrp } from "./catalogues/brp"

describe("getCultivationCatalogue", () => {
    it("should return the BRP catalogue when catalogueName is 'brp'", () => {
        const expectedCatalogue = getCatalogueBrp()
        const actualCatalogue = getCultivationCatalogue("brp")
        expect(actualCatalogue).toEqual(expectedCatalogue)
    })

    it("should throw an error when an invalid catalogueName is provided", () => {
        expect(() => getCultivationCatalogue("invalid-catalogue")).toThrowError(
            "catalogue invalid-catalogue is not recognized",
        )
    })

    it("should return a non-empty array for 'brp' catalogue", () => {
        const catalogue = getCultivationCatalogue("brp")
        expect(Array.isArray(catalogue)).toBe(true)
        expect(catalogue.length).toBeGreaterThan(0)
    })

    it("should check if all items in the brp catalogue have the correct source", () => {
        const catalogue = getCultivationCatalogue("brp")
        for (const item of catalogue) {
            expect(item.b_lu_source).toBe("brp")
        }
    })

    it("should check if all items in the brp catalogue have the correct b_lu_harvestable values", () => {
        const catalogue = getCultivationCatalogue("brp")
        for (const item of catalogue) {
            expect(["once", "multiple", "none"]).toContain(
                item.b_lu_harvestable,
            )
        }
    })
})

describe("getCatalogueBrp", () => {
    it("should return an array of CatalogueCultivationItem", () => {
        const catalogue = getCatalogueBrp()
        expect(Array.isArray(catalogue)).toBe(true)
        for (const item of catalogue) {
            expect(typeof item).toBe("object")
            expect(item).toHaveProperty("b_lu_source")
            expect(item).toHaveProperty("b_lu_catalogue")
            expect(item).toHaveProperty("b_lu_name")
            expect(item).toHaveProperty("b_lu_name_en")
            expect(item).toHaveProperty("b_lu_harvestable")
            expect(item).toHaveProperty("b_lu_hcat3")
            expect(item).toHaveProperty("b_lu_hcat3_name")
        }
    })

    it("should return at least one item", () => {
        const catalogue = getCatalogueBrp()
        expect(catalogue.length).toBeGreaterThan(0)
    })
})
