import Decimal from "decimal.js"
import { describe, expect, it, vi } from "vitest"
import { convertOrganicMatterBalanceToNumeric } from "../shared/conversion"
import * as shared from "../shared/soil"
import * as degradation from "./degradation"
import {
    calculateOrganicMatterBalanceField,
    calculateOrganicMatterBalancesFieldToFarm,
} from "./index"
import * as supply from "./supply"
import type {
    FieldInput,
    OrganicMatterBalanceFieldNumeric,
    OrganicMatterBalanceFieldResultNumeric,
    OrganicMatterBalanceInput,
} from "./types"

vi.mock("./supply")
vi.mock("./degradation")
vi.mock("../shared/soil")

describe("Organic Matter Balance Calculation", () => {
    const timeFrame: OrganicMatterBalanceInput["timeFrame"] = {
        start: new Date("2023-01-01"),
        end: new Date("2023-12-31"),
    }
    const mockField: FieldInput["field"] = {
        b_id: "field1",
        b_area: 10,
    } as FieldInput["field"]
    const mockCultivations: FieldInput["cultivations"] = []
    const mockFertilizerApplications: FieldInput["fertilizerApplications"] = []
    const mockSoilAnalyses: FieldInput["soilAnalyses"] = []

    describe("calculateOrganicMatterBalanceField", () => {
        it("should calculate balance as supply - degradation", () => {
            vi.spyOn(supply, "calculateOrganicMatterSupply").mockReturnValue({
                total: new Decimal(500),
            } as any)
            vi.spyOn(
                degradation,
                "calculateOrganicMatterDegradation",
            ).mockReturnValue({
                total: new Decimal(-200),
            })
            vi.spyOn(shared, "combineSoilAnalyses").mockReturnValue({} as any)

            const result = calculateOrganicMatterBalanceField({
                fieldInput: {
                    field: mockField,
                    cultivations: mockCultivations,
                    fertilizerApplications: mockFertilizerApplications,
                    soilAnalyses: mockSoilAnalyses,
                },
                fertilizerDetails: [],
                cultivationDetails: [],
                timeFrame,
            })

            expect(result.balance).toBe(300)
            expect(result.supply.total).toBe(500)
            expect(result.degradation.total).toBe(-200)
        })
    })

    describe("calculateOrganicMatterBalancesFieldToFarm", () => {
        it("should aggregate field results to a weighted farm average", () => {
            const results: OrganicMatterBalanceFieldResultNumeric[] = [
                {
                    b_id: "field1",
                    b_area: 10,
                    balance: {
                        supply: { total: 500 },
                        degradation: { total: -200 },
                        balance: 300,
                    } as OrganicMatterBalanceFieldNumeric,
                },
                {
                    b_id: "field2",
                    b_area: 5,
                    balance: {
                        supply: { total: 400 },
                        degradation: { total: -300 },
                        balance: 100,
                    } as OrganicMatterBalanceFieldNumeric,
                },
            ]

            const farmBalance = calculateOrganicMatterBalancesFieldToFarm(
                results,
                false,
                [],
            )

            // Total Supply = (500*10 + 400*5) / (10+5) = 7000 / 15 = 466.67 -> 467
            // Total Degradation = (200*10 + 300*5) / (10+5) = 3500 / 15 = 233.33 -> 233
            // Total Balance = 466.67 - 233.33 = 233.34 -> 233
            expect(farmBalance.supply).toBe(467)
            expect(farmBalance.degradation).toBe(-233)
            expect(farmBalance.balance).toBe(233)
        })

        it("should handle cases with calculation errors", () => {
            const results: OrganicMatterBalanceFieldResultNumeric[] = [
                {
                    b_id: "field1",
                    b_area: 10,
                    balance: {
                        balance: 300,
                        supply: { total: 500 },
                        degradation: { total: -200 },
                    } as OrganicMatterBalanceFieldNumeric,
                },
                { b_id: "field2", b_area: 5, errorMessage: "Failed" },
            ]
            const farmBalance = calculateOrganicMatterBalancesFieldToFarm(
                results,
                true,
                ["Error"],
            )
            expect(farmBalance.hasErrors).toBe(true)
            expect(farmBalance.fieldErrorMessages).toEqual(["Error"])
            // Check that only the successful field is aggregated
            expect(farmBalance.supply).toBeCloseTo(500)
            expect(farmBalance.degradation).toBeCloseTo(-200)
            expect(farmBalance.balance).toBeCloseTo(300)
        })
    })

    describe("convertOrganicMatterBalanceToNumeric", () => {
        it("should convert all Decimal types to numbers", () => {
            const farmBalanceDecimal = {
                balance: new Decimal(233.333),
                supply: new Decimal(466.666),
                degradation: new Decimal(-233.333),
                fields: [
                    {
                        b_id: "field1",
                        b_area: 10,
                        balance: {
                            balance: new Decimal(300),
                            supply: {},
                            degradation: {},
                        },
                    },
                ],
                hasErrors: false,
                fieldErrorMessages: [],
            } as any

            const numericResult =
                convertOrganicMatterBalanceToNumeric(farmBalanceDecimal)

            expect(typeof numericResult.balance).toBe("number")
            expect(typeof numericResult.supply).toBe("number")
            expect(typeof numericResult.degradation).toBe("number")
            expect(typeof numericResult.fields[0].balance).toBe("object")
            expect(numericResult.balance).toBe(233) // .round()
        })
    })
})
