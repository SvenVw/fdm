import { describe, expect, it } from "vitest"
import { Decimal } from "decimal.js"
import type { FieldInput } from "../types"
import { calculateNitrogenRemovalByResidue } from "./residue"

describe("calculateNitrogenRemovalByResidue", () => {
    const cultivationDetailsMap = new Map([
        [
            "catalogue1",
            {
                b_lu_catalogue: "catalogue1",
                b_lu_croprotation: "cereal",
                b_lu_yield: 1000,
                b_lu_n_harvestable: 20,
                b_lu_hi: 0.4,
                b_lu_n_residue: 2,
                b_n_fixation: 0,
            },
        ],
    ])

    it("should return 0 if no crop residues are left", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: false, // No residue left
            },
        ]
        const harvests: FieldInput["harvests"] = []

        const result = calculateNitrogenRemovalByResidue(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result).toEqual({
            total: new Decimal(0),
            cultivations: [{ id: "cultivation1", value: new Decimal(0) }],
        })
    })

    it("should calculate nitrogen removal for a single harvest", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: true,
            },
        ]
        const harvests: FieldInput["harvests"] = [
            {
                b_id_harvesting: "harvest1",
                b_lu: "cultivation1",
                b_lu_harvest_date: new Date(),
                harvestable: {
                    b_id_harvestable: "harvestable1",
                    harvestable_analyses: [
                        {
                            b_lu_yield: 1000,
                            b_lu_n_harvestable: 20,
                        },
                    ],
                },
            },
        ]

        const result = calculateNitrogenRemovalByResidue(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
        expect(result.cultivations[0].value.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
    })

    it("should calculate nitrogen removal for multiple harvests, averaging yields", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: true,
            },
        ]
        const harvests: FieldInput["harvests"] = [
            {
                b_id_harvesting: "harvest1",
                b_lu: "cultivation1",
                b_lu_harvest_date: new Date(),
                harvestable: {
                    b_id_harvestable: "harvestable1",
                    harvestable_analyses: [
                        { b_lu_yield: 1000, b_lu_n_harvestable: 20 },
                        { b_lu_yield: 1200, b_lu_n_harvestable: 22 },
                    ],
                },
            },
        ]

        const result = calculateNitrogenRemovalByResidue(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
        expect(result.cultivations[0].value.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
    })

    it("should handle missing harvest data using cultivation defaults", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: true,
            },
        ]
        const harvests: FieldInput["harvests"] = [] // No harvest data

        const result = calculateNitrogenRemovalByResidue(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )
        
        expect(result.total.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
        expect(result.cultivations[0].value.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
    })

    it("should handle missing cultivation details and throw an error", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: true,
            },
        ]
        const harvests: FieldInput["harvests"] = []
        const cultivationDetailsMap = new Map() // Missing details

        expect(() =>
            calculateNitrogenRemovalByResidue(
                cultivations,
                harvests,
                cultivationDetailsMap,
            ),
        ).toThrowError(
            "Cultivation cultivation1 has no corresponding cultivation in cultivationDetails",
        )
    })

    it("should handle undefined m_cropresidue as false", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: undefined, // Undefined residue handling
            },
        ]
        const harvests: FieldInput["harvests"] = []

        const result = calculateNitrogenRemovalByResidue(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result).toEqual({
            total: new Decimal(0),
            cultivations: [{ id: "cultivation1", value: new Decimal(0) }],
        })
    })

    it("should handle empty harvestable_analyses array", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                // b_lu_start: new Date(),
                m_cropresidue: true,
            },
        ]
        const harvests: FieldInput["harvests"] = [
            {
                b_id_harvesting: "harvest1",
                b_lu: "cultivation1",
                b_lu_harvest_date: new Date(),
                harvestable: {
                    b_id_harvestable: "harvestable1",
                    harvestable_analyses: [], // Empty array
                },
            },
        ]

        const result = calculateNitrogenRemovalByResidue(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
        expect(result.cultivations[0].value.toNumber()).toBeCloseTo(-1.2) //Approximation due to floating point
    })
})
