import { describe, expect, it } from "vitest"
import { calculateDose } from "./calculate-dose"

describe("calculateDose", () => {
    it("should calculate total and individual doses correctly for valid inputs", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
            { p_app_id: "app2", p_id: "fert2", p_app_amount: 50 },
        ]

        const fertilizers = [
            { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
            { p_id: "fert2", p_n_rt: 200, p_p_rt: 0, p_k_rt: 60, p_n_wc: 1.0 },
        ]

        const result = calculateDose({ applications, fertilizers })

        // Expected total dose calculations
        // app1: N=100*100/1000 = 10, NW=100*100/1000*0.5 = 5, P2O5=100*50/1000 = 5, K2O=100*30/1000 = 3
        // app2: N=50*200/1000 = 10, NW=50*200/1000*1.0 = 10, P2O5=50*0/1000 = 0, K2O=50*60/1000 = 3
        // Total: N=20, NW=15, P2O5=5, K2O=6

        expect(result.dose.p_dose_n).toBeCloseTo(20)
        expect(result.dose.p_dose_nw).toBeCloseTo(15)
        expect(result.dose.p_dose_p2o5).toBeCloseTo(5)
        expect(result.dose.p_dose_k2o).toBeCloseTo(6)

        // Expected individual application doses
        expect(result.applications).toHaveLength(2)
        expect(result.applications[0]).toEqual({
            p_app_id: "app1",
            p_dose_n: 10,
            p_dose_nw: 5,
            p_dose_p2o5: 5,
            p_dose_k2o: 3,
        })
        expect(result.applications[1]).toEqual({
            p_app_id: "app2",
            p_dose_n: 10,
            p_dose_nw: 10,
            p_dose_p2o5: 0,
            p_dose_k2o: 3,
        })
    })

    it("should handle zero application amounts correctly", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 0 },
        ]
        const fertilizers = [
            { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
        ]
        const result = calculateDose({ applications, fertilizers })
        expect(result.dose).toEqual({
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        })
    })

    it("should handle zero nutrient rates correctly", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
        ]
        const fertilizers = [
            { p_id: "fert1", p_n_rt: 0, p_p_rt: 0, p_k_rt: 0, p_n_wc: 0 },
        ]
        const result = calculateDose({ applications, fertilizers })
        expect(result.dose).toEqual({
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        })
    })

    it("should throw an error for negative application amounts", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: -100 },
        ]
        const fertilizers = [
            { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
        ]
        expect(() => calculateDose({ applications, fertilizers })).toThrow(
            "Application amounts must be non-negative",
        )
    })

    it("should throw an error for negative nutrient rates", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
        ]
        const fertilizers = [
            { p_id: "fert1", p_n_rt: -100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
        ]
        expect(() => calculateDose({ applications, fertilizers })).toThrow(
            "Nutrient rates must be non-negative",
        )
    })

    it("should handle missing fertilizers by returning zero doses for that application", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
            { p_app_id: "app2", p_id: "fert_missing", p_app_amount: 50 },
        ]
        const fertilizers = [
            { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
        ]
        const result = calculateDose({ applications, fertilizers })

        expect(result.dose.p_dose_n).toBeCloseTo(10)
        expect(result.dose.p_dose_nw).toBeCloseTo(5)
        expect(result.dose.p_dose_p2o5).toBeCloseTo(5)
        expect(result.dose.p_dose_k2o).toBeCloseTo(3)

        expect(result.applications).toHaveLength(2)
        expect(result.applications[0]).toEqual({
            p_app_id: "app1",
            p_dose_n: 10,
            p_dose_nw: 5,
            p_dose_p2o5: 5,
            p_dose_k2o: 3,
        })
        expect(result.applications[1]).toEqual({
            p_app_id: "app2",
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        })
    })

    it("should handle empty applications array", () => {
        const applications: Parameters<typeof calculateDose>[0]["applications"] = []
        const fertilizers = [
            { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
        ]
        const result = calculateDose({ applications, fertilizers })
        expect(result.dose).toEqual({
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        })
        expect(result.applications).toHaveLength(0)
    })

    it("should handle empty fertilizers array", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
        ]
        const fertilizers: Parameters<typeof calculateDose>[0]["fertilizers"] = []
        const result = calculateDose({ applications, fertilizers })
        expect(result.dose).toEqual({
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        })
        expect(result.applications).toHaveLength(1)
        expect(result.applications[0]).toEqual({
            p_app_id: "app1",
            p_dose_n: 0,
            p_dose_nw: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        })
    })
})
