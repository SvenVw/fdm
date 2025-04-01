import { describe, expect, it } from "vitest"
import type { CatalogueCultivationItem } from "./d"
import { hashCultivation } from "./hash"

describe("hashCultivation", () => {
    it("should generate a hash for a cultivation item", async () => {
        const cultivation: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id",
            b_lu_name: "Test Cultivation",
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const hash = await hashCultivation(cultivation)
        expect(hash).toBeDefined()
        expect(typeof hash).toBe("string")
        expect(hash.length).toBeGreaterThan(0)
        expect(hash).toBe("9e15c11b")
    })

    it("should generate different hashes for different cultivation items", async () => {
        const cultivation1: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-1",
            b_lu_name: "Test Cultivation 1",
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const cultivation2: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-2",
            b_lu_name: "Test Cultivation 2", // Different name
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const hash1 = await hashCultivation(cultivation1)
        const hash2 = await hashCultivation(cultivation2)

        expect(hash1).not.toBe(hash2)
    })

    it("should generate the same hash for identical cultivation items", async () => {
        const cultivation1: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-1",
            b_lu_name: "Test Cultivation 1",
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const cultivation2: CatalogueCultivationItem = {
            ...cultivation1,
        }

        const hash1 = await hashCultivation(cultivation1)
        const hash2 = await hashCultivation(cultivation2)

        expect(hash1).toBe(hash2)
    })

    it("should generate different hashes when a string value changes", async () => {
        const cultivation1: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-1",
            b_lu_name: "Test Cultivation 1",
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const cultivation2: CatalogueCultivationItem = {
            ...cultivation1,
            b_lu_name: "Updated Test Cultivation Name",
        }

        const hash1 = await hashCultivation(cultivation1)
        const hash2 = await hashCultivation(cultivation2)

        expect(hash1).not.toBe(hash2)
    })
    it("should generate different hashes when a null string value is changed", async () => {
        const cultivation1: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-1",
            b_lu_name: "Test Cultivation 1",
            b_lu_name_en: null,
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const cultivation2: CatalogueCultivationItem = {
            ...cultivation1,
            b_lu_name_en: "Test Cultivation (EN)",
        }

        const hash1 = await hashCultivation(cultivation1)
        const hash2 = await hashCultivation(cultivation2)

        expect(hash1).not.toBe(hash2)
    })

    it("should generate different hashes when a non null string value is changed", async () => {
        const cultivation1: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-1",
            b_lu_name: "Test Cultivation 1",
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const cultivation2: CatalogueCultivationItem = {
            ...cultivation1,
            b_lu_hcat3: null,
        }

        const hash1 = await hashCultivation(cultivation1)
        const hash2 = await hashCultivation(cultivation2)

        expect(hash1).not.toBe(hash2)
    })

    it("should generate different hashes when a enum value changes", async () => {
        const cultivation1: CatalogueCultivationItem = {
            b_lu_source: "brp",
            b_lu_catalogue: "test-id-1",
            b_lu_name: "Test Cultivation 1",
            b_lu_name_en: "Test Cultivation (EN)",
            b_lu_harvestable: "once",
            b_lu_hcat3: "hcat3",
            b_lu_hcat3_name: "hcat3 name",
            hash: null,
        }

        const cultivation2: CatalogueCultivationItem = {
            ...cultivation1,
            b_lu_harvestable: "multiple",
        }

        const hash1 = await hashCultivation(cultivation1)
        const hash2 = await hashCultivation(cultivation2)

        expect(hash1).not.toBe(hash2)
    })
})
