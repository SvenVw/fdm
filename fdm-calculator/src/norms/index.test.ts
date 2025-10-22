import { describe, expect, it } from "vitest"
import {
    aggregateNormFillingsToFarmLevel,
    aggregateNormsToFarmLevel,
} from "./farm"
import {
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
} from "./index"
import { calculateNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/value/dierlijke-mest-gebruiksnorm"
import { calculateNL2025FosfaatGebruiksNorm } from "./nl/2025/value/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/value/input"
import { calculateNL2025StikstofGebruiksNorm } from "./nl/2025/value/stikstofgebruiksnorm"
import { calculateNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { calculateNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"
import { calculateNL2025FertilizerApplicationFillingForStikstofGebruiksNorm } from "./nl/2025/filling/stikstofgebruiksnorm"
import { collectInputForFertilizerApplicationFilling } from "./nl/2025/filling/input"

describe("createFunctionsForNorms", () => {
    it("should return the correct functions for NL region and year 2025", () => {
        const functions = createFunctionsForNorms("NL", "2025")
        expect(functions.collectInputForNorms).toBe(collectNL2025InputForNorms)
        expect(functions.calculateNormForNitrogen).toBe(
            calculateNL2025StikstofGebruiksNorm,
        )
        expect(functions.calculateNormForManure).toBe(
            calculateNL2025DierlijkeMestGebruiksNorm,
        )
        expect(functions.calculateNormForPhosphate).toBe(
            calculateNL2025FosfaatGebruiksNorm,
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
        expect(functions.collectInputForFertilizerApplicationFilling).toBe(
            collectInputForFertilizerApplicationFilling,
        )
        expect(functions.calculateFertilizerApplicationFillingForNitrogen).toBe(
            calculateNL2025FertilizerApplicationFillingForStikstofGebruiksNorm,
        )
        expect(functions.calculateFertilizerApplicationFillingForManure).toBe(
            calculateNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm,
        )
        expect(
            functions.calculateFertilizerApplicationFillingForPhosphate,
        ).toBe(
            calculateNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm,
        )
        expect(functions.aggregateNormFillingsToFarmLevel).toBe(
            aggregateNormFillingsToFarmLevel,
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
