import { describe, expect, it, vi } from "vitest"
import { calculateNitrogenSupplyByDeposition } from "./deposition"
import { Decimal } from "decimal.js"
import type { FieldInput, NitrogenBalanceInput } from "../types"
import { differenceInCalendarDays } from "date-fns/differenceInCalendarDays"
import geoblaze from "geoblaze"

describe("calculateNitrogenSupplyByDeposition", () => {
    it("should return 0 if depositionFromDataset is null", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [5.0, 52.0],
            b_area: 100000,
            b_id: "test_field",
        }
        const timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2023-12-31"),
        }
        const fdmPublicDataUrl = "mock-url"

        const geoblazeIdentifySpy = vi
            .spyOn(geoblaze, "identify")
            .mockResolvedValue(null)

        const result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )

        expect(result.total.equals(new Decimal(0))).toBe(true)
        expect(geoblazeIdentifySpy).toHaveBeenCalled()
    })

    it("should calculate nitrogen deposition correctly", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [5.0, 52.0],
            b_area: 100000,
            b_id: "test_field",
        }
        const timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2025-01-01"),
            end: new Date("2025-12-31"),
        }
        const fdmPublicDataUrl = "mock-url"
        const depositionValue = 10 // kg N/ha/year

        const geoblazeIdentifySpy = vi
            .spyOn(geoblaze, "identify")
            .mockResolvedValue([depositionValue])

        const result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            fdmPublicDataUrl,
        )

        expect(result.total).toBeDefined()
        expect(geoblazeIdentifySpy).toHaveBeenCalled()
    })

    it("should handle different timeframes correctly", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [5.0, 52.0],
            b_area: 100000,
            b_id: "test_field",
        }
        const depositionValue = 10 // kg N/ha/year

        vi.spyOn(geoblaze, "identify").mockResolvedValue([depositionValue])

        // Test with a full year
        let timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2024-01-01"),
        }
        let result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            "mock-url",
        )
        expect(result.total.equals(new Decimal(depositionValue))).toBe(true)

        // Test with half a year
        timeFrame = {
            start: new Date("2023-01-01"),
            end: new Date("2023-07-01"),
        }
        result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            "mock-url",
        )

        expect(
            result.total.equals(
                new Decimal(depositionValue).times(
                    new Decimal(
                        differenceInCalendarDays(
                            timeFrame.end,
                            timeFrame.start,
                        ),
                    ).dividedBy(365),
                ),
            ),
        ).toBe(true)

        // Test with a shorter period
        timeFrame = {
            start: new Date("2023-03-01"),
            end: new Date("2023-04-01"),
        }
        result = await calculateNitrogenSupplyByDeposition(
            field,
            timeFrame,
            "mock-url",
        )

        expect(
            result.total.equals(
                new Decimal(depositionValue).times(
                    new Decimal(
                        differenceInCalendarDays(
                            timeFrame.end,
                            timeFrame.start,
                        ),
                    ).dividedBy(365),
                ),
            ),
        ).toBe(true)
    })

    it("should handle errors from geoblaze.identify", async () => {
        const field: FieldInput["field"] = {
            b_centroid: [5.0, 52.0],
            b_area: 100000,
            b_id: "test_field",
        }
        const timeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2023-12-31"),
        }
        const fdmPublicDataUrl = "mock-url"

        const error = new Error("Geoblaze error")
        const geoblazeIdentifySpy = vi
            .spyOn(geoblaze, "identify")
            .mockRejectedValue(error)

        await expect(
            calculateNitrogenSupplyByDeposition(
                field,
                timeFrame,
                fdmPublicDataUrl,
            ),
        ).rejects.toThrow(error)
        expect(geoblazeIdentifySpy).toHaveBeenCalled()
    })
})
