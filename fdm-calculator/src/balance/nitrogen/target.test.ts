import { describe, it, expect } from "vitest"
import { calculateTargetForNitrogenBalance } from "./target"
import type {
    FieldInput,
    SoilAnalysisPicked,
    NitrogenBalanceInput,
    CultivationDetail,
} from "./types"

describe("calculateTargetForNitrogenBalance", () => {
    const defaultTimeFrame: NitrogenBalanceInput["timeFrame"] = {
        start: new Date("2023-01-01"),
        end: new Date("2023-12-31"),
    }

    const createCultivation = (
        b_lu_catalogue: string,
    ): FieldInput["cultivations"][0] => ({
        b_lu: "test_lu",
        b_lu_catalogue,
        m_cropresidue: true,
    })

    const createSoilAnalysis = (
        b_soiltype_agr: string,
        b_gwl_class: string,
    ): SoilAnalysisPicked => ({
        b_soiltype_agr,
        b_gwl_class,
        a_c_of: 20,
        a_cn_fr: 10,
        a_density_sa: 1.2,
        a_n_rt: 3000,
        a_som_loi: 2,
    })

    const createCultivationDetailsMap = (
        b_lu_catalogue: string,
        b_lu_croprotation: string,
    ): Map<string, CultivationDetail> =>
        new Map([
            [
                b_lu_catalogue,
                {
                    b_lu_catalogue,
                    b_lu_croprotation,
                    b_lu_yield: 1000,
                    b_lu_n_harvestable: 20,
                    b_lu_hi: 0.4,
                    b_lu_n_residue: 2,
                    b_n_fixation: 0,
                },
            ],
        ])

    it("should calculate target for grassland on dry sandy soil", () => {
        const cultivations = [createCultivation("grass1")]
        const soilAnalysis = createSoilAnalysis("duinzand", "bVII")
        const cultivationDetailsMap = createCultivationDetailsMap("grass1", "grass")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(80)
    })

    it("should calculate target for grassland on other soil types", () => {
        const cultivations = [createCultivation("grass1")]
        const soilAnalysis = createSoilAnalysis("zeeklei", "V")
        const cultivationDetailsMap = createCultivationDetailsMap("grass1", "grass")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(125)
    })

    it("should calculate target for arable land on dry sandy soil", () => {
        const cultivations: FieldInput["cultivations"] = [
            createCultivation("crop1"),
        ]
        const soilAnalysis = createSoilAnalysis("dekzand", "sVII")
        const cultivationDetailsMap = createCultivationDetailsMap("crop1", "cereal")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(50)
    })

    it("should calculate target for arable land on average sandy soil", () => {
        const cultivations: FieldInput["cultivations"] = [
            createCultivation("crop1"),
        ]
        const soilAnalysis = createSoilAnalysis("loess", "Vb")
        const cultivationDetailsMap = createCultivationDetailsMap("crop1", "cereal")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(70)
    })

    it("should calculate target for arable land on wet sandy soil", () => {
        const cultivations: FieldInput["cultivations"] = [
            createCultivation("crop1"),
        ]
        const soilAnalysis = createSoilAnalysis("dalgrond", "III")
        const cultivationDetailsMap = createCultivationDetailsMap("crop1", "cereal")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(125)
    })

    it("should calculate target for arable land on dry clay soil", () => {
        const cultivations: FieldInput["cultivations"] = [
            createCultivation("crop1"),
        ]
        const soilAnalysis = createSoilAnalysis("rivierklei", "sVII")
        const cultivationDetailsMap = createCultivationDetailsMap("crop1", "cereal")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(125)
    })

    it("should calculate target for arable land on other clay soil", () => {
        const cultivations: FieldInput["cultivations"] = [
            createCultivation("crop1"),
        ]
        const soilAnalysis = createSoilAnalysis("veen", "Va")
        const cultivationDetailsMap = createCultivationDetailsMap("crop1", "cereal")
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            defaultTimeFrame,
        )
        expect(result.toNumber()).toBe(125)
    })

    it("should adjust target value based on time frame", () => {
        const cultivations: FieldInput["cultivations"] = [
            createCultivation("grass1"),
        ]
        const soilAnalysis = createSoilAnalysis("duinzand", "bVII")
        const cultivationDetailsMap = createCultivationDetailsMap("grass1", "grass")
        const shortTimeFrame: NitrogenBalanceInput["timeFrame"] = {
            start: new Date("2023-01-01"),
            end: new Date("2023-07-02"), // 182 days (half year + 1 day)
        }
        const result = calculateTargetForNitrogenBalance(
            cultivations,
            soilAnalysis,
            cultivationDetailsMap,
            shortTimeFrame,
        )
        expect(result.toNumber()).toBeCloseTo(40.11, 1) // Expected value adjusted for half year
    })
})