import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
    calculateFertilizerApplicationFillingForNitrogen,
    isBouwland,
    getWorkingCoefficient,
} from "./stikstofgebruiksnorm"
import { getRegion } from "../stikstofgebruiksnorm"
import type {
    Fertilizer,
    FertilizerApplication,
    CurrentSoilData,
    Cultivation,
} from "@svenvw/fdm-core"
import type { RegionKey } from "../types"

// Mock getRegion
vi.mock("../stikstofgebruiksnorm", () => ({
    getRegion: vi.fn(),
}))

describe("isBouwland", () => {
    it("should return true if cultivation is not in non-bouwland codes", () => {
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2025-01-01",
                b_lu_catalogue: "nl_2014", // A generic bouwland code
            },
        ]
        const applicationDate = new Date("2025-06-15")
        expect(isBouwland(cultivations, applicationDate)).toBe(true)
    })

    it("should return false if cultivation is in non-bouwland codes", () => {
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2025-01-01",
                b_lu_catalogue: "nl_265", // Grasland
            },
        ]
        const applicationDate = new Date("2025-06-15")
        expect(isBouwland(cultivations, applicationDate)).toBe(false)
    })

    it("should return false if no active cultivation exists", () => {
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2024-01-01",
                b_end: "2024-12-31",
                b_lu_catalogue: "nl_2014",
            },
        ]
        const applicationDate = new Date("2025-06-15")
        expect(isBouwland(cultivations, applicationDate)).toBe(false)
    })

    it("should return true for a cultivation spanning the application date", () => {
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2025-01-01",
                b_end: "2025-12-31",
                b_lu_catalogue: "nl_2014",
            },
        ]
        const applicationDate = new Date("2025-07-01")
        expect(isBouwland(cultivations, applicationDate)).toBe(true)
    })

    it("should return false for a cultivation ending before the application date", () => {
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2025-01-01",
                b_end: "2025-06-30",
                b_lu_catalogue: "nl_2014",
            },
        ]
        const applicationDate = new Date("2025-07-01")
        expect(isBouwland(cultivations, applicationDate)).toBe(false)
    })

    it("should return false for a cultivation starting after the application date", () => {
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2025-08-01",
                b_end: "2025-12-31",
                b_lu_catalogue: "nl_2014",
            },
        ]
        const applicationDate = new Date("2025-07-01")
        expect(isBouwland(cultivations, applicationDate)).toBe(false)
    })
})

