import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/dierlijke-mest-gebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/fosfaatgebruiksnorm"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/stikstofgebruiksnorm"

export function createFunctionsForNorms(b_region: string, year: number) {
    if (b_region === "NL") {
        if (year === 2025) {
            return {
                calculateNormForNitrogen: getNL2025StikstofGebruiksNorm,
                collectInputForNormForNitrogen: undefined,
                calculateNormForManure: getNL2025DierlijkeMestGebruiksNorm,
                collectInputForNormForManure: undefined,
                calculateNormForPhosphate: getNL2025FosfaatGebruiksNorm,
                collectInputForNormForPhosphate: undefined,
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
                calculateFertilizerApplicationFillingForNitrogen: undefined,
                collectInputForFertilizerApplicationFillingForNitrogen:
                    undefined,
                calculateFertilizerApplicationFillingForManure: undefined,
                collectInputForFertilizerApplicationFillingForManure: undefined,
                calculateFertilizerApplicationFillingForPhosphate: undefined,
                collectInputForFertilizerApplicationFillingForPhosphate:
                    undefined,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}
