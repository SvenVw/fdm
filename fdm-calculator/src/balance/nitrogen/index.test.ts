import { describe, expect, it } from "vitest"
import { calculateNitrogenBalance } from "."
import type { NitrogenBalanceInput } from "./types"

describe("calculateNitrogenBalance", () => {
    it("should calculate nitrogen balance correctly with mock input", async () => {
        const mockNitrogenBalanceInput: NitrogenBalanceInput = {
            fields: [
                {
                    field: {
                        b_id: "field1",
                        b_centroid: [5.0, 52.0],
                        b_area: 100,
                        b_start: new Date("2023-01-01"),
                        b_end: new Date("2023-12-31"),
                    },
                    cultivations: [
                        {
                            b_lu: "cultivation1",
                            b_lu_catalogue: "catalogue1",
                            m_cropresidue: true,
                            b_lu_start: new Date("2023-01-01"),
                            b_lu_end: new Date("2023-12-31"),
                        },
                    ],
                    harvests: [
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
                                        b_id_harvestable_analysis: "",
                                        b_lu_yield_fresh: null,
                                        b_lu_yield_bruto: null,
                                        b_lu_tarra: null,
                                        b_lu_dm: null,
                                        b_lu_moist: null,
                                        b_lu_uww: null,
                                        b_lu_cp: null,
                                        b_lu_n_residue: null,
                                        b_lu_p_harvestable: null,
                                        b_lu_p_residue: null,
                                        b_lu_k_harvestable: null,
                                        b_lu_k_residue: null,
                                    },
                                ],
                            },
                        },
                    ],
                    soilAnalyses: [
                        {
                            a_id: "soil1",
                            b_sampling_date: new Date(),
                            a_c_of: 20,
                            a_cn_fr: 10,
                            a_density_sa: 1.2,
                            a_n_rt: 3000,
                            a_som_loi: 2,
                            b_soiltype_agr: "dekzand",
                            b_gwl_class: "II",
                        },
                    ],
                    fertilizerApplications: [
                        {
                            p_id_catalogue: "fertilizer1",
                            p_app_amount: 100,
                            p_app_id: "fertilizerApp1",
                            p_id: "",
                            p_name_nl: null,
                            p_app_method: null,
                            p_app_date: new Date("2025-03-15"),
                        },
                    ],
                },
            ],
            fertilizerDetails: [
                {
                    p_id: "fertilizer1",
                    p_n_rt: 10,
                    p_type: "mineral",
                    p_no3_rt: 2,
                    p_nh4_rt: 8,
                    p_s_rt: 20,
                    p_ef_nh3: null,
                },
            ],
            cultivationDetails: [
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
            timeFrame: {
                start: new Date("2023-01-01"),
                end: new Date("2023-12-31"),
            },
        }

        const result = await calculateNitrogenBalance(mockNitrogenBalanceInput)

        function assertValidFertilizerBreakdown(
            obj: { total: number } & Record<
                "mineral" | "manure" | "compost" | "other",
                number
            >,
        ) {
            expect(typeof obj.total).toBe("number")
            expect(typeof obj.mineral).toBe("number")
            expect(typeof obj.manure).toBe("number")
            expect(typeof obj.compost).toBe("number")
            expect(typeof obj.other).toBe("number")
        }
        expect(result).toBeDefined()
        expect(typeof result.balance).toBe("number")

        expect(result.supply).toBeDefined()
        expect(typeof result.supply.total).toBe("number")
        expect(typeof result.supply.deposition).toBe("number")
        expect(typeof result.supply.fixation).toBe("number")
        expect(typeof result.supply.mineralisation).toBe("number")
        expect(result.supply.fertilizers).toBeDefined()
        assertValidFertilizerBreakdown(result.supply.fertilizers)
        expect(typeof result.emission.total).toBe("number")
        expect(result.emission.ammonia).toBeDefined()
        expect(typeof result.emission.ammonia.total).toBe("number")
        expect(result.emission.ammonia.fertilizers).toBeDefined()
        assertValidFertilizerBreakdown(result.emission.ammonia.fertilizers)
        expect(typeof result.emission.ammonia.residues).toBe("number")
        expect(typeof result.emission.nitrate).toBe("number")
        expect(typeof result.target).toBe("number")
        expect(Array.isArray(result.fields)).toBe(true)
    })

    it("should handle errors from sub-calculations", async () => {
        const mockNitrogenBalanceInput: NitrogenBalanceInput = {
            fields: [
                {
                    field: {
                        b_id: "field1",
                        b_centroid: [5.0, 52.0],
                        b_area: 100,
                        b_start: new Date("2023-01-01"),
                        b_end: new Date("2023-12-31"),
                    },
                    cultivations: [],
                    harvests: [],
                    soilAnalyses: [],
                    fertilizerApplications: [],
                },
            ],
            fertilizerDetails: [],
            cultivationDetails: [],
            timeFrame: {
                start: new Date("2023-01-01"),
                end: new Date("2023-12-31"),
            },
        }

        const result = await calculateNitrogenBalance(mockNitrogenBalanceInput)

        expect(result.hasErrors).toBe(true)
        expect(result.fieldErrorMessages.length).toBeGreaterThan(0)
    })
})