describe("getWorkingCoefficient", () => {
    // Helper to determine onFarmProduced for tests
    const isDrijfmest = (p_type_rvo: string) =>
        [
            "14",
            "18",
            "19",
            "60",
            "46",
            "50",
            "30",
            "76",
            "81",
            "91",
            "92",
        ].includes(p_type_rvo)
    const isVasteMest = (p_type_rvo: string) =>
        [
            "10",
            "56",
            "61",
            "25",
            "26",
            "27",
            "95",
            "96",
            "23",
            "31",
            "32",
            "33",
            "35",
            "39",
            "40",
            "43",
            "75",
            "80",
            "90",
            "97",
            "98",
            "99",
            "100",
            "101",
            "102",
            "103",
            "104",
            "105",
            "106",
            "11",
            "13",
        ].includes(p_type_rvo)

    it("should return 1.0 if p_type_rvo is null or undefined", () => {
        expect(
            getWorkingCoefficient(
                null,
                "zand_nwc",
                true,
                true,
                new Date(),
                false,
            ),
        ).toBe(1.0)
        expect(
            getWorkingCoefficient(
                undefined,
                "zand_nwc",
                true,
                true,
                new Date(),
                false,
            ),
        ).toBe(1.0)
    })

    it("should return 1.0 if p_type_rvo is not found in table9", () => {
        expect(
            getWorkingCoefficient(
                "999",
                "zand_nwc",
                true,
                true,
                new Date(),
                false,
            ),
        ).toBe(1.0)
    })

    // Drijfmest van graasdieren op het eigen bedrijf geproduceerd
    describe("Drijfmest van graasdieren op het eigen bedrijf geproduceerd (onFarmProduced: true)", () => {
        const p_type_rvo = "14" // Drijfmest rundvee
        const soilType: RegionKey = "zand_nwc"
        const isBouwland = false // Grasland
        const fertilizerOnFarmProduced = isDrijfmest(p_type_rvo)

        it("should return 0.45 for on-farm produced drijfmest with grazing intention", () => {
            const b_grazing_intention = true
            const applicationDate = new Date("2025-06-15")
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.45)
        })

        it("should return 0.60 for on-farm produced drijfmest without grazing intention", () => {
            const b_grazing_intention = false
            const applicationDate = new Date("2025-06-15")
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.6)
        })
    })

    // Drijfmest van graasdieren aangevoerd
    it("should return 0.60 for aangevoerd drijfmest (onFarmProduced: false)", () => {
        const p_type_rvo = "14" // Drijfmest rundvee
        const soilType: RegionKey = "zand_nwc"
        const b_grazing_intention = true
        const isBouwland = false
        const applicationDate = new Date("2025-06-15")
        const fertilizerOnFarmProduced = false // Explicitly false for aangevoerd
        expect(
            getWorkingCoefficient(
                p_type_rvo,
                soilType,
                b_grazing_intention,
                isBouwland,
                applicationDate,
                fertilizerOnFarmProduced,
            ),
        ).toBe(0.6)
    })

    // Drijfmest van varkens
    describe("Drijfmest van varkens", () => {
        const p_type_rvo = "46" // Drijfmest fokzeugen
        const b_grazing_intention = false
        const isBouwland = true
        const applicationDate = new Date("2025-06-15")
        const fertilizerOnFarmProduced = isDrijfmest(p_type_rvo)

        it("should return 0.60 for klei en veen soil", () => {
            const soilType: RegionKey = "klei"
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.6)
        })

        it("should return 0.80 for zand en löss soil", () => {
            const soilType: RegionKey = "zand_nwc"
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.8)
        })
    })

    // Dunnen fractie na mestbewerking en gier
    it("should return 0.80 for dunne fractie", () => {
        const p_type_rvo = "12" // Filtraat na mestscheiding
        const soilType: RegionKey = "zand_nwc"
        const b_grazing_intention = false
        const isBouwland = true
        const applicationDate = new Date("2025-06-15")
        const fertilizerOnFarmProduced = isDrijfmest(p_type_rvo)
        expect(
            getWorkingCoefficient(
                p_type_rvo,
                soilType,
                b_grazing_intention,
                isBouwland,
                applicationDate,
                fertilizerOnFarmProduced,
            ),
        ).toBe(0.8)
    })

    // Vaste mest van graasdieren op het eigen bedrijf geproduceerd
    describe("Vaste mest van graasdieren op het eigen bedrijf geproduceerd (onFarmProduced: true)", () => {
        const p_type_rvo = "10" // Vaste mest rundvee
        const fertilizerOnFarmProduced = true
        const b_grazing_intention = false
        const isBouwland = true
        const soilType: RegionKey = "klei"

        it("should return 0.30 for bouwland on klei/veen from Sep 1 to Jan 31", () => {
            const applicationDate = new Date("2025-10-15") // October
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.3)
        })

        it("should return 0.45 for overige toepassingen on bedrijf met beweiding (outside Sep-Jan period)", () => {
            const applicationDate = new Date("2025-03-15") // March
            const b_grazing_intention_true = true
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention_true,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.45)
        })

        it("should return 0.60 for overige toepassingen on bedrijf zonder beweiding (outside Sep-Jan period)", () => {
            const applicationDate = new Date("2025-03-15") // March
            const b_grazing_intention_false = false
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention_false,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.6)
        })
    })

    // Vaste mest van graasdieren aangevoerd
    it("should return 0.40 for aangevoerd vaste mest (onFarmProduced: false) overige toepassingen", () => {
        const p_type_rvo = "10" // Vaste mest rundvee
        const soilType: RegionKey = "zand_nwc"
        const b_grazing_intention = false
        const isBouwland = true
        const applicationDate = new Date("2025-06-15")
        const fertilizerOnFarmProduced = false // Explicitly false for aangevoerd
        expect(
            getWorkingCoefficient(
                p_type_rvo,
                soilType,
                b_grazing_intention,
                isBouwland,
                applicationDate,
                fertilizerOnFarmProduced,
            ),
        ).toBe(0.4)
    })

    // Vaste mest van varkens, pluimvee en nertsen
    it("should return 0.55 for vaste mest van varkens, pluimvee en nertsen", () => {
        const p_type_rvo = "40" // Varkens, vaste mest
        const soilType: RegionKey = "zand_nwc"
        const b_grazing_intention = false
        const isBouwland = true
        const applicationDate = new Date("2025-06-15")
        const fertilizerOnFarmProduced = isVasteMest(p_type_rvo)
        expect(
            getWorkingCoefficient(
                p_type_rvo,
                soilType,
                b_grazing_intention,
                isBouwland,
                applicationDate,
                fertilizerOnFarmProduced,
            ),
        ).toBe(0.55)
    })

    // Vaste mest van overige diersoorten
    describe("Vaste mest van overige diersoorten", () => {
        const p_type_rvo = "104" // Cavia, vaste mest
        const soilType: RegionKey = "klei"
        const b_grazing_intention = false
        const isBouwland = true
        const fertilizerOnFarmProduced = isVasteMest(p_type_rvo)

        it("should return 0.30 for bouwland on klei/veen from Sep 1 to Jan 31", () => {
            const applicationDate = new Date("2025-11-01") // November
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.3)
        })

        it("should return 0.40 for overige toepassingen (outside Sep-Jan period)", () => {
            const applicationDate = new Date("2025-04-01") // April
            expect(
                getWorkingCoefficient(
                    p_type_rvo,
                    soilType,
                    b_grazing_intention,
                    isBouwland,
                    applicationDate,
                    fertilizerOnFarmProduced,
                ),
            ).toBe(0.4)
        })
    })

    // Overig (top-level entries)
    it("should return 0.10 for Compost", () => {
        expect(
            getWorkingCoefficient(
                "111",
                "zand_nwc",
                false,
                true,
                new Date(),
                false,
            ),
        ).toBe(0.1)
    })

    it("should return 0.25 for Champost", () => {
        expect(
            getWorkingCoefficient(
                "110",
                "zand_nwc",
                false,
                true,
                new Date(),
                false,
            ),
        ).toBe(0.25)
    })

    it("should return 0.40 for Zuiveringsslib", () => {
        expect(
            getWorkingCoefficient(
                "114",
                "zand_nwc",
                false,
                true,
                new Date(),
                false,
            ),
        ).toBe(0.4)
    })

    it("should return 0.50 for Overige organische meststoffen", () => {
        expect(
            getWorkingCoefficient(
                "116",
                "zand_nwc",
                false,
                true,
                new Date(),
                false,
            ),
        ).toBe(0.5)
    })

    it("should return 1.0 for Kunstmest", () => {
        expect(
            getWorkingCoefficient(
                "115",
                "zand_nwc",
                false,
                true,
                new Date(),
                false,
            ),
        ).toBe(1.0)
    })

    it("should return 1.0 for Mineralenconcentraat", () => {
        expect(
            getWorkingCoefficient(
                "120",
                "zand_nwc",
                false,
                true,
                new Date(),
                false,
            ),
        ).toBe(1.0)
    })
})

