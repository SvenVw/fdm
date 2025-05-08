import { describe, expect, it } from "vitest"
import { Decimal } from "decimal.js"
import { calculateNitrogenSupplyBySoilMineralization } from "./mineralization"
import type { CultivationDetail, FieldInput } from "../types"

describe("calculateNitrogenSupplyBySoilMineralization", () => {
    it("should return 0 if no cultivations are provided", () => {
        const cultivations: FieldInput["cultivations"] = []
        const soilAnalyses: FieldInput["soilAnalyses"] = []
        const cultivationDetailsMap = new Map<string, CultivationDetail>()

        const result = calculateNitrogenSupplyBySoilMineralization(
            cultivations,
            soilAnalyses,
            cultivationDetailsMap,
        )

        expect(result.total.equals(new Decimal(0))).toBe(true)
        expect(result.cultivations).toEqual([])
    })

    it("should calculate mineralization for grassland", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "grassland1",
                b_lu_catalogue: "grasslandCatalogue",
                m_cropresidue: true,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = [
            {
                a_id: "soil1",
                b_soiltype_agr: "veen",
                a_n_rt: 20000,
                a_c_of: 10,
                a_cn_fr: 14,
                a_density_sa: 1.2,
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "grasslandCatalogue",
                {
                    b_lu_catalogue: "grasslandCatalogue",
                    b_lu_croprotation: "grassland",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        const result = calculateNitrogenSupplyBySoilMineralization(
            cultivations,
            soilAnalyses,
            cultivationDetailsMap,
        )

        expect(result.total.equals(new Decimal(250))).toBe(true)
        expect(result.cultivations).toEqual([
            { id: "grassland1", value: new Decimal(250) },
        ])
    })

    it("should calculate mineralization for arable land", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "arable1",
                b_lu_catalogue: "arableCatalogue",
                m_cropresidue: true,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = [
            {
                a_id: "soil1",
                b_soiltype_agr: "arable",
                a_n_rt: 20000,
                a_c_of: 10,
                a_cn_fr: 14,
                a_density_sa: 1.2,
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "arableCatalogue",
                {
                    b_lu_catalogue: "arableCatalogue",
                    b_lu_croprotation: "cereal",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        const result = calculateNitrogenSupplyBySoilMineralization(
            cultivations,
            soilAnalyses,
            cultivationDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(250, -1)
        expect(result.cultivations).toEqual([
            { id: "arable1", value: expect.any(Decimal) },
        ])
    })

    it("should handle missing soil analysis data and throw an error for grassland", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "grassland1",
                b_lu_catalogue: "grasslandCatalogue",
                m_cropresidue: false,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = []
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "grasslandCatalogue",
                {
                    b_lu_catalogue: "grasslandCatalogue",
                    b_lu_croprotation: "grassland",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        expect(() =>
            calculateNitrogenSupplyBySoilMineralization(
                cultivations,
                soilAnalyses,
                cultivationDetailsMap,
            ),
        ).toThrowError("No a_n_rt value found in soil analysis for grassland")
    })

    it("should handle missing soil analysis data and throw an error for arable land", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "arable1",
                b_lu_catalogue: "arableCatalogue",
                m_cropresidue: true,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = []
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "arableCatalogue",
                {
                    b_lu_catalogue: "arableCatalogue",
                    b_lu_croprotation: "cereal",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        expect(() =>
            calculateNitrogenSupplyBySoilMineralization(
                cultivations,
                soilAnalyses,
                cultivationDetailsMap,
            ),
        ).toThrowError("No a_c_of value found in soil analysis for arable")
    })

    it("should handle unknown soil type and throw an error for grassland", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "grassland1",
                b_lu_catalogue: "grasslandCatalogue",
                m_cropresidue: false,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = [
            {
                a_id: "soil1",
                b_soiltype_agr: "unknownType",
                a_n_rt: 20000,
                a_c_of: 10,
                a_cn_fr: 14,
                a_density_sa: 1.2,
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "grasslandCatalogue",
                {
                    b_lu_catalogue: "grasslandCatalogue",
                    b_lu_croprotation: "grassland",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        expect(() =>
            calculateNitrogenSupplyBySoilMineralization(
                cultivations,
                soilAnalyses,
                cultivationDetailsMap,
            ),
        ).toThrowError("Unknown soil type: unknownType")
    })

    it("should handle missing cultivation details and throw an error", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cultivation1",
                b_lu_catalogue: "missingCatalogue",
                m_cropresidue: false,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = [
            {
                a_id: "soil1",
                b_soiltype_agr: "veen",
                a_n_rt: 20000,
                a_c_of: 10,
                a_cn_fr: 14,
                a_density_sa: 1.2,
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>()

        expect(() =>
            calculateNitrogenSupplyBySoilMineralization(
                cultivations,
                soilAnalyses,
                cultivationDetailsMap,
            ),
        ).toThrowError(
            "Cultivation cultivation1 has no corresponding cultivation in cultivationDetails",
        )
    })

    it("should limit mineralization to min/max values", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "grassland1",
                b_lu_catalogue: "grasslandCatalogue",
                m_cropresidue: true,
            },
        ]
        const soilAnalyses: FieldInput["soilAnalyses"] = [
            {
                a_id: "soil1",
                b_soiltype_agr: "rivierklei",
                a_n_rt: 200000,
                a_c_of: 10,
                a_cn_fr: 14,
                a_density_sa: 1.2,
            }, //High value to exceed max
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "grasslandCatalogue",
                {
                    b_lu_catalogue: "grasslandCatalogue",
                    b_lu_croprotation: "grassland",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        const result = calculateNitrogenSupplyBySoilMineralization(
            cultivations,
            soilAnalyses,
            cultivationDetailsMap,
        )

        expect(result.total.equals(new Decimal(250))).toBe(true)

        const cultivations2: FieldInput["cultivations"] = [
            {
                b_lu: "arable1",
                b_lu_catalogue: "arableCatalogue",
                m_cropresidue: true,
            },
        ]
        const soilAnalyses2: FieldInput["soilAnalyses"] = [
            {
                b_soiltype_agr: "rivierklei",
                a_c_of: 0.1,
                a_cn_fr: 30,
                a_density_sa: 1.2,
                a_id: "soil2",
                a_n_rt: 1,
            }, //Low value to check min
        ]
        const cultivationDetailsMap2 = new Map<string, CultivationDetail>([
            [
                "arableCatalogue",
                {
                    b_lu_catalogue: "arableCatalogue",
                    b_lu_croprotation: "cereal",
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

        const result2 = calculateNitrogenSupplyBySoilMineralization(
            cultivations2,
            soilAnalyses2,
            cultivationDetailsMap2,
        )

        expect(result2.total.equals(new Decimal(5))).toBe(true)
    })
})
