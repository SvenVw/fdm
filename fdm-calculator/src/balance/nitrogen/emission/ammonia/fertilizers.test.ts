import { describe, expect, it, vi } from "vitest"
import { calculateNitrogenEmissionViaAmmoniaByFertilizers } from "./fertilizers"
import type {
    CultivationDetail,
    FertilizerDetail,
    FieldInput,
} from "../../types"

describe("calculateNitrogenEmissionViaAmmoniaByFertilizers", () => {
    const mockCultivationDetailsMap = new Map<string, CultivationDetail>()
    mockCultivationDetailsMap.set("grassland-cultivation", {
        b_lu_catalogue: "grassland-cultivation",
        b_lu_croprotation: "grass",
        b_lu_yield: 0,
        b_lu_hi: 0,
        b_lu_n_harvestable: 0,
        b_lu_n_residue: 0,
        b_n_fixation: 0,
    })
    mockCultivationDetailsMap.set("cropland-cultivation", {
        b_lu_catalogue: "cropland-cultivation",
        b_lu_croprotation: "crop",
        b_lu_yield: 0,
        b_lu_hi: 0,
        b_lu_n_harvestable: 0,
        b_lu_n_residue: 0,
        b_n_fixation: 0,
    })

    const mockFertilizerDetailsMap = new Map<string, FertilizerDetail>()
    mockFertilizerDetailsMap.set("mineral-fertilizer-1", {
        p_id_catalogue: "mineral-fertilizer-1",
        p_type: "mineral",
        p_n_rt: 100,
        p_no3_rt: 50,
        p_nh4_rt: 50,
        p_s_rt: 10,
        p_ef_nh3: undefined,
        // p_inhibitor: false,
    })
    mockFertilizerDetailsMap.set("mineral-fertilizer-2", {
        p_id_catalogue: "mineral-fertilizer-2",
        p_type: "mineral",
        p_n_rt: 80,
        p_no3_rt: 0,
        p_nh4_rt: 0,
        p_s_rt: 0,
        p_ef_nh3: 0.15, // Predefined emission factor
        // p_inhibitor: false,
    })
    mockFertilizerDetailsMap.set("manure-fertilizer", {
        p_id_catalogue: "manure-fertilizer",
        p_type: "manure",
        p_n_rt: 0,
        p_no3_rt: 0,
        p_nh4_rt: 20,
        p_s_rt: 0,
        p_ef_nh3: undefined,
        // p_inhibitor: false,
    })
    mockFertilizerDetailsMap.set("compost-fertilizer", {
        p_id_catalogue: "compost-fertilizer",
        p_type: "compost",
        p_n_rt: 0,
        p_no3_rt: 0,
        p_nh4_rt: 15,
        p_s_rt: 0,
        p_ef_nh3: undefined,
        // p_inhibitor: false,
    })
    mockFertilizerDetailsMap.set("other-fertilizer", {
        p_id_catalogue: "other-fertilizer",
        p_type: "other",
        p_n_rt: 0,
        p_no3_rt: 0,
        p_nh4_rt: 10,
        p_s_rt: 0,
        p_ef_nh3: undefined,
        // p_inhibitor: false,
    })

    const mockCultivations: FieldInput["cultivations"] = [
        {
            b_lu: "cult-1",
            b_lu_catalogue: "grassland-cultivation",
            b_lu_start: new Date("2024-01-01"),
            b_lu_end: new Date("2024-02-29"), // Ends before cropland starts
            m_cropresidue: undefined,
        },
        {
            b_lu: "cult-2",
            b_lu_catalogue: "cropland-cultivation",
            b_lu_start: new Date("2024-03-01"),
            b_lu_end: new Date("2024-10-31"),
            m_cropresidue: undefined,
        },
    ]

    it("should calculate total ammonia emission for mineral fertilizers with calculated emission factor", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-1",
                p_id_catalogue: "mineral-fertilizer-1",
                p_app_amount: 1000, // g
                p_app_date: new Date("2024-05-01"),
                p_app_method: "broadcasting",
                p_name_nl: "Mineral 1",
                p_id: "min1",
            },
        ]

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // Expected emission factor for mineral-fertilizer-1:
        // p_n_org = 100 - 50 - 50 = 0
        // a = 0 (since p_n_org is 0)
        // b = 50 * 10 * -4.308e-5 = -0.02154
        // c = 50^2 * 2.498e-4 = 2500 * 0.0002498 = 0.6245
        // EF = 0 - 0.02154 + 0.6245 = 0.60296
        // Emission = 1000 * 100 * 0.60296 / 100 / 1000 * -1 = -0.60296 kg N
        expect(result.mineral.total.toFixed(5)).toBe("-0.60296")
        expect(result.total.toFixed(5)).toBe("-0.60296")
        expect(result.mineral.applications[0].value.toFixed(5)).toBe("-0.60296")
    })

    it("should calculate total ammonia emission for mineral fertilizers with predefined emission factor", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-2",
                p_id_catalogue: "mineral-fertilizer-2",
                p_app_amount: 500, // g
                p_app_date: new Date("2024-05-01"),
                p_app_method: "broadcasting",
                p_name_nl: "Mineral 2",
                p_id: "min2",
            },
        ]

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // Emission = 500 * 80 * 0.15 / 100 / 1000 * -1 = -0.06 kg N
        expect(result.mineral.total.toFixed(2)).toBe("-0.06")
        expect(result.total.toFixed(2)).toBe("-0.06")
        expect(result.mineral.applications[0].value.toFixed(2)).toBe("-0.06")
    })

    it("should calculate total ammonia emission for manure fertilizers on grassland", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-3",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 2000, // g
                p_app_date: new Date("2024-02-01"), // Only grassland active
                p_app_method: "broadcasting",
                p_name_nl: "Manure 1",
                p_id: "man1",
            },
        ]

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // Manure EF for broadcasting on grassland = 0.68
        // Emission = 2000 * 20 * 0.68 / 1000 * -1 = -27.2 kg N
        expect(result.manure.total.toFixed(1)).toBe("-27.2")
        expect(result.total.toFixed(1)).toBe("-27.2")
        expect(result.manure.applications[0].value.toFixed(1)).toBe("-27.2")
    })

    it("should calculate total ammonia emission for compost fertilizers on cropland", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-4",
                p_id_catalogue: "compost-fertilizer",
                p_app_amount: 1500, // g
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "incorporation",
                p_name_nl: "Compost 1",
                p_id: "comp1",
            },
        ]

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // Compost EF for incorporation on cropland = 0.22
        // Emission = 1500 * 15 * 0.22 / 1000 * -1 = -4.95 kg N
        expect(result.compost.total.toFixed(2)).toBe("-4.95")
        expect(result.total.toFixed(2)).toBe("-4.95")
        expect(result.compost.applications[0].value.toFixed(2)).toBe("-4.95")
    })

    it("should calculate total ammonia emission for other fertilizers on bare soil", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-5",
                p_id_catalogue: "other-fertilizer",
                p_app_amount: 1000, // g
                p_app_date: new Date("2025-01-01"), // Outside any cultivation, so bare soil
                p_app_method: "slotted coulter",
                p_name_nl: "Other 1",
                p_id: "other1",
            },
        ]

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // Other EF for slotted coulter on bare soil = 0.3
        // Emission = 1000 * 10 * 0.3 / 1000 * -1 = -3 kg N
        expect(result.other.total.toFixed(0)).toBe("-3")
        expect(result.total.toFixed(0)).toBe("-3")
        expect(result.other.applications[0].value.toFixed(0)).toBe("-3")
    })

    it("should aggregate emissions from multiple fertilizer types", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-1",
                p_id_catalogue: "mineral-fertilizer-1",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"),
                p_app_method: "broadcasting",
                p_name_nl: "Mineral 1",
                p_id: "min1",
            },
            {
                p_app_id: "app-3",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 2000,
                p_app_date: new Date("2024-05-01"), // Cropland active, so cropland EF
                p_app_method: "broadcasting",
                p_name_nl: "Manure 1",
                p_id: "man1",
            },
            {
                p_app_id: "app-4",
                p_id_catalogue: "compost-fertilizer",
                p_app_amount: 1500,
                p_app_date: new Date("2024-05-01"),
                p_app_method: "incorporation",
                p_name_nl: "Compost 1",
                p_id: "comp1",
            },
        ]

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // Mineral: -0.60296
        // Manure (broadcasting on cropland): 2000 * 20 * 0.69 / 1000 * -1 = -27.6 kg N
        // Compost: -4.95
        // Total = -0.60296 - 27.6 - 4.95 = -33.15296
        expect(result.total.toFixed(5)).toBe("-33.15296")
        expect(result.mineral.total.toFixed(5)).toBe("-0.60296")
        expect(result.manure.total.toFixed(1)).toBe("-27.6")
        expect(result.compost.total.toFixed(2)).toBe("-4.95")
        expect(result.other.total.toFixed(0)).toBe("0")
    })

    it("should throw an error if fertilizerDetail is missing", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-missing",
                p_id_catalogue: "non-existent-fertilizer",
                p_app_amount: 100,
                p_app_date: new Date("2024-05-01"),
                p_app_method: "broadcasting",
                p_name_nl: "Missing",
                p_id: "missing",
            },
        ]

        expect(() =>
            calculateNitrogenEmissionViaAmmoniaByFertilizers(
                mockCultivations,
                fertilizerApplications,
                mockCultivationDetailsMap,
                mockFertilizerDetailsMap,
            ),
        ).toThrow("Fertilizer application app-missing has no fertilizerDetails")
    })

    // TODO: implement p_inhibitor for fertilizers
    // it("should calculate mineral ammonia emission factor correctly with inhibitor", () => {
    //     const fertilizerApplications: FieldInput["fertilizerApplications"] = [
    //         {
    //             p_app_id: "app-6",
    //             p_id_catalogue: "mineral-fertilizer-inhibitor",
    //             p_app_amount: 1000,
    //             p_app_date: new Date("2024-05-01"),
    //             p_app_method: "broadcasting",
    //             p_name_nl: "Mineral Inhibitor",
    //             p_id: "min-inh",
    //         },
    //     ]
    //     mockFertilizerDetailsMap.set("mineral-fertilizer-inhibitor", {
    //         p_id_catalogue: "mineral-fertilizer-inhibitor",
    //         p_type: "mineral",
    //         p_n_rt: 100,
    //         p_no3_rt: 20,
    //         p_nh4_rt: 30,
    //         p_s_rt: 5,
    //         p_ef_nh3: undefined,
    //         // p_inhibitor: true,
    //     })

    //     const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
    //         mockCultivations,
    //         fertilizerApplications,
    //         mockCultivationDetailsMap,
    //         mockFertilizerDetailsMap,
    //     )

    //     // p_n_org = 100 - 20 - 30 = 50
    //     // a = 50^2 * 3.166e-5 = 2500 * 0.00003166 = 0.07915
    //     // b = 20 * 5 * -4.308e-5 = 100 * -0.00004308 = -0.004308
    //     // c = 30^2 * 2.498e-4 = 900 * 0.0002498 = 0.22482
    //     // EF = 0.07915 - 0.004308 + 0.22482 = 0.299662
    //     // Emission = 1000 * 100 * 0.299662 / 100 / 1000 * -1 = -0.299662 kg N
    //     expect(result.mineral.total.toFixed(6)).toBe("-0.299662")
    // })

    it("should calculate mineral ammonia emission factor correctly without inhibitor", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-7",
                p_id_catalogue: "mineral-fertilizer-no-inhibitor",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"),
                p_app_method: "broadcasting",
                p_name_nl: "Mineral No Inhibitor",
                p_id: "min-no-inh",
            },
        ]
        mockFertilizerDetailsMap.set("mineral-fertilizer-no-inhibitor", {
            p_id_catalogue: "mineral-fertilizer-no-inhibitor",
            p_type: "mineral",
            p_n_rt: 100,
            p_no3_rt: 20,
            p_nh4_rt: 30,
            p_s_rt: 5,
            p_ef_nh3: undefined,
            // p_inhibitor: false,
        })

        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )

        // p_n_org = 100 - 20 - 30 = 50
        // a = 50^2 * 7.021e-5 = 2500 * 0.00007021 = 0.175525
        // b = 20 * 5 * -4.308e-5 = 100 * -0.00004308 = -0.004308
        // c = 30^2 * 2.498e-4 = 900 * 0.0002498 = 0.22482
        // EF = 0.175525 - 0.004308 + 0.22482 = 0.396037
        // Emission = 1000 * 100 * 0.396037 / 100 / 1000 * -1 = -0.396037 kg N
        expect(result.mineral.total.toFixed(6)).toBe("-0.396037")
    })

    it("should calculate manure ammonia emission factor correctly for grassland - narrowband", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-8",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-02-01"), // Grassland only
                p_app_method: "narrowband",
                p_name_nl: "Manure Narrowband",
                p_id: "man-nb",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.264 / 1000 * -1 = -5.28 kg N
        expect(result.manure.total.toFixed(2)).toBe("-5.28")
    })

    it("should calculate manure ammonia emission factor correctly for grassland - slotted coulter", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-9",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-02-01"), // Grassland only
                p_app_method: "slotted coulter",
                p_name_nl: "Manure Slotted Coulter",
                p_id: "man-sc",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.217 / 1000 * -1 = -4.34 kg N
        expect(result.manure.total.toFixed(2)).toBe("-4.34")
    })

    it("should calculate manure ammonia emission factor correctly for grassland - shallow injection", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-10",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-02-01"), // Grassland only
                p_app_method: "shallow injection",
                p_name_nl: "Manure Shallow Injection",
                p_id: "man-si",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.17 / 1000 * -1 = -3.40 kg N
        expect(result.manure.total.toFixed(2)).toBe("-3.40")
    })

    it("should calculate manure ammonia emission factor correctly for cropland - incorporation 2 tracks", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-11",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "incorporation 2 tracks",
                p_name_nl: "Manure Inc 2 Tracks",
                p_id: "man-inc2",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.46 / 1000 * -1 = -9.20 kg N
        expect(result.manure.total.toFixed(2)).toBe("-9.20")
    })

    it("should calculate manure ammonia emission factor correctly for cropland - narrowband", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-12",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "narrowband",
                p_name_nl: "Manure Narrowband",
                p_id: "man-nb-crop",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.36 / 1000 * -1 = -7.20 kg N
        expect(result.manure.total.toFixed(2)).toBe("-7.20")
    })

    it("should calculate manure ammonia emission factor correctly for cropland - slotted coulter", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-13",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "slotted coulter",
                p_name_nl: "Manure Slotted Coulter",
                p_id: "man-sc-crop",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.30 / 1000 * -1 = -6.00 kg N
        expect(result.manure.total.toFixed(2)).toBe("-6.00")
    })

    it("should calculate manure ammonia emission factor correctly for cropland - shallow injection", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-14",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "shallow injection",
                p_name_nl: "Manure Shallow Injection",
                p_id: "man-si-crop",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.24 / 1000 * -1 = -4.80 kg N
        expect(result.manure.total.toFixed(2)).toBe("-4.80")
    })

    it("should calculate manure ammonia emission factor correctly for cropland - incorporation", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-15",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "incorporation",
                p_name_nl: "Manure Incorporation",
                p_id: "man-inc",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.22 / 1000 * -1 = -4.40 kg N
        expect(result.manure.total.toFixed(2)).toBe("-4.40")
    })

    it("should calculate manure ammonia emission factor correctly for bare soil - incorporation 2 tracks", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-16",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2025-01-01"), // Bare soil
                p_app_method: "incorporation 2 tracks",
                p_name_nl: "Manure Inc 2 Tracks Bare",
                p_id: "man-inc2-bare",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.46 / 1000 * -1 = -9.20 kg N
        expect(result.manure.total.toFixed(2)).toBe("-9.20")
    })

    it("should calculate manure ammonia emission factor correctly for bare soil - narrowband", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-17",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2025-01-01"), // Bare soil
                p_app_method: "narrowband",
                p_name_nl: "Manure Narrowband Bare",
                p_id: "man-nb-bare",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.36 / 1000 * -1 = -7.20 kg N
        expect(result.manure.total.toFixed(2)).toBe("-7.20")
    })

    it("should calculate manure ammonia emission factor correctly for bare soil - slotted coulter", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-18",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2025-01-01"), // Bare soil
                p_app_method: "slotted coulter",
                p_name_nl: "Manure Slotted Coulter Bare",
                p_id: "man-sc-bare",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.30 / 1000 * -1 = -6.00 kg N
        expect(result.manure.total.toFixed(2)).toBe("-6.00")
    })

    it("should calculate manure ammonia emission factor correctly for bare soil - shallow injection", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-19",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2025-01-01"), // Bare soil
                p_app_method: "shallow injection",
                p_name_nl: "Manure Shallow Injection Bare",
                p_id: "man-si-bare",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.25 / 1000 * -1 = -5.00 kg N
        expect(result.manure.total.toFixed(2)).toBe("-5.00")
    })

    it("should calculate manure ammonia emission factor correctly for bare soil - incorporation", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-20",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2025-01-01"), // Bare soil
                p_app_method: "incorporation",
                p_name_nl: "Manure Incorporation Bare",
                p_id: "man-inc-bare",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // Emission = 1000 * 20 * 0.22 / 1000 * -1 = -4.40 kg N
        expect(result.manure.total.toFixed(2)).toBe("-4.40")
    })

    it("should handle unsupported application method for grassland", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-21",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-02-01"), // Grassland only
                p_app_method: "unsupported-method",
                p_name_nl: "Manure Unsupported",
                p_id: "man-unsupported",
            },
        ]
        const consoleWarnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {})
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        expect(result.manure.total.toFixed(0)).toBe("0")
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "Unsupported application method unsupported-method for Manure Unsupported (man-unsupported) on grassland",
        )
        consoleWarnSpy.mockRestore()
    })

    it("should handle unsupported application method for cropland", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-22",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-05-01"), // Cropland active
                p_app_method: "unsupported-method",
                p_name_nl: "Manure Unsupported",
                p_id: "man-unsupported-crop",
            },
        ]
        const consoleWarnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {})
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        expect(result.manure.total.toFixed(0)).toBe("0")
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "Unsupported application method unsupported-method for Manure Unsupported (man-unsupported-crop) for cropland",
        )
        consoleWarnSpy.mockRestore()
    })

    it("should handle unsupported application method for bare soil", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-23",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2025-01-01"), // Bare soil
                p_app_method: "unsupported-method",
                p_name_nl: "Manure Unsupported",
                p_id: "man-unsupported-bare",
            },
        ]
        const consoleWarnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {})
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        expect(result.manure.total.toFixed(0)).toBe("0")
        expect(consoleWarnSpy).toHaveBeenCalledWith(
            "Unsupported application method unsupported-method for Manure Unsupported (man-unsupported-bare) for bare soil",
        )
        consoleWarnSpy.mockRestore()
    })

    it("should correctly identify grassland cultivation based on date range", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-24",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-02-01"), // Only grassland active
                p_app_method: "broadcasting",
                p_name_nl: "Manure Grassland Date",
                p_id: "man-grass-date",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // EF for broadcasting on grassland = 0.68
        // Emission = 1000 * 20 * 0.68 / 1000 * -1 = -13.6 kg N
        expect(result.manure.total.toFixed(1)).toBe("-13.6")
    })

    it("should correctly identify cropland cultivation based on date range", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-25",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2024-04-01"), // Only cropland active
                p_app_method: "broadcasting",
                p_name_nl: "Manure Cropland Date",
                p_id: "man-crop-date",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // EF for broadcasting on cropland = 0.69
        // Emission = 1000 * 20 * 0.69 / 1000 * -1 = -13.8 kg N
        expect(result.manure.total.toFixed(1)).toBe("-13.8")
    })

    it("should correctly identify bare soil when no cultivation is active", () => {
        const fertilizerApplications: FieldInput["fertilizerApplications"] = [
            {
                p_app_id: "app-26",
                p_id_catalogue: "manure-fertilizer",
                p_app_amount: 1000,
                p_app_date: new Date("2023-01-01"), // Outside any cultivation
                p_app_method: "broadcasting",
                p_name_nl: "Manure Bare Soil Date",
                p_id: "man-bare-date",
            },
        ]
        const result = calculateNitrogenEmissionViaAmmoniaByFertilizers(
            mockCultivations,
            fertilizerApplications,
            mockCultivationDetailsMap,
            mockFertilizerDetailsMap,
        )
        // EF for broadcasting on bare soil = 0.69
        // Emission = 1000 * 20 * 0.69 / 1000 * -1 = -13.8 kg N
        expect(result.manure.total.toFixed(1)).toBe("-13.8")
    })
})
