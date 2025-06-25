import { describe, it, expect } from "vitest"
import {
    calculateAmmoniaEmissionsByManure,
    determineManureAmmoniaEmissionFactor,
} from "./manure"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
} from "../../types"
import type { FertilizerApplication } from "@svenvw/fdm-core"

describe("calculateAmmoniaEmissionsByManure", () => {
    it("should return total 0 and empty applications array if no fertilizer applications are provided", () => {
        const cultivations: FieldInput["cultivations"] = []
        const fertilizerApplications: FieldInput["fertilizerApplications"] = []
        const cultivationDetailsMap = new Map<string, CultivationDetail>()
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        const result = calculateAmmoniaEmissionsByManure(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBe(0)
        expect(result.applications).toEqual([])
    })

    it("should calculate ammonia emissions for manure applications on grassland", () => {
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cult1",
                b_lu_catalogue: "grassland_type",
                b_lu_start: new Date("2023-01-01"),
                b_lu_end: new Date("2023-12-31"),
                m_cropresidue: null,
            },
        ]
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "manure1",
                p_name_nl: "meststof1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
            {
                p_app_id: "app2",
                p_id_catalogue: "manure2",
                p_name_nl: "meststof2",
                p_app_amount: 500,
                p_app_date: new Date("2023-07-01"),
                p_app_method: "narrowband",
                p_id: "app2",
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>([
            [
                "grassland_type",
                {
                    b_lu_catalogue: "grassland_type",
                    b_lu_croprotation: "grass",
                    b_lu_yield: null,
                    b_lu_hi: null,
                    b_lu_n_harvestable: null,
                    b_lu_n_residue: null,
                    b_n_fixation: null,
                },
            ],
        ])
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "manure1",
                {
                    p_id_catalogue: "manure1",
                    p_type: "manure",
                    p_nh4_rt: 0.5,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
            [
                "manure2",
                {
                    p_id_catalogue: "manure2",
                    p_type: "manure",
                    p_nh4_rt: 0.4,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
        ])

        const result = calculateAmmoniaEmissionsByManure(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

        // Expected values:
        // app1: 1000 * 0.5 * 0.68 / 1000 = 0.34 kg N (broadcasting on grassland)
        // app2: 500 * 0.4 * 0.264 / 1000 = 0.0528 kg N (narrowband on grassland)
        // Total: 0.34 + 0.0528 = 0.3928 kg N

        expect(result.total.toNumber()).toBeCloseTo(0.3928)
        expect(result.applications.length).toBe(2)
        expect(result.applications[0].id).toBe("app1")
        expect(result.applications[0].value.toNumber()).toBeCloseTo(0.34)
        expect(result.applications[1].id).toBe("app2")
        expect(result.applications[1].value.toNumber()).toBeCloseTo(0.0528)
    })

    it("should return 0 for applications that are not manure type", () => {
        const cultivations: FieldInput["cultivations"] = []
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "mineral1",
                p_name_nl: "meststof1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>()
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>([
            [
                "mineral1",
                {
                    p_id_catalogue: "mineral1",
                    p_type: "mineral",
                    p_nh4_rt: 0.8,
                    p_n_rt: null,
                    p_no3_rt: null,
                    p_s_rt: null,
                    p_ef_nh3: null,
                },
            ],
        ])

        const result = calculateAmmoniaEmissionsByManure(
            cultivations,
            fertilizerApplications,
            cultivationDetailsMap,
            fertilizerDetailsMap,
        )

        expect(result.total.toNumber()).toBe(0)
        expect(result.applications.length).toBe(1)
        expect(result.applications[0].id).toBe("app1")
        expect(result.applications[0].value.toNumber()).toBe(0)
    })

    it("should throw an error if fertilizerDetail is missing for an application", () => {
        const cultivations: FieldInput["cultivations"] = []
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app1",
                p_id_catalogue: "nonExistent",
                p_name_nl: "meststof1",
                p_app_amount: 1000,
                p_app_date: new Date("2023-06-01"),
                p_app_method: "broadcasting",
                p_id: "app1",
            },
        ]
        const cultivationDetailsMap = new Map<string, CultivationDetail>()
        const fertilizerDetailsMap = new Map<string, FertilizerDetail>()

        expect(() =>
            calculateAmmoniaEmissionsByManure(
                cultivations,
                fertilizerApplications,
                cultivationDetailsMap,
                fertilizerDetailsMap,
            ),
        ).toThrowError("Fertilizer application app1 has no fertilizerDetails")
    })
})

