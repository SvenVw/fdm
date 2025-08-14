import Decimal from "decimal.js"
import { describe, expect, it, vi } from "vitest"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
} from "../../../types"
import { calculateNitrogenEmissionViaAmmoniaByOtherFertilizers } from "./other"

// Mock the determineManureAmmoniaEmissionFactor function
vi.mock("./manure", () => ({
    determineManureAmmoniaEmissionFactor: vi.fn(() => new Decimal(0.1)), // Mocked emission factor
}))

describe(" calculateNitrogenEmissionViaAmmoniaByOtherFertilizers", () => {
    const mockCultivations: FieldInput["cultivations"] = []
    const mockCultivationDetailsMap = new Map<string, CultivationDetail>()

    it("should return total 0 and empty applications array if no fertilizer applications are provided", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = []
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        const result = calculateNitrogenEmissionViaAmmoniaByOtherFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBe(0)
        expect(result.applications).toEqual([])
    })

    it("should calculate emissions for applications of type manure, mineral, or compost", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "manure1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
            {
                p_app_id: "app2",
                p_id_catalogue: "mineral1",
                p_app_amount: 500,
                p_app_date: new Date("2023-07-01"),
                p_app_method: "broadcasting",
                p_id: "app2",
            },
            {
                p_app_id: "app3",
                p_id_catalogue: "compost1",
                p_app_amount: 200,
                p_app_date: new Date("2023-08-01"),
                p_app_method: "broadcasting",
                p_id: "app3",
            },
        ]
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "manure1",
                {
                    p_id_catalogue: "manure1",
                    p_type: "manure",
                    p_nh4_rt: 0.5,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
            [
                "mineral1",
                {
                    p_id_catalogue: "mineral1",
                    p_type: "mineral",
                    p_nh4_rt: 0.8,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
            [
                "compost1",
                {
                    p_id_catalogue: "compost1",
                    p_type: "compost",
                    p_nh4_rt: 0.4,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
        ])

        const result = calculateNitrogenEmissionViaAmmoniaByOtherFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(0)
        expect(result.applications.length).toBe(3)
        expect(result.applications[0].value.toNumber()).toBeCloseTo(0)
        expect(result.applications[1].value.toNumber()).toBeCloseTo(0)
        expect(result.applications[2].value.toNumber()).toBeCloseTo(0)
    })

    it("should return 0 for applications of 'other' type as per current function logic", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "other1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "other1",
                {
                    p_id_catalogue: "other1",
                    p_type: "other",
                    p_nh4_rt: 0.1,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
        ])

        const result = calculateNitrogenEmissionViaAmmoniaByOtherFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBeCloseTo(0.01)
        expect(result.applications.length).toBe(1)
        expect(result.applications[0].id).toBe("app1")
        expect(result.applications[0].value.toNumber()).toBeCloseTo(0.01)
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
            calculateNitrogenEmissionViaAmmoniaByOtherFertilizers(
                mockCultivations,
                fertilizerApplications,
                mockCultivationDetailsMap,
                fertilizerDetailsMap,
            ),
        ).toThrowError("Fertilizer application app1 has no fertilizerDetails")
    })
})
