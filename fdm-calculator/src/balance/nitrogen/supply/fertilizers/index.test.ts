import { Decimal } from "decimal.js"
// c:\Users\sven.verweij\Applications\fdm\fdm-calculator\src\balance\nitrogen\supply\fertilizers\index.test.ts
import { describe, expect, it } from "vitest"
import type { FertilizerDetail, FieldInput } from "../../types"
import { calculateNitrogenSupplyByFertilizers } from "."

describe("calculateNitrogenSupplyByFertilizers", () => {
    it("should return 0 if no fertilizer applications are provided", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = []
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        const result = calculateNitrogenSupplyByFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        expect(result.total.equals(new Decimal(0))).toBe(true)
        expect(result.mineral.total.equals(new Decimal(0))).toBe(true)
        expect(result.manure.total.equals(new Decimal(0))).toBe(true)
        expect(result.compost.total.equals(new Decimal(0))).toBe(true)
        expect(result.other.total.equals(new Decimal(0))).toBe(true)
        expect(result.mineral.applications).toEqual([])
        expect(result.manure.applications).toEqual([])
        expect(result.compost.applications).toEqual([])
        expect(result.other.applications).toEqual([])
    })

    it("should calculate nitrogen supply from all fertilizer types", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_id_catalogue: "mineral1",
                p_app_amount: 1000,
                p_app_id: "app1",
            },
            { p_id_catalogue: "manure1", p_app_amount: 500, p_app_id: "app2" },
            { p_id_catalogue: "compost1", p_app_amount: 250, p_app_id: "app3" },
            { p_id_catalogue: "other1", p_app_amount: 100, p_app_id: "app4" },
        ]

        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "mineral1",
                {
                    p_id_catalogue: "mineral1",
                    p_n_rt: 20,
                    p_type: "mineral",
                },
            ],
            [
                "manure1",
                {
                    p_id_catalogue: "manure1",
                    p_n_rt: 15,
                    p_type: "manure",
                },
            ],
            [
                "compost1",
                {
                    p_id_catalogue: "compost1",
                    p_n_rt: 10,
                    p_type: "compost",
                },
            ],
            [
                "other1",
                {
                    p_id_catalogue: "other1",
                    p_n_rt: 10,
                    p_type: "other",
                },
            ],
        ])

        const result = calculateNitrogenSupplyByFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        expect(result.total.equals(new Decimal(31))).toBe(true)
        expect(result.mineral.total.equals(new Decimal(20))).toBe(true)
        expect(result.manure.total.equals(new Decimal(7.5))).toBe(true)
        expect(result.compost.total.equals(new Decimal(2.5))).toBe(true)
        expect(result.other.total.equals(new Decimal(1))).toBe(true)
    })

    it("should handle missing fertilizer details gracefully", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_id_catalogue: "mineral1",
                p_app_amount: 1000,
                p_app_id: "app1",
            },
            { p_id_catalogue: "missing", p_app_amount: 500, p_app_id: "app2" },
        ]

        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "mineral1",
                {
                    p_id_catalogue: "mineral1",
                    p_n_rt: 20,
                    p_type: "mineral",
                },
            ],
        ])

        expect(() =>
            calculateNitrogenSupplyByFertilizers(
                fertilizerApplications,
                fertilizerDetailsMap,
            ),
        ).toThrow("Fertilizer application app2 has no fertilizerDetails")
    })

    it("should throw an error if any sub-function throws an error", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_id_catalogue: "mineral1",
                p_app_amount: 1000,
                p_app_id: "app1",
            },
        ]

        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        expect(() =>
            calculateNitrogenSupplyByFertilizers(
                fertilizerApplications,
                fertilizerDetailsMap,
            ),
        ).toThrow("Fertilizer application app1 has no fertilizerDetails")
    })
})
