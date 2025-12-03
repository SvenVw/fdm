import { describe, expect, it } from "vitest"
import {
    aggregateNormFillingsToFarmLevel,
    aggregateNormsToFarmLevel,
} from "./farm"
import {
    createFunctionsForFertilizerApplicationFilling,
    createFunctionsForNorms,
} from "./index"
import { getNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"
import { getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { collectInputForFertilizerApplicationFilling } from "./nl/2025/filling/input"
import { getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm } from "./nl/2025/filling/stikstofgebruiksnorm"
import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/value/dierlijke-mest-gebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/value/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/value/input"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/value/stikstofgebruiksnorm"

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
        // @ts-expect-error
        expect(() => createFunctionsForNorms("NL", " 2024")).toThrow(
            "Year not supported",
        )
    })

    it("should throw an error for an unsupported region", () => {
        // @ts-expect-error
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
            getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm,
        )
        expect(functions.calculateFertilizerApplicationFillingForManure).toBe(
            getNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm,
        )
        expect(
            functions.calculateFertilizerApplicationFillingForPhosphate,
        ).toBe(getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm)
        expect(functions.aggregateNormFillingsToFarmLevel).toBe(
            aggregateNormFillingsToFarmLevel,
        )
    })

    it("should throw an error for an unsupported year", () => {
        expect(() =>
            // @ts-expect-error
            createFunctionsForFertilizerApplicationFilling("NL", "2024"),
        ).toThrow("Year not supported")
    })

    it("should throw an error for an unsupported region", () => {
        expect(() =>
            // @ts-expect-error
            createFunctionsForFertilizerApplicationFilling("BE", "2025"),
        ).toThrow("Region not supported")
    })
})
