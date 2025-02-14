import type { getFertilizerType } from "@svenvw/fdm-core"
import { describe, expect, it } from "vitest"
import { calculateDose } from "./calculate-dose"
import type { Dose } from "./d"

describe("calculateDose", () => {
    it("should calculate the correct dose for a single application", () => {
        const applications = [{ p_id: "fertilizer1", p_app_amount: 100 }]
        const fertilizers = [
            { p_id: "fertilizer1", p_n_rt: 20, p_p_rt: 10, p_k_rt: 5 },
        ]

        const expectedDose: Dose = {
            p_dose_n: 2000,
            p_dose_p2o5: 1000,
            p_dose_k2o: 500,
        }
        expect(calculateDose({ applications, fertilizers })).toEqual(
            expectedDose,
        )
    })

    it("should calculate the correct dose for multiple applications", () => {
        const applications = [
            { p_id: "fertilizer1", p_app_amount: 100 },
            { p_id: "fertilizer2", p_app_amount: 50 },
        ]
        const fertilizers = [
            { p_id: "fertilizer1", p_n_rt: 20, p_p_rt: 10, p_k_rt: 5 },
            { p_id: "fertilizer2", p_n_rt: 10, p_p_rt: 5, p_k_rt: 2.5 },
        ]

        const expectedDose: Dose = {
            p_dose_n: 2500,
            p_dose_p2o5: 1250,
            p_dose_k2o: 625,
        }
        expect(calculateDose({ applications, fertilizers })).toEqual(
            expectedDose,
        )
    })

    it("should handle missing fertilizer data gracefully", () => {
        const applications = [{ p_id: "fertilizer1", p_app_amount: 100 }]
        const fertilizers: getFertilizerType[] = [] // No matching fertilizer

        const expectedDose: Dose = {
            p_dose_n: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        }
        expect(calculateDose({ applications, fertilizers })).toEqual(
            expectedDose,
        )
    })

    it("should handle undefined nutrient values in fertilizer as 0", () => {
        const applications = [{ p_id: "fertilizer1", p_app_amount: 100 }]
        const fertilizers = [
            { p_id: "fertilizer1", p_n_rt: 20, p_p_rt: undefined, p_k_rt: 5 },
        ]

        const expectedDose: Dose = {
            p_dose_n: 2000,
            p_dose_p2o5: 0,
            p_dose_k2o: 500,
        }
        expect(calculateDose({ applications, fertilizers })).toEqual(
            expectedDose,
        )
    })

    it("should handle null nutrient values in fertilizer as 0", () => {
        const applications = [{ p_id: "fertilizer1", p_app_amount: 100 }]
        const fertilizers = [
            { p_id: "fertilizer1", p_n_rt: 20, p_p_rt: 10, p_k_rt: null },
        ]

        const expectedDose: Dose = {
            p_dose_n: 2000,
            p_dose_p2o5: 1000,
            p_dose_k2o: 0,
        }
        expect(calculateDose({ applications, fertilizers })).toEqual(
            expectedDose,
        )
    })

    it("should return 0 dose when application amount is 0", () => {
        const applications = [{ p_id: "fertilizer1", p_app_amount: 0 }]
        const fertilizers = [
            { p_id: "fertilizer1", p_n_rt: 20, p_p_rt: 10, p_k_rt: 5 },
        ]

        const expectedDose: Dose = {
            p_dose_n: 0,
            p_dose_p2o5: 0,
            p_dose_k2o: 0,
        }
        expect(calculateDose({ applications, fertilizers })).toEqual(
            expectedDose,
        )
    })
})
