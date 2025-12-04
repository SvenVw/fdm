import type { Field } from "@svenvw/fdm-core"
import { describe, expect, it } from "vitest"
import { calculateNL2026StikstofGebruiksNorm } from "./stikstofgebruiksnorm"
import type { NL2026NormsInput, NL2026NormsInputForCultivation } from "./types"

describe(" calculateNL2026StikstofGebruiksNorm", () => {
    it("should return the correct norm for grasland (beweiden)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: true },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571],
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_265",
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(345)
        expect(result.normSource).toEqual("Grasland (beweiden).")
    })

    it("should return the correct norm for grasland (volledig maaien)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571],
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_265",
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(385)
        expect(result.normSource).toEqual("Grasland (volledig maaien).")
    })

    it("should return the correct norm for potatoes", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571],
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2015", // Pootaardappel
                    b_lu_variety: "Adora",
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(140)
        expect(result.normSource).toEqual(
            "Akkerbouwgewas, pootaardappelen (hoge norm).",
        )
    })

    it("should apply 0 korting if winterteelt is present in zand_nwc region (hoofdteelt 2026)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: true },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_265", // Grasland (is_winterteelt: true)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)

        // The base norm for Grasland in zand_nwc is 200 in nv-gebied. With winterteelt, korting should be 0.
        expect(result.normValue).toBe(200)
        expect(result.normSource).toEqual(
            "Grasland (beweiden). Geen korting: winterteelt aanwezig",
        )
    })

    it("should apply 0 korting if vanggewas is present (sown <= Oct 1st)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2026 hoofdteelt)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 9, 1), // Oct 1st, 2024
                    b_lu_end: new Date(2026, 1, 31),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc is 108. With vanggewas sown <= Oct 1st, korting should be 0.
        expect(result.normValue).toBe(108)
        expect(result.normSource).toEqual(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad. Geen korting: vanggewas gezaaid uiterlijk 1 oktober",
        )
    })

    it("should apply 5 korting if vanggewas is present (sown Oct 2nd - Oct 14th)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2026 hoofdteelt)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 9, 5), // Oct 5th, 2024
                    b_lu_end: new Date(2026, 1, 31),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With vanggewas sown Oct 2-14, korting should be 5.
        expect(result.normValue).toBe(103) // 108 - 5
        expect(result.normSource).toEqual(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad. Korting: 5kg N/ha, vanggewas gezaaid tussen 2 t/m 14 oktober",
        )
    })

    it("should apply 10 korting if vanggewas is present (sown Oct 15th - Oct 31st)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2026 hoofdteelt)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 9, 20), // Oct 20th, 2024
                    b_lu_end: new Date(2026, 1, 31),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With vanggewas sown Oct 15-31, korting should be 10.
        expect(result.normValue).toBe(98) // 108 - 10
        expect(result.normSource).toEqual(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad. Korting: 10kg N/ha, vanggewas gezaaid tussen 15 t/m 31 oktober",
        )
    })

    it("should apply 20 korting if vanggewas is present (sown Nov 1st or later)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2026 hoofdteelt)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_428", // Gele mosterd (is_vanggewas: true)
                    b_lu_start: new Date(2024, 10, 1), // Nov 1st, 2024
                    b_lu_end: new Date(2026, 1, 31),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With vanggewas sown Nov 1st+, korting should be 20.
        expect(result.normValue).toBe(88) // 108 - 20
        expect(result.normSource).toEqual(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad. Korting: 20kg N/ha, vanggewas gezaaid op of na 1 november",
        )
    })

    it("should apply 20 korting if no winterteelt or vanggewas is present in zand_nwc region", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.656346970245633, 51.987872886419524], // This centroid is in 'zand_nwc'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2026 hoofdteelt)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_234", // Zomertarwe (not winterteelt or vanggewas)
                    b_lu_start: new Date(2024, 5, 1),
                    b_lu_end: new Date(2024, 8, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in zand_nwc in nv-gebied is 108. With no exception, korting should be 20.
        expect(result.normValue).toBe(88) // 108 - 20
        expect(result.normSource).toEqual(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad. Korting: 20kg N/ha: geen vanggewas of winterteelt",
        )
    })

    it("should not apply korting if region is not sandy or loess, even without winterteelt/vanggewas", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.648307588666836, 51.96484772224782], // This centroid is in 'klei'
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2751", // Vruchtgewassen (2026 hoofdteelt)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_234", // Zomertarwe (not winterteelt or vanggewas)
                    b_lu_start: new Date(2024, 5, 1),
                    b_lu_end: new Date(2026, 1, 31),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        // The base norm for Vruchtgewassen in klei is 135. Korting should not apply in non-sandy/loess regions.
        expect(result.normValue).toBe(135)
        expect(result.normSource).toEqual(
            "Vruchtgewassen, Landbouwstambonen, rijp zaad.",
        )
    })

    it("should return the correct norm for Gras voor industriële verwerking (eerste jaar)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_3805", // Gras voor industriële verwerking
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(30)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Gras voor industriële verwerking (inzaai in september en eerste jaar).",
        )
    })

    it("should return the correct norm for Gras voor industriële verwerking (volgende jaren)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_3805", // Gras voor industriële verwerking (current year)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_3805", // Gras voor industriële verwerking (previous year)
                    b_lu_start: new Date(2024, 0, 1),
                    b_lu_end: new Date(2024, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(310)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Gras voor industriële verwerking (inzaai voor 15 mei en volgende jaren).",
        )
    })

    it("should return the correct norm for Graszaad, Engels raaigras (1e jaars)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_6750", // Graszaad, Engels raaigras
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(165)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Graszaad, Engels raaigras (1e jaars).",
        )
    })

    it("should return the correct norm for Graszaad, Engels raaigras (overjarig)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_6750", // Graszaad, Engels raaigras (current year)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_6750", // Graszaad, Engels raaigras (previous year)
                    b_lu_start: new Date(2024, 0, 1),
                    b_lu_end: new Date(2024, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(200)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Graszaad, Engels raaigras (overjarig).",
        )
    })

    it("should return the correct norm for Akkerbouwgewassen, Roodzwenkgras (1e jaars)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_6784", // Akkerbouwgewassen, Roodzwenkgras
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(85)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Roodzwenkgras (1e jaars).",
        )
    })

    it("should return the correct norm for Akkerbouwgewassen, Roodzwenkgras (overjarig)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_6784", // Akkerbouwgewassen, Roodzwenkgras (current year)
                    b_lu_start: new Date(2026, 0, 1),
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
                {
                    b_lu_catalogue: "nl_6784", // Akkerbouwgewassen, Roodzwenkgras (previous year)
                    b_lu_start: new Date(2024, 0, 1),
                    b_lu_end: new Date(2024, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(115)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Roodzwenkgras (overjarig).",
        )
    })

    it("should return the correct norm for Winterui (1e jaars)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_1932", // Winterui, 1e jaars
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(170)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Ui overig, zaaiui of winterui. (1e jaars).",
        )
    })

    it("should return the correct norm for Winterui (2e jaars)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_1933", // Winterui, 2e jaars
                    b_lu_start: new Date(2026, 0, 1), // Current year cultivation
                    b_lu_end: new Date(2026, 5, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(170)
        expect(result.normSource).toEqual(
            "Akkerbouwgewassen, Ui overig, zaaiui of winterui. (2e jaars).",
        )
    })

    it("should return the correct norm for Bladgewassen, Spinazie (1e teelt)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2773", // Bladgewassen, Spinazie
                    b_lu_start: new Date(2026, 4, 15), // May 15th, 2026 (hoofdteelt)
                    b_lu_end: new Date(2026, 6, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(260)
        expect(result.normSource).toEqual("Bladgewassen, Spinazie (1e teelt).")
    })

    it("should return the correct norm for Bladgewassen, Slasoorten (1e teelt)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2767", // Bladgewassen, Slasoorten
                    b_lu_start: new Date(2026, 4, 15), // May 15th, 2026 (hoofdteelt)
                    b_lu_end: new Date(2026, 6, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(180)
        expect(result.normSource).toEqual(
            "Bladgewassen, Slasoorten (1e teelt).",
        )
    })

    it("should return the correct norm for Bladgewassen, Andijvie eerste teelt volgteelt (1e teelt)", async () => {
        const mockInput: NL2026NormsInput = {
            farm: { has_grazing_intention: false },
            field: {
                b_id: "1",
                b_centroid: [5.6279889, 51.975571], // Klei region
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_2708", // Bladgewassen, Andijvie eerste teelt volgteelt
                    b_lu_start: new Date(2026, 4, 15), // May 15th, 2026 (hoofdteelt)
                    b_lu_end: new Date(2026, 6, 1),
                } as Partial<NL2026NormsInputForCultivation>,
            ] as NL2026NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await calculateNL2026StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(180)
        expect(result.normSource).toEqual(
            "Bladgewassen, Andijvie eerste teelt volgteelt (1e teelt).",
        )
    })
})
