import { describe, it, expect } from "vitest"
import {
    getNL2025StikstofGebruiksNorm,
    getRegion,
    isFieldInNVGebied,
} from "./stikstofgebruiksnorm"
import {} from "./stikstofgebruiksnorm"
import type { Field } from "@svenvw/fdm-core"
import type { NL2025NormsInput, NL2025NormsInputForCultivation } from "./types"

describe("stikstofgebruiksnorm helpers", () => {
    it("should correctly identify a field in an NV Gebied", async () => {
        const centroidInNV = {
            latitude: 51.987605,
            longitude: 5.654709,
        } // Known point in NV Gebied
        const result = await isFieldInNVGebied(centroidInNV)
        expect(result).toBe(true)
    })

    it("should correctly identify a field not in an NV Gebied", async () => {
        const centroidOutsideNV = { latitude: 52.1, longitude: 5.1 } // Known point outside NV Gebied
        const result = await isFieldInNVGebied(centroidOutsideNV)
        expect(result).toBe(false)
    })

    it("should correctly identify the region for a field", async () => {
        const centroidInKlei = { latitude: 51.977587, longitude: 5.64188724 } // Known point in Klei
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
                b_centroid: {
                    latitude: 51.975571,
                    longitude: 5.6279889,
                },
            } as Field,
            cultivations: [
                {
                    b_lu_catalogue: "nl_265",
                    b_lu_end: new Date(),
                } as Partial<NL2025NormsInputForCultivation>,
            ] as NL2025NormsInputForCultivation[],
            soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
        }

        const result = await getNL2025StikstofGebruiksNorm(mockInput)
        expect(result.normValue).toBe(345)
        expect(result.normSource).toContain("Grasland")
    })

    it(
        "should return the correct norm for potatoes",
        { timeout: 1000000 },
        async () => {
            const mockInput: NL2025NormsInput = {
                farm: { is_derogatie_bedrijf: false },
                field: {
                    b_id: "1",
                    b_centroid: { latitude: 53.3551734, longitude: 6.7580377 },
                } as Field,
                cultivations: [
                    {
                        b_lu_catalogue: "nl_2015", // Pootaardappel
                        b_lu_variety: "Adora",
                        b_lu_end: new Date(),
                    } as Partial<NL2025NormsInputForCultivation>,
                ] as NL2025NormsInputForCultivation[],
                soilAnalysis: { a_p_al: 20, a_p_cc: 0.9 },
            }

            const result = await getNL2025StikstofGebruiksNorm(mockInput)
            expect(result.normValue).toBe(140)
            expect(result.normSource).toContain(
                "Akkerbouwgewas, pootaardappelen",
            )
        },
    )
})
