import { describe, expect, it } from "vitest"
import { calculateNitrogenSupplyByDeposition } from "./deposition"
import type { FieldInput, NitrogenBalanceInput } from "../types"
import { getFdmPublicDataUrl } from "../index"

describe("calculateNitrogenSupplyByDeposition", () => {
    const fdmPublicDataUrl = getFdmPublicDataUrl()

    it("should calculate nitrogen deposition correctly", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [5.0, 52.0],
            b_area: 100000,
            b_id: "test_field",
            b_start: new Date("2025-01-01"),
            b_end: new Date("2025-12-31"),
        }
        const timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2025-01-01"),
            end: new Date("2025-12-31"),
        }

        const result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )

        expect(result.total.toNumber()).toBeCloseTo(19.572)
    })

    it("should handle different timeframes correctly", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [5.0, 52.0],
            b_area: 100000,
            b_id: "test_field",
            b_start: new Date("2025-01-01"),
            b_end: new Date("2025-12-31"),
        }

        // Test with a full year
        let timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2024-01-01"),
        }
        let result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )
        expect(result.total.toNumber()).toBeCloseTo(19.626)

        // Test with half a year
        timeFrame = {
            start: new Date("2023-01-01"),
            end: new Date("2023-07-01"),
        }
        result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )

        expect(result.total.toNumber()).toBeCloseTo(9.7592)
    })

    it("should provide zero if outside bounding box", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [50.0, 12.0],
            b_area: 100000,
            b_id: "test_field",
            b_start: new Date("2025-01-01"),
            b_end: new Date("2025-12-31"),
        }
        const timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2023-12-31"),
        }

        const result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )

        expect(result.total.toNumber()).toBeCloseTo(0)
    })
})
