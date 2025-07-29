import { describe, it, expect } from "vitest"
import { getNL2025DierlijkeMestGebruiksNorm } from "./dierlijke-mest-gebruiksnorm"
import type { NL2025NormsInput } from "./types"

describe("getNL2025DierlijkeMestGebruiksNorm", () => {
    it("should return the default norm value", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.641351453912945, 51.97755938887036],
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(170)
        expect(result.normSource).toBe("Standaard - geen derogatie")
    })

    it("should return the default norm value with derogation", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: true },
            field: {
                b_id: "1",
                b_centroid: [5.641351453912945, 51.97755938887036],
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(200)
        expect(result.normSource).toBe("Derogatie")
    })

    it("should return the adjusted norm value for derogation in NV-gebied", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: true },
            field: {
                b_id: "1",
                b_centroid: [5.654759168118452, 51.987887874110555],
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(190)
        expect(result.normSource).toBe("Derogatie - NV Gebied")
    })

    it("should return the default norm value without derogation in NV-gebied", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: [5.654759168118452, 51.987887874110555],
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(170)
        expect(result.normSource).toBe("Standaard - geen derogatie")
    })

    it("should return the default norm value for derogation in Grondwaterbeschermingsgebied", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: true },
            field: {
                b_id: "1",
                b_centroid: [6.423238, 52.3445902],
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(190)
        expect(result.normSource).toBe(
            "Derogatie - Grondwaterbeschermingsgebied",
        )
    })

    it("should return the default norm value for derogation outside Grondwaterbeschermingsgebied and inside NV-gebied, but with single array responce (see #205)", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: true },
            field: {
                b_id: "1",
                b_centroid: [5.058131582583726, 52.50733333508596],
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(190)
        expect(result.normSource).toBe("Derogatie - NV Gebied")
    })
})
