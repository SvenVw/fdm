import { describe, expect, it } from "vitest"
import {
    calculateNitrogenSupplyBySoilMineralization,
    calculateNitrogenSupplyBySoilMineralizationUsingMinip,
} from "./mineralization"
import type {
    SoilAnalysisPicked,
    NitrogenBalanceInput,
    NitrogenSupplyMineralization,
} from "../types"
import Decimal from "decimal.js"

describe("calculateNitrogenSupplyBySoilMineralization", () => {
    const mockSoilAnalysis: SoilAnalysisPicked = {
        a_c_of: 20, // Example value
        a_cn_fr: 10, // Example value
        a_density_sa: 1.2, // Example value
        b_soiltype_agr: "zand",
        a_n_rt: 1,
        a_som_loi: 1,
    }

    const mockTimeFrame: NitrogenBalanceInput["timeFrame"] = {
        start: new Date("2023-01-01"),
        end: new Date("2023-12-31"),
    }

    it("should calculate nitrogen supply by soil mineralization correctly", () => {
        const result: NitrogenSupplyMineralization =
            calculateNitrogenSupplyBySoilMineralization(
                mockSoilAnalysis,
                mockTimeFrame,
            )

        expect(result.total).toBeInstanceOf(Decimal)
        expect(result.total.toNumber()).toBeCloseTo(97.24, 2) // Expected value based on the mock data
    })
    it("should return 0 if the time frame is negative or zero", () => {
        const zeroTimeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2023-01-01"), // Same start and end date
        }
        const negativeTimeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-02"),
            end: new Date("2023-01-01"), // End date before start date
        }

        expect(
            calculateNitrogenSupplyBySoilMineralization(
                mockSoilAnalysis,
                zeroTimeFrame,
            ).total.toNumber(),
        ).toBe(0)
        expect(
            calculateNitrogenSupplyBySoilMineralization(
                mockSoilAnalysis,
                negativeTimeFrame,
            ).total.toNumber(),
        ).toBe(0)
    })

    it("should return 250 if organic carbon is above 250", () => {
        const mockSoilAnalysis2: SoilAnalysisPicked = {
            a_c_of: 350, // Example value
            a_cn_fr: 10, // Example value
            a_density_sa: 1.2, // Example value
            b_soiltype_agr: "zand",
            a_n_rt: 1,
            a_som_loi: 1,
        }

        const result: NitrogenSupplyMineralization =
            calculateNitrogenSupplyBySoilMineralization(
                mockSoilAnalysis2,
                mockTimeFrame,
            )

        expect(result.total).toBeInstanceOf(Decimal)
        expect(result.total.toNumber()).toBe(250)
    })
})

describe("calculateNitrogenSupplyBySoilMineralizationUsingMinip", () => {
    it("should calculate nitrogen mineralization correctly using Minip", () => {
        const a_c_of = 20
        const a_cn_fr = 10
        const a_density_sa = 1.2

        const result = calculateNitrogenSupplyBySoilMineralizationUsingMinip(
            a_c_of,
            a_cn_fr,
            a_density_sa,
        )

        expect(result).toBeInstanceOf(Decimal)
        expect(result.toNumber()).toBeCloseTo(97.24, 2)
    })
})
