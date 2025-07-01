import { describe, it, expect } from "vitest"
import { getNL2025DierlijkeMestGebruiksNorm } from "./dierlijke-mest-gebruiksnorm"
import type { NL2025NormsInput } from "./types"

describe("getNL2025DierlijkeMestGebruiksNorm", () => {
    it("should return the default norm value", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: { type: "Point", coordinates: [5.0, 52.0] },
            },
            cultivations: [],
            soilAnalysis: { a_p_cc: 0, a_p_al: 0 },
        }
        const result = await getNL2025DierlijkeMestGebruiksNorm(mockInput)
        expect(result.normValue).toBe(170)
        expect(result.normSource).toBe("Standaard - geen derogatie")
    })
})
