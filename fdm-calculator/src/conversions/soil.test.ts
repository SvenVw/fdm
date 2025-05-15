import { describe, it, expect } from "vitest"
import {
    calculateOrganicCarbon,
    calculateOrganicMatter,
    calculateCarbonNitrogenRatio,
    calculateBulkDensity,
} from "./soil"

describe("Soil Conversions", () => {
    describe("calculateOrganicCarbon", () => {
        it("should calculate organic carbon correctly", () => {
            expect(calculateOrganicCarbon(10)).toBe(50)
            expect(calculateOrganicCarbon(20)).toBe(100)
        })

        it("should handle null input", () => {
            expect(calculateOrganicCarbon(null)).toBeNull()
        })

        it("should clamp values within the valid range", () => {
            expect(calculateOrganicCarbon(1201)).toBe(600) // Test upper limit
            expect(calculateOrganicCarbon(0.01)).toBeCloseTo(0.1, 2) // Test lower limit
        })
    })

    describe("calculateOrganicMatter", () => {
        it("should calculate organic matter correctly", () => {
            expect(calculateOrganicMatter(5)).toBe(1)
            expect(calculateOrganicMatter(10)).toBe(2)
        })

        it("should handle null input", () => {
            expect(calculateOrganicMatter(null)).toBeNull()
        })

        it("should clamp values within the valid range", () => {
            expect(calculateOrganicMatter(760)).toBe(75) // Test upper limit
            expect(calculateOrganicMatter(0.2)).toBeCloseTo(0.5) // Test lower limit
        })
    })

    describe("calculateCarbonNitrogenRatio", () => {
        it("should calculate the C/N ratio correctly", () => {
            expect(calculateCarbonNitrogenRatio(15, 2000)).toBe(7.5)
            expect(calculateCarbonNitrogenRatio(30, 5000)).toBe(6)
        })

        it("should handle null input for either parameter", () => {
            expect(calculateCarbonNitrogenRatio(null, 2000)).toBeNull()
            expect(calculateCarbonNitrogenRatio(10, null)).toBeNull()
        })

        it("should clamp values within the valid range", () => {
            expect(calculateCarbonNitrogenRatio(100, 1000)).toBe(40) // Test upper limit
            expect(calculateCarbonNitrogenRatio(1, 1000)).toBe(5) // Test lower limit
        })
    })

    describe("calculateBulkDensity", () => {
        it("should calculate bulk density correctly for sandy soils", () => {
            const sandySoilTypes = ["dekzand", "dalgrond", "duinzand", "loess"]
            for (const soilType of sandySoilTypes) {
                expect(calculateBulkDensity(10, soilType)).toBeCloseTo(
                    1 / (10 * 0.02525 + 0.6541),
                )
            }
        })

        it("should calculate bulk density correctly for non-sandy soils", () => {
            expect(calculateBulkDensity(10, "rivierklei")).toBeCloseTo(0.9788, 3)
            expect(calculateBulkDensity(20, "zeeklei")).toBeCloseTo(0.874, 3)
        })

        it("should handle null input for either parameter", () => {
            expect(calculateBulkDensity(null, "dekzand")).toBeNull()
            expect(calculateBulkDensity(10, null)).toBeNull()
        })

        it("should clamp values within the valid range", () => {
            // Testing lower limit with sandy soil where the formula might result in very low values
            expect(calculateBulkDensity(50, "dekzand")).toBeCloseTo(0.5, 1)

            // Testing upper limit with non-sandy soil adjusted for extreme conditions
            expect(calculateBulkDensity(20, "rivierklei")).toBeCloseTo(0.874, 1)
        })

        it("should return a reasonable value for organic soils", () => {
            const organicMatterContent = 30 // percent
            const soilType = "veen"
            const expectedDensity = 0.799 // Example expected density, adjust as needed
            const calculatedDensity = calculateBulkDensity(
                organicMatterContent,
                soilType,
            )
            expect(calculatedDensity).toBeCloseTo(expectedDensity, 2) // Allows for slight calculation variations
        })

        it("should return a reasonable value for mineral soils", () => {
            const organicMatterContent = 5 // percent
            const soilType = "zand"
            const expectedDensity = 1.107 // Example expected density, adjust as needed
            const calculatedDensity = calculateBulkDensity(
                organicMatterContent,
                soilType,
            )
            expect(calculatedDensity).toBeCloseTo(expectedDensity, 2) // Allows for slight calculation variations
        })

        it("should accurately calculate bulk density for sandy soil with low organic matter", () => {
            const organicMatterContent = 2 // percent
            const soilType = "dekzand"
            const expectedDensity = 1.419 // Expected density for this scenario
            const calculatedDensity = calculateBulkDensity(
                organicMatterContent,
                soilType,
            )
            expect(calculatedDensity).toBeCloseTo(expectedDensity, 2)
        })

        it("should accurately calculate bulk density for non-sandy soil with moderate organic matter", () => {
            const organicMatterContent = 15 // percent
            const soilType = "klei"
            const expectedDensity = 0.912 // Expected density for this scenario
            const calculatedDensity = calculateBulkDensity(
                organicMatterContent,
                soilType,
            )

            expect(calculatedDensity).toBeCloseTo(expectedDensity, 2)
        })

        it("should handle high organic matter content in sandy soil appropriately", () => {
            const organicMatterContent = 40 // percent, relatively high for sandy soil
            const soilType = "duinzand"
            const expectedDensity = 0.601 // Expect lower density due to high organic matter
            const calculatedDensity = calculateBulkDensity(
                organicMatterContent,
                soilType,
            )
            expect(calculatedDensity).toBeCloseTo(expectedDensity, 2)
        })

        it("should handle low organic matter content in non-sandy soil appropriately", () => {
            const organicMatterContent = 3 // percent, relatively low for non-sandy soil
            const soilType = "zeeklei"
            const expectedDensity = 1.184 // Expect higher density due to low organic matter
            const calculatedDensity = calculateBulkDensity(
                organicMatterContent,
                soilType,
            )
            expect(calculatedDensity).toBeCloseTo(expectedDensity, 2)
        })

        it("should calculate different bulk densities for the same organic matter content but different soil types", () => {
            const organicMatterContent = 10 // percent
            const sandySoilDensity = calculateBulkDensity(
                organicMatterContent,
                "dekzand",
            )
            const nonSandySoilDensity = calculateBulkDensity(
                organicMatterContent,
                "rivierklei",
            )
            expect(sandySoilDensity).not.toBe(nonSandySoilDensity)
            expect(sandySoilDensity).toBeCloseTo(1.103, 2)
            expect(nonSandySoilDensity).toBeCloseTo(0.978, 2)
        })
    })
})
