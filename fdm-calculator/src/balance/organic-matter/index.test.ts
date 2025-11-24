import { describe, it, expect, vi } from "vitest"
import Decimal from "decimal.js"
import {
    calculateOrganicMatterBalanceField,
    calculateOrganicMatterBalancesFieldToFarm,
} from "./index"
import { convertOrganicMatterBalanceToNumeric } from "../shared/conversion"
import * as supply from "./supply"
import * as degradation from "./degradation"
import * as shared from "../shared/soil"
import type {
    OrganicMatterBalanceInput,
    FieldInput,
    CultivationDetail,
    FertilizerDetail,
    OrganicMatterBalanceField,
    OrganicMatterBalanceFieldResult,
} from "./types.d"

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
    const mockCultivationDetailsMap = new Map<string, CultivationDetail>()
    const mockFertilizerDetailsMap = new Map<string, FertilizerDetail>()

    describe("calculateOrganicMatterBalanceField", () => {
        it("should calculate balance as supply - degradation", () => {
            vi.spyOn(supply, "calculateOrganicMatterSupply").mockReturnValue({
                total: new Decimal(500),
            } as any)
            vi.spyOn(
                degradation,
                "calculateOrganicMatterDegradation",
            ).mockReturnValue({
                total: new Decimal(200),
            })
            vi.spyOn(shared, "combineSoilAnalyses").mockReturnValue({} as any)

            const result = calculateOrganicMatterBalanceField(
                mockField,
                mockCultivations,
                mockFertilizerApplications,
                mockSoilAnalyses,
                mockFertilizerDetailsMap,
                mockCultivationDetailsMap,
                timeFrame,
            )

            expect(result.balance.balance.toNumber()).toBe(300)
            expect(result.balance.supply.total.toNumber()).toBe(500)
            expect(result.balance.degradation.total.toNumber()).toBe(200)
        })

        it("should return an error message if a sub-calculation fails", () => {
            vi.spyOn(supply, "calculateOrganicMatterSupply").mockImplementation(
                () => {
                    throw new Error("Supply calculation failed")
                },
            )
            vi.spyOn(shared, "combineSoilAnalyses").mockReturnValue({} as any)

            const result = calculateOrganicMatterBalanceField(
                mockField,
                mockCultivations,
                mockFertilizerApplications,
                mockSoilAnalyses,
                mockFertilizerDetailsMap,
                mockCultivationDetailsMap,
                timeFrame,
            )

            expect(result.errorMessage).toBe("Supply calculation failed")
            expect(result.balance).toBeUndefined()
        })
    })

    describe("calculateOrganicMatterBalancesFieldToFarm", () => {
        it("should aggregate field results to a weighted farm average", () => {
            const results: OrganicMatterBalanceFieldResult[] = [
                {
                    b_id: "field1",
                    b_area: 10,
                    balance: {
                        supply: { total: new Decimal(500) },
                        degradation: { total: new Decimal(-200) },
                        balance: new Decimal(300),
                    } as OrganicMatterBalanceField,
                },
                {
                    b_id: "field2",
                    b_area: 5,
                    balance: {
                        supply: { total: new Decimal(400) },
                        degradation: { total: new Decimal(-300) },
                        balance: new Decimal(100),
                    } as OrganicMatterBalanceField,
                },
            ]
            const fields: FieldInput[] = [
                { field: { b_id: "field1", b_area: 10 } } as FieldInput,
                { field: { b_id: "field2", b_area: 5 } } as FieldInput,
            ]

            const farmBalance = calculateOrganicMatterBalancesFieldToFarm(
                results,
                fields,
                false,
                [],
            )

            // Total Supply = (500*10 + 400*5) / (10+5) = 7000 / 15 = 466.67
            // Total Degradation = (200*10 + 300*5) / (10+5) = 3500 / 15 = 233.33
            // Total Balance = 466.67 - 233.33 = 233.34
            expect(farmBalance.supply.toNumber()).toBeCloseTo(466.67, 2)
            expect(farmBalance.degradation.toNumber()).toBeCloseTo(-233.33, 2)
            expect(farmBalance.balance.toNumber()).toBeCloseTo(233.33, 2)
        })

        it("should handle cases with calculation errors", () => {
            const results: OrganicMatterBalanceFieldResult[] = [
                {
                    b_id: "field1",
                    b_area: 10,
                    balance: {
                        balance: new Decimal(300),
                        supply: { total: new Decimal(500) },
                        degradation: { total: new Decimal(-200) },
                    } as OrganicMatterBalanceField,
                },
                { b_id: "field2", b_area: 5, errorMessage: "Failed" },
            ]
            const fields: FieldInput[] = [
                { field: { b_id: "field1", b_area: 10 } } as FieldInput,
                { field: { b_id: "field2", b_area: 5 } } as FieldInput,
            ]
            const farmBalance = calculateOrganicMatterBalancesFieldToFarm(
                results,
                fields,
                true,
                ["Error"],
            )
            expect(farmBalance.hasErrors).toBe(true)
            expect(farmBalance.fieldErrorMessages).toEqual(["Error"])
            // Check that only the successful field is aggregated
            expect(farmBalance.supply.toNumber()).toBeCloseTo(500)
            expect(farmBalance.degradation.toNumber()).toBeCloseTo(-200)
            expect(farmBalance.balance.toNumber()).toBeCloseTo(300)
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
            expect(typeof numericResult.fields[0].balance).toBe("number")
            expect(numericResult.balance).toBe(233) // .round()
        })
    })
})
