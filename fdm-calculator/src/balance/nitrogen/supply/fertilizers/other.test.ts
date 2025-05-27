import { describe, expect, it } from "vitest"
import { Decimal } from "decimal.js"
import { calculateNitrogenSupplyByOtherFertilizers } from "./other"
import type { FertilizerDetail, FieldInput } from "../../types"

describe("calculateNitrogenSupplyByOtherFertilizers", () => {
    it("should return 0 if no other fertilizer applications are found", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = []
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        const result = calculateNitrogenSupplyByOtherFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        expect(result.total.equals(new Decimal(0))).toBe(true)
        expect(result.applications).toEqual([])
    })

    it("should calculate nitrogen supply from other fertilizer applications", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_id_catalogue: "app1",
                p_app_amount: 1000,
                p_app_id: "app1",
            },
            {
                p_id_catalogue: "app2",
                p_app_amount: 500,
                p_app_id: "app2",
            },
        ]

        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "app1",
                {
                    p_id_catalogue: "app1",
                    p_type_compost: false,
                    p_n_rt: 20,
                    p_type_manure: false,
                    p_type_mineral: false,
                },
            ],
            [
                "app2",
                {
                    p_id_catalogue: "app2",
                    p_type_compost: false,
                    p_n_rt: 15,
                    p_type_manure: false,
                    p_type_mineral: false,
                },
            ],
        ])

        const result = calculateNitrogenSupplyByOtherFertilizers(
            fertilizerApplications,
            fertilizerDetailsMap,
        )

        expect(result.total.equals(new Decimal(27.5))).toBe(true)
        expect(result.applications).toEqual([
            { id: "app1", value: new Decimal(20) },
            { id: "app2", value: new Decimal(7.5) },
        ])
    })

    it("should throw an error if a fertilizer application has no details", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_id_catalogue: "nonExistent",
                p_app_amount: 1000,
                p_app_id: "app1",
            },
        ]

        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        expect(() =>
            calculateNitrogenSupplyByOtherFertilizers(
                fertilizerApplications,
                fertilizerDetailsMap,
            ),
        ).toThrowError("Fertilizer application app1 has no fertilizerDetails")
    })
})
