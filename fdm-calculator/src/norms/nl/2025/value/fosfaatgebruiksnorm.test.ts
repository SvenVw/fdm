import { describe, expect, it } from "vitest"
import { getNL2025FosfaatGebruiksNorm } from "./fosfaatgebruiksnorm"
import type { NL2025NormsInput, NL2025NormsInputForCultivation } from "./types"

describe("getNL2025FosfaatGebruiksNorm", () => {
    it("should return the correct norm for grasland", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: { type: "Point", coordinates: [5.0, 52.0] },
            },
            cultivations: [
                {
                    b_lu_catalogue: "nl_265",
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }
        const result = await getNL2025FosfaatGebruiksNorm(mockInput)
        expect(result.normValue).toBe(120)
        expect(result.normSource).toContain("Grasland")
    })

    it("should return the correct norm for bouwland", async () => {
        const mockInput: NL2025NormsInput = {
            farm: { is_derogatie_bedrijf: false },
            field: {
                b_id: "1",
                b_centroid: { type: "Point", coordinates: [5.0, 52.0] },
            },
            cultivations: [
                {
                    b_lu_catalogue: "nl_101",
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }
        const result = await getNL2025FosfaatGebruiksNorm(mockInput)
        expect(result.normValue).toBe(120)
        expect(result.normSource).toContain("Bouwland")
    })
})
