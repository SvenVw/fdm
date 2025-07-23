import { describe, it, expect } from "vitest"
import { aggregateNormsToFarmLevel } from "./farm"
import type { GebruiksnormResult } from "./nl/2025/types"

describe("aggregateNormsToFarmLevel", () => {
    it("should correctly aggregate norms from multiple fields", () => {
        const fieldData = [
            {
                b_id: "field1",
                b_area: 10,
                norms: {
                    manure: { normValue: 100, normSource: "Source A" } as GebruiksnormResult,
                    nitrogen: { normValue: 150, normSource: "Source B" } as GebruiksnormResult,
                    phosphate: { normValue: 50, normSource: "Source C" } as GebruiksnormResult,
                },
            },
            {
                b_id: "field2",
                b_area: 5,
                norms: {
                    manure: { normValue: 90, normSource: "Source A" } as GebruiksnormResult,
                    nitrogen: { normValue: 140, normSource: "Source B" } as GebruiksnormResult,
                    phosphate: { normValue: 45, normSource: "Source C" } as GebruiksnormResult,
                },
            },
        ]

        const result = aggregateNormsToFarmLevel(fieldData)

        expect(result.manure).toBe(1450)
        expect(result.nitrogen).toBe(2200)
        expect(result.phosphate).toBe(725)
    })

    it("should handle an empty array of fields", () => {
        const result = aggregateNormsToFarmLevel([])
        expect(result.manure).toBe(0)
        expect(result.nitrogen).toBe(0)
        expect(result.phosphate).toBe(0)
    })

    it("should handle fields with zero area", () => {
        const fieldData = [
            {
                b_id: "field1",
                b_area: 0,
                norms: {
                    manure: { normValue: 100, normSource: "Source A" } as GebruiksnormResult,
                    nitrogen: { normValue: 150, normSource: "Source B" } as GebruiksnormResult,
                    phosphate: { normValue: 50, normSource: "Source C" } as GebruiksnormResult,
                },
            },
        ]

        const result = aggregateNormsToFarmLevel(fieldData)

        expect(result.manure).toBe(0)
        expect(result.nitrogen).toBe(0)
        expect(result.phosphate).toBe(0)
    })

    it("should handle fields with zero norm values", () => {
        const fieldData = [
            {
                b_id: "field1",
                b_area: 10,
                norms: {
                    manure: { normValue: 0, normSource: "Source A" } as GebruiksnormResult,
                    nitrogen: { normValue: 0, normSource: "Source B" } as GebruiksnormResult,
                    phosphate: { normValue: 0, normSource: "Source C" } as GebruiksnormResult,
                },
            },
        ]

        const result = aggregateNormsToFarmLevel(fieldData)

        expect(result.manure).toBe(0)
        expect(result.nitrogen).toBe(0)
        expect(result.phosphate).toBe(0)
    })

    it("should handle floating point numbers for area and norm values", () => {
        const fieldData = [
            {
                b_id: "field1",
                b_area: 10.5,
                norms: {
                    manure: { normValue: 100.5, normSource: "Source A" } as GebruiksnormResult,
                    nitrogen: { normValue: 150.5, normSource: "Source B" } as GebruiksnormResult,
                    phosphate: { normValue: 50.5, normSource: "Source C" } as GebruiksnormResult,
                },
            },
        ]

        const result = aggregateNormsToFarmLevel(fieldData)

        expect(result.manure).toBe(1055) // 10.5 * 100.5 = 1055.25
        expect(result.nitrogen).toBe(1580) // 10.5 * 150.5 = 1580.25
        expect(result.phosphate).toBe(530) // 10.5 * 50.5 = 530.25
    })
})
