import { describe, expect, it } from "vitest"
import type { FertilizerDetail, FieldInput } from "../../../types"
import {
    calculateNitrogenEmissionViaAmmoniaByMineralFertilizers,
    determineMineralAmmoniaEmissionFactor,
} from "./mineral"

describe("calculateNitrogenEmissionViaAmmoniaByMineralFertilizers", () => {
    it("should return total 0 and empty applications array if no fertilizer applications are provided", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = []
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        const result = calculateNitrogenEmissionViaAmmoniaByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBe(0)
        expect(result.applications).toEqual([])
    })

    it("should calculate ammonia emissions for mineral applications with p_ef_nh3", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "mineral1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "mineral1",
                {
                    p_id_catalogue: "mineral1",
                    p_type: "mineral",
                    p_n_rt: 0.8,
                    p_ef_nh3: 0.1,
                    p_nh4_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                },
            ],
        ])

        const result = calculateNitrogenEmissionViaAmmoniaByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        // Expected value: 1000 * 0.8 * 0.1 / 1000 = 0.08 kg N
        expect(result.total.toNumber()).toBeCloseTo(-0.08)
        expect(result.applications.length).toBe(1)
        expect(result.applications[0].id).toBe("app1")
        expect(result.applications[0].value.toNumber()).toBeCloseTo(-0.08)
    })

    it("should calculate ammonia emissions for mineral applications without p_ef_nh3 (using determineMineralAmmoniaEmmissionFactor)", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "mineral2",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "mineral2",
                {
                    p_id_catalogue: "mineral2",
                    p_type: "mineral",
                    p_n_rt: 0.8,
                    p_no3_rt: 0.2,
                    p_nh4_rt: 0.3,
                    p_s_rt: 0.1,
                    p_ef_nh3: null, // No predefined emission factor
                },
            ],
        ])

        const result = calculateNitrogenEmissionViaAmmoniaByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        // Expected emission factor from determineMineralAmmoniaEmmissionFactor:
        // p_n_org = 0.8 - 0.2 - 0.3 = 0.3
        // a = 0.3^2 * 7.021e-5 = 0.09 * 7.021e-5 = 6.3189e-6
        // b = 0.2 * 0.1 * -4.308e-5 = -8.616e-7
        // c = 0.3^2 * 2.498e-4 = 0.09 * 2.498e-4 = 2.2482e-5
        // EF = 6.3189e-6 - 8.616e-7 + 2.2482e-5 = 2.79393e-5
        // Application value: 1000 * 0.8 * 2.79393e-5 / 1000 = 2.235144e-5 kg N

        expect(result.total.toNumber()).toBeCloseTo(-2.235144e-5)
        expect(result.applications.length).toBe(1)
        expect(result.applications[0].id).toBe("app1")
        expect(result.applications[0].value.toNumber()).toBeCloseTo(-2.235144e-5)
    })

    it("should return 0 for applications that are not mineral type", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "compost1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "compost1",
                {
                    p_id_catalogue: "compost1",
                    p_type: "compost",
                    p_nh4_rt: 0.5,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
        ])

        const result = calculateNitrogenEmissionViaAmmoniaByMineralFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBe(0)
        expect(result.applications.length).toBe(1)
        expect(result.applications[0].id).toBe("app1")
        expect(result.applications[0].value.toNumber()).toBe(0)
    })

    it("should throw an error if fertilizerDetail is missing for an application", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "nonExistent",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        expect(() =>
            calculateNitrogenEmissionViaAmmoniaByMineralFertilizers(
                fertilizerApplications,
                fertilizerDetailsMap,
            ),
        ).toThrowError("Fertilizer application app1 has no fertilizerDetails")
    })
})

describe("determineMineralAmmoniaEmmissionFactor", () => {
    it("should calculate emission factor correctly with p_inhibitor = false", () => {
        const fertilizerDetail: FertilizerDetail = {
            p_id_catalogue: "mineral1",
            p_type: "mineral",
            p_n_rt: 0.8,
            p_no3_rt: 0.2,
            p_nh4_rt: 0.3,
            p_s_rt: 0.1,
            p_ef_nh3: null,
        }

        const result = determineMineralAmmoniaEmissionFactor(fertilizerDetail)

        // p_n_org = 0.8 - 0.2 - 0.3 = 0.3
        // a = 0.3^2 * 7.021e-5 = 0.09 * 7.021e-5 = 6.3189e-6
        // b = 0.2 * 0.1 * -4.308e-5 = -8.616e-7
        // c = 0.3^2 * 2.498e-4 = 0.09 * 2.498e-4 = 2.2482e-5
        // EF = 6.3189e-6 - 8.616e-7 + 2.2482e-5 = 2.79393e-5

        expect(result.toNumber()).toBeCloseTo(2.79393e-5)
    })

    // The current implementation of determineMineralAmmoniaEmmissionFactor
    // hardcodes p_inhibitor to false. If this changes in the future,
    // a test case for p_inhibitor = true would be needed.
    // For now, we can test with default values.
    it("should calculate emission factor correctly with default (null/undefined) values for p_n_rt, p_no3_rt, p_nh4_rt, p_s_rt", () => {
        const fertilizerDetail: FertilizerDetail = {
            p_id_catalogue: "mineral1",
            p_type: "mineral",
            p_n_rt: null,
            p_no3_rt: null,
            p_nh4_rt: null,
            p_s_rt: null,
            p_ef_nh3: null,
        }

        const result = determineMineralAmmoniaEmissionFactor(fertilizerDetail)

        // All values default to 0, so p_n_org = 0, a = 0, b = 0, c = 0
        // EF = 0
        expect(result.toNumber()).toBe(0)
    })
})
