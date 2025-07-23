import { describe, it, expect } from "vitest"
import {
    getNL2025StikstofGebruiksNorm,
    getRegion,
    isFieldInNVGebied,
} from "./stikstofgebruiksnorm"
import type { Field } from "@svenvw/fdm-core"
import type { NL2025NormsInput, NL2025NormsInputForCultivation } from "./types"

describe("stikstofgebruiksnorm helpers", () => {
    it("should correctly identify a field in an NV Gebied", async () => {
        const centroidInNV = [5.654709, 51.987605]
        // Known point in NV Gebied
        const result = await isFieldInNVGebied(centroidInNV)
        expect(result).toBe(true)
    })

    it("should correctly identify a field not in an NV Gebied", async () => {
        const centroidOutsideNV = [5.1, 52.1] // Known point outside NV Gebied
        const result = await isFieldInNVGebied(centroidOutsideNV)
        expect(result).toBe(false)
    })

    it("should correctly identify the region for a field", async () => {
        const centroidInKlei = [5.64188724, 51.977587] // Known point in Klei
        const region = await getRegion(centroidInKlei)
        expect(region).toBe("klei")
    })
})

describe("getNL2025StikstofGebruiksNorm", () => {
    it("should return the correct norm for grasland", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571],
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_265",
                    b_lu_start: new Date(2025, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(345)
        expect(result.normSource).toContain("Grasland")
    })

    it("should return the correct norm for potatoes", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571],
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2015", // Pootaardappel
                    b_lu_variety: "Adora",
                    b_lu_start: new Date(2025, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(140)
        expect(result.normSource).toContain("Akkerbouwgewas, pootaardappelen")
    })

    it("should apply 0 korting if winterteelt is present in zand_nwc region (hoofdteelt 2025)", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_265", // Grasland (is_winterteelt: true)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)

        // The base norm for Grasland in zand_nwc is 200 in nv-gebied. With winterteelt, korting should be 0.
        expect(result.normValue).toBe(200)
        expect(result.normSource).toContain(
            "Grasland. Geen korting: winterteelt aanwezig",
        )
    })

    it("should apply 0 korting if vanggewas is present (sown <= Oct 1st)", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2025 hoofdteelt)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 9, 1), // Oct 1st, 2024
                    b_lu_end: new Date(2024, 11, 31),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc is 108. With vanggewas sown <= Oct 1st, korting should be 0.
        expect(result.normValue).toBe(108)
        expect(result.normSource).toContain(
            "Geen korting: vanggewas gezaaid uiterlijk 1 oktober",
        )
    })

    it("should apply 5 korting if vanggewas is present (sown Oct 2nd - Oct 14th)", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2025 hoofdteelt)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 9, 5), // Oct 5th, 2024
                    b_lu_end: new Date(2024, 11, 31),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With vanggewas sown Oct 2-14, korting should be 5.
        expect(result.normValue).toBe(103) // 108 - 5
        expect(result.normSource).toContain(
            "Korting: 5kg N/ha, vanggewas gezaaid 2 t/m 14 oktober",
        )
    })

    it("should apply 10 korting if vanggewas is present (sown Oct 15th - Oct 31st)", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2025 hoofdteelt)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 9, 20), // Oct 20th, 2024
                    b_lu_end: new Date(2024, 11, 31),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With vanggewas sown Oct 15-31, korting should be 10.
        expect(result.normValue).toBe(98) // 108 - 10
        expect(result.normSource).toContain(
            "Korting: 10kg N/ha, vanggewas gezaaid 15 t/m 31 oktober",
        )
    })

    it("should apply 20 korting if vanggewas is present (sown Nov 1st or later)", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2025 hoofdteelt)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 10, 1), // Nov 1st, 2024
                    b_lu_end: new Date(2024, 11, 31),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With vanggewas sown Nov 1st+, korting should be 20.
        expect(result.normValue).toBe(88) // 108 - 20
        expect(result.normSource).toContain(
            "Korting: 20kg N/ha, vanggewas gezaaid op of na 1 november",
        )
    })

    it("should apply 20 korting if no winterteelt or vanggewas is present in zand_nwc region", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2025 hoofdteelt)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_234", // Zomertarwe (not winterteelt or vanggewas)
                    b_lu_start: new Date(2024, 5, 1),
                    b_lu_end: new Date(2024, 8, 1),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With no exception, korting should be 20.
        expect(result.normValue).toBe(88) // 108 - 20
        expect(result.normSource).toContain(
            "Korting: 20kg N/ha, geen vanggewas of te laat gezaaid",
        )
    })

    it("should not apply korting if region is not sandy or loess, even without winterteelt/vanggewas", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.648307588666836, 51.96484772224782], // This centroid is in 'klei'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2025 hoofdteelt)
                    b_lu_start: new Date(2025, 0, 1),
                    b_lu_end: new Date(2025, 5, 1),
                } as Partial<NL2025NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_234", // Zomertarwe (not winterteelt or vanggewas)
                    b_lu_start: new Date(2024, 5, 1),
                    b_lu_end: new Date(2024, 8, 1),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in klei is 135. Korting should not apply in non-sandy/loess regions.
        expect(result.normValue).toBe(135)
        expect(result.normSource).toContain(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad.",
        )
    })
})