describe("determineManureAmmoniaEmissionFactor", () => {
    const cultivationDetailsMap = new Map<string, CultivationDetail>([
        [
            "grassland_type",
            {
                b_lu_catalogue: "grassland_type",
                b_lu_croprotation: "grass",
                b_lu_yield: null,
                b_lu_hi: null,
                b_lu_n_harvestable: null,
                b_lu_n_residue: null,
                b_n_fixation: null,
            },
        ],
        [
            "cropland_type",
            {
                b_lu_catalogue: "cropland_type",
                b_lu_croprotation: "cropland",
                b_lu_yield: null,
                b_lu_hi: null,
                b_lu_n_harvestable: null,
                b_lu_n_residue: null,
                b_n_fixation: null,
            },
        ],
    ])

    it("should return correct factor for grassland - broadcasting", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "broadcasting",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cult1",
                b_lu_catalogue: "grassland_type",
                b_lu_start: new Date("2023-01-01"),
                b_lu_end: new Date("2023-12-31"),
                m_cropresidue: null,
            },
        ]
        expect(
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ).toNumber(),
        ).toBe(0.68)
    })

    it("should return correct factor for grassland - narrowband", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "narrowband",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cult1",
                b_lu_catalogue: "grassland_type",
                b_lu_start: new Date("2023-01-01"),
                b_lu_end: new Date("2023-12-31"),
                m_cropresidue: null,
            },
        ]
        expect(
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ).toNumber(),
        ).toBe(0.264)
    })

    it("should return correct factor for cropland - narrowband", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "narrowband",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cult1",
                b_lu_catalogue: "cropland_type",
                b_lu_start: new Date("2023-01-01"),
                b_lu_end: new Date("2023-12-31"),
                m_cropresidue: null,
            },
        ]
        expect(
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ).toNumber(),
        ).toBe(0.36)
    })

    it("should return correct factor for bare soil - broadcasting", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "broadcasting",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = [] // No cultivations means bare soil
        expect(
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ).toNumber(),
        ).toBe(0.69)
    })

    it("should throw error for unsupported method on grassland", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "unsupported_method",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cult1",
                b_lu_catalogue: "grassland_type",
                b_lu_start: new Date("2023-01-01"),
                b_lu_end: new Date("2023-12-31"),
                m_cropresidue: null,
            },
        ]
        expect(() =>
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ),
        ).toThrowError(
            "Unsupported application method unsupported_method for meststof1 (app1) on grassland",
        )
    })

    it("should throw error for unsupported method on cropland", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "unsupported_method",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = [
            {
                b_lu: "cult1",
                b_lu_catalogue: "cropland_type",
                b_lu_start: new Date("2023-01-01"),
                b_lu_end: new Date("2023-12-31"),
                m_cropresidue: null,
            },
        ]
        expect(() =>
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ),
        ).toThrowError(
            "Unsupported application method unsupported_method for meststof1 (app1)  for cropland",
        )
    })

    it("should throw error for unsupported method on bare soil", () => {
        const fertilizerApplication: FertilizerApplication = {
            p_app_id: "app1",
            p_id_catalogue: "manure1",
            p_name_nl: "meststof1",
            p_app_amount: 1000,
            p_app_date: new Date("2023-06-01"),
            p_app_method: "unsupported_method",
            p_id: "app1",
        }
        const cultivations: FieldInput["cultivations"] = []
        expect(() =>
            determineManureAmmoniaEmissionFactor(
                fertilizerApplication,
                cultivations,
                cultivationDetailsMap,
            ),
        ).toThrowError(
            "Unsupported application method unsupported_method for meststof1 (app1) for bare soil",
        )
    })
})