describe("calculateFertilizerApplicationFillingForNitrogen", () => {
    // Mock getRegion to return a consistent soil type for these tests
    beforeEach(() => {
        vi.mocked(getRegion).mockResolvedValue("zand_nwc")
    })

    afterEach(() => {
        vi.clearAllMocks()
    })

    it("should calculate norm filling correctly for a single application with known nitrogen content", async () => {
        const applications: FertilizerApplication[] = [
            {
                p_app_id: "app1",
                b_id: "field1",
                p_app_date: "2025-05-01",
                p_app_amount: 1000,
                p_id_catalogue: "fert1",
            },
        ]
        const fertilizers: Fertilizer[] = [
            {
                p_id_catalogue: "fert1",
                p_n_rt: 5, // 5 kg N per ton
                p_type_rvo: "115", // Kunstmest (working coefficient 1.0)
            },
        ]
        const soilData: CurrentSoilData[] = [] // Mocked
        const b_grazing_intention = false
        const cultivations: Cultivation[] = []

        const result = await calculateFertilizerApplicationFillingForNitrogen({
            applications,
            fertilizers,
            soilData,
            b_grazing_intention,
            cultivations,
        })

        // Expected: 1000 kg * 5 kg/ton * 1.0 (100%) / 1000 = 5
        expect(result.normFilling).toBeCloseTo(5)
        expect(result.applicationFilling[0].normFilling).toBeCloseTo(5)
    })

    it("should calculate norm filling correctly for multiple applications", async () => {
        const applications: FertilizerApplication[] = [
            {
                p_app_id: "app1",
                b_id: "field1",
                p_app_date: "2025-05-01",
                p_app_amount: 1000,
                p_id_catalogue: "fert1",
            },
            {
                p_app_id: "app2",
                b_id: "field1",
                p_app_date: "2025-03-15",
                p_app_amount: 500,
                p_id_catalogue: "fert2",
            },
        ]
        const fertilizers: Fertilizer[] = [
            {
                p_id_catalogue: "fert1",
                p_n_rt: 5, // 5 kg N per ton
                p_type_rvo: "115", // Kunstmest (working coefficient 1.0)
            },
            {
                p_id_catalogue: "fert2",
                p_n_rt: 10, // 10 kg N per ton
                p_type_rvo: "111", // Compost (working coefficient 0.1)
            },
        ]
        const soilData: CurrentSoilData[] = [] // Mocked
        const b_grazing_intention = false
        const cultivations: Cultivation[] = []

        const result = await calculateFertilizerApplicationFillingForNitrogen({
            applications,
            fertilizers,
            soilData,
            b_grazing_intention,
            cultivations,
        })
        console.log(result)

        // App1: 1000 * 5 * 1.0 / 1000 = 5
        // App2: 500 * 10 * 0.1 / 1000 = 0.5
        // Total: 5.5
        expect(result.normFilling).toBeCloseTo(5.5)
        expect(result.applicationFilling[0].normFilling).toBeCloseTo(5)
        expect(result.applicationFilling[1].normFilling).toBeCloseTo(0.5)
    })

    it("should use table11Mestcodes for nitrogen content if p_n_rt is 0", async () => {
        const applications: FertilizerApplication[] = [
            {
                p_app_id: "app1",
                b_id: "field1",
                p_app_date: "2025-05-01",
                p_app_amount: 1000,
                p_id_catalogue: "fert1",
            },
        ]
        const fertilizers: Fertilizer[] = [
            {
                p_id_catalogue: "fert1",
                p_n_rt: 0, // Nitrogen content not directly known
                p_type_rvo: "14", // Drijfmest rundvee (Table 11: 4.0 kg N/ton)
            },
        ]
        const soilData: CurrentSoilData[] = [] // Mocked
        const b_grazing_intention = true // Drijfmest graasdieren, met beweiding -> 0.45
        const cultivations: Cultivation[] = []

        const result = await calculateFertilizerApplicationFillingForNitrogen({
            applications,
            fertilizers,
            soilData,
            b_grazing_intention,
            cultivations,
        })

        // Expected: 1000 * 4.0 (from Table 11) * 0.45 (from Table 9) / 1000 = 1.8
        expect(result.normFilling).toBeCloseTo(1.8)
        expect(result.applicationFilling[0].normFilling).toBeCloseTo(1.8)
    })

    it("should throw an error if fertilizer cannot be found", async () => {
        const applications: FertilizerApplication[] = [
            {
                p_app_id: "app1",
                b_id: "field1",
                p_app_date: "2025-05-01",
                p_app_amount: 1000,
                p_id_catalogue: "nonExistentFert",
            },
        ]
        const fertilizers: Fertilizer[] = [] // Empty fertilizers array
        const soilData: CurrentSoilData[] = []
        const b_grazing_intention = false
        const cultivations: Cultivation[] = []

        await expect(() =>
            calculateFertilizerApplicationFillingForNitrogen({
                applications,
                fertilizers,
                soilData,
                b_grazing_intention,
                cultivations,
            }),
        ).rejects.toThrow(
            "Fertilizer nonExistentFert not found for application app1",
        )
    })

    it("should correctly apply bouwland logic for working coefficient", async () => {
        vi.mocked(getRegion).mockResolvedValue("klei") // Soil type for bouwland rule
        const applications: FertilizerApplication[] = [
            {
                p_app_id: "app1",
                b_id: "field1",
                p_app_date: "2025-10-15", // Sep 1 to Jan 31 period
                p_app_amount: 1000,
                p_id_catalogue: "fert1",
            },
        ]
        const fertilizers: Fertilizer[] = [
            {
                p_id_catalogue: "fert1",
                p_n_rt: 10, // 10 kg N per ton
                p_type_rvo: "10", // Vaste mest rundvee (onFarmProduced: true in table9, but our temp logic makes it false)
            },
        ]
        const soilData: CurrentSoilData[] = []
        const b_grazing_intention = false
        const cultivations: Cultivation[] = [
            {
                b_lu: "cult1",
                b_start: "2025-01-01",
                b_end: "2025-12-31",
                b_lu_catalogue: "nl_2014", // Bouwland
            },
        ]

        const result = await calculateFertilizerApplicationFillingForNitrogen({
            applications,
            fertilizers,
            soilData,
            b_grazing_intention,
            cultivations,
        })

        // For p_type_rvo "10" (Vaste mest rundvee), onFarmProduced: true in table9.
        // Our temporary logic `onFarmProduced = isDrijfmest` makes it `false`.
        // This means the `entry.onFarmProduced !== onFarmProduced` check will cause it to `continue`.
        // It will then fall through to the "Vaste mest van graasdieren aangevoerd" entry,
        // which has onFarmProduced: false.
        // For "bouwland op klei en veen, van 1 september t/m 31 januari", p_n_wcl is 0.3.
        // Expected: 1000 * 10 * 0.3 / 1000 = 3
        expect(result.normFilling).toBeCloseTo(3)
        expect(result.applicationFilling[0].normFilling).toBeCloseTo(3)
    })
})
