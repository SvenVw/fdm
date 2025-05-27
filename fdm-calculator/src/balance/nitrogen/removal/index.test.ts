import { describe, expect, it } from "vitest"
import { calculateNitrogenRemoval } from "."
import type { FieldInput, NitrogenRemoval } from "../types"

describe("calculateNitrogenRemoval", () => {
    it("should calculate total nitrogen removal from harvests and residues", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
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
                    ],
                },
            },
        ]
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

        const result: NitrogenRemoval = calculateNitrogenRemoval(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(-21.2) // -20 from harvest + -1.2 from residue
        expect(result.harvests.total.toNumber()).toBeCloseTo(-20)
        expect(result.residues.total.toNumber()).toBeCloseTo(-1.2)
    })

    it("should handle cases with no harvests or residues", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "catalogue1",
                m_cropresidue: false,
            },
        ]
        const harvests: FieldInput["harvests"] = []
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

        const result: NitrogenRemoval = calculateNitrogenRemoval(
            cultivations,
            harvests,
            cultivationDetailsMap,
        )

        expect(result.total.toNumber()).toBe(0)
        expect(result.harvests.total.toNumber()).toBe(0)
        expect(result.residues.total.toNumber()).toBe(0)
    })
})
