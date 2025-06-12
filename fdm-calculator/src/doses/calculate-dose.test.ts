import { describe, expect, it } from "vitest"
import { calculateDose } from "./calculate-dose"
import type { Fertilizer, FertilizerApplication } from "@svenvw/fdm-core"

const initialDose = {
    p_dose_n: 0,
    p_dose_nw: 0,
    p_dose_p: 0,
    p_dose_k: 0,
    p_dose_eoc: 0,
    p_dose_s: 0,
    p_dose_mg: 0,
    p_dose_ca: 0,
    p_dose_na: 0,
    p_dose_cu: 0,
    p_dose_zn: 0,
    p_dose_co: 0,
    p_dose_mn: 0,
    p_dose_mo: 0,
    p_dose_b: 0,
}

describe("calculateDose", () => {
    it("should calculate all nutrient doses correctly", () => {
        const applications: FertilizerApplication[] = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
            { p_app_id: "app2", p_id: "fert2", p_app_amount: 50 },
        ]

        const fertilizers: Fertilizer[] = [
            {
                p_id: "fert1",
                p_n_rt: 100,
                p_p_rt: 50,
                p_k_rt: 30,
                p_n_wc: 0.5,
                p_eoc: 10,
                p_s_rt: 20,
                p_mg_rt: 15,
                p_ca_rt: 25,
                p_na_rt: 5,
                p_cu_rt: 2,
                p_zn_rt: 3,
                p_co_rt: 1,
                p_mn_rt: 4,
                p_mo_rt: 0.5,
                p_b_rt: 1.5,
            },
            {
                p_id: "fert2",
                p_n_rt: 200,
                p_p_rt: 0,
                p_k_rt: 60,
                p_n_wc: 1.0,
                p_eoc: 5,
                p_s_rt: 10,
                p_mg_rt: 5,
                p_ca_rt: 15,
                p_na_rt: 2,
                p_cu_rt: 1,
                p_zn_rt: 2,
                p_co_rt: 0.5,
                p_mn_rt: 2,
                p_mo_rt: 0.2,
                p_b_rt: 0.5,
            },
        ]

        const result = calculateDose({ applications, fertilizers })

        expect(result.dose.p_dose_n).toBeCloseTo(20)
        expect(result.dose.p_dose_nw).toBeCloseTo(15)
        expect(result.dose.p_dose_p).toBeCloseTo(5)
        expect(result.dose.p_dose_k).toBeCloseTo(6)
        expect(result.dose.p_dose_eoc).toBeCloseTo(1.25)
        expect(result.dose.p_dose_s).toBeCloseTo(2.5)
        expect(result.dose.p_dose_mg).toBeCloseTo(1.75)
        expect(result.dose.p_dose_ca).toBeCloseTo(3.25)
        expect(result.dose.p_dose_na).toBeCloseTo(0.000006)
        expect(result.dose.p_dose_cu).toBeCloseTo(0.00025)
        expect(result.dose.p_dose_zn).toBeCloseTo(0.0004)
        expect(result.dose.p_dose_co).toBeCloseTo(0.000125)
        expect(result.dose.p_dose_mn).toBeCloseTo(0.0005)
        expect(result.dose.p_dose_mo).toBeCloseTo(0.00006)
        expect(result.dose.p_dose_b).toBeCloseTo(0.000175)

        expect(result.applications).toHaveLength(2)
        expect(result.applications[0].p_dose_n).toBeCloseTo(10)
        expect(result.applications[1].p_dose_n).toBeCloseTo(10)
    })

    it("should handle zero application amounts correctly", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 0 },
        ]
        const fertilizers = [
            { p_id: "fert1", p_n_rt: 100, p_p_rt: 50, p_k_rt: 30, p_n_wc: 0.5 },
        ]
        const { dose } = calculateDose({ applications, fertilizers })
        expect(dose).toEqual(initialDose)
    })

    it("should handle zero nutrient rates correctly", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
        ]
        const fertilizers = [{ p_id: "fert1" }]
        const { dose } = calculateDose({ applications, fertilizers })
        expect(dose).toEqual(initialDose)
    })

    it("should throw an error for negative application amounts", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: -100 },
        ]
        const fertilizers = [{ p_id: "fert1" }]
        expect(() => calculateDose({ applications, fertilizers })).toThrow(
            "Application amounts must be non-negative",
        )
    })

    it("should throw an error for negative nutrient rates", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
        ]
        const fertilizers = [{ p_id: "fert1", p_n_rt: -100 }]
        expect(() => calculateDose({ applications, fertilizers })).toThrow(
            "Nutrient rates must be non-negative",
        )
    })

    it("should handle missing fertilizers by returning zero doses", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert_missing", p_app_amount: 100 },
        ]
        const fertilizers = [{ p_id: "fert1" }]
        const { dose, applications: appDoses } = calculateDose({
            applications,
            fertilizers,
        })
        expect(dose).toEqual(initialDose)
        expect(appDoses[0]).toEqual({ ...initialDose, p_app_id: "app1" })
    })

    it("should handle empty applications array", () => {
        const { dose, applications } = calculateDose({
            applications: [],
            fertilizers: [{ p_id: "fert1" }],
        })
        expect(dose).toEqual(initialDose)
        expect(applications).toHaveLength(0)
    })

    it("should handle empty fertilizers array", () => {
        const applications = [
            { p_app_id: "app1", p_id: "fert1", p_app_amount: 100 },
        ]
        const { dose, applications: appDoses } = calculateDose({
            applications,
            fertilizers: [],
        })
        expect(dose).toEqual(initialDose)
        expect(appDoses[0]).toEqual({ ...initialDose, p_app_id: "app1" })
    })
})
