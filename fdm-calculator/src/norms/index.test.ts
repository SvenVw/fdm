import { describe, expect, it } from "vitest"
import { aggregateNormsToFarmLevel } from "./farm"
import {
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
} from "./index"
import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/dierlijke-mest-gebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/input"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/stikstofgebruiksnorm"
import { calculateFertilizerApplicationFillingForPhosphate } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { calculateFertilizerApplicationFillingForManure } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"

describe("createFunctionsForNorms", () => {
    it("should return the correct functions for NL region and year 2025", () => {
        const functions = createFunctionsForNorms("NL", "2025")
        expect(functions.collectInputForNorms).toBe(collectNL2025InputForNorms)
        expect(functions.calculateNormForNitrogen).toBe(
            getNL2025StikstofGebruiksNorm,
        )
        expect(functions.calculateNormForManure).toBe(
            getNL2025DierlijkeMestGebruiksNorm,
        )
        expect(functions.calculateNormForPhosphate).toBe(
            getNL2025FosfaatGebruiksNorm,
        )
        expect(functions.aggregateNormsToFarmLevel).toBe(
            aggregateNormsToFarmLevel,
        )
    })

    it("should throw an error for an unsupported year", () => {
        expect(() => createFunctionsForNorms("NL", " 2024")).toThrow(
            "Year not supported",
        )
    })

    it("should throw an error for an unsupported region", () => {
        expect(() => createFunctionsForNorms("BE", "2025")).toThrow(
            "Region not supported",
        )
    })
})

describe("createFunctionsForFertilizerApplicationFilling", () => {
    it("should return the correct functions for NL region and year 2025", () => {
        const functions = createFunctionsForFertilizerApplicationFilling(
            "NL",
            "2025",
        )
        expect(
            functions.collectInputForFertilizerApplicationFilling,
        ).toThrowError(
            "collectInputForFertilizerApplicationFilling is not implemented yet",
        )
        expect(
            functions.calculateFertilizerApplicationFillingForNitrogen,
        ).toThrowError(
            "calculateFertilizerApplicationFillingForNitrogen is not implemented yet",
        )
        expect(functions.calculateFertilizerApplicationFillingForManure).toBe(
            calculateFertilizerApplicationFillingForManure,
        )
        expect(
            functions.calculateFertilizerApplicationFillingForPhosphate,
        ).toBe(
            calculateFertilizerApplicationFillingForPhosphate,
        )
    })

    it("should throw an error for an unsupported year", () => {
        expect(() =>
            createFunctionsForFertilizerApplicationFilling("NL", "2024"),
        ).toThrow("Year not supported")
    })

    it("should throw an error for an unsupported region", () => {
        expect(() =>
            createFunctionsForFertilizerApplicationFilling("BE", "2025"),
        ).toThrow("Region not supported")
    })
})
