import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/dierlijke-mest-gebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/input"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/stikstofgebruiksnorm"

export function createFunctionsForNorms(b_region: string, year: number) {
    if (b_region === "NL") {
        if (year === 2025) {
            return {
                collectInputForNorms: collectNL2025InputForNorms,
                calculateNormForNitrogen: getNL2025StikstofGebruiksNorm,
                calculateNormForManure: getNL2025DierlijkeMestGebruiksNorm,
                calculateNormForPhosphate: getNL2025FosfaatGebruiksNorm,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}

export function createFunctionsForFertilizerApplicationFilling(
    b_region: string,
    year: number,
) {
    if (b_region === "NL") {
        if (year === 2025) {
            return {
                collectInputForFertilizerApplicationFilling: undefined,
                calculateFertilizerApplicationFillingForNitrogen: undefined,
                calculateFertilizerApplicationFillingForManure: undefined,
                calculateFertilizerApplicationFillingForPhosphate: undefined,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}
