import { describe, expect, it } from "vitest"
import { calculateNL2026DierlijkeMestGebruiksNorm } from "./dierlijke-mest-gebruiksnorm"

describe("calculateNL2026DierlijkeMestGebruiksNorm", () => {
    it("should return the default norm value", async () => {
        const result = await calculateNL2026DierlijkeMestGebruiksNorm()
        expect(result.normValue).toBe(170)
        expect(result.normSource).toBe("Standaard - geen derogatie")
    })
})
