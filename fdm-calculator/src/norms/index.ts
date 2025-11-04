import {
    aggregateNormFillingsToFarmLevel,
    aggregateNormsToFarmLevel,
} from "./farm"
import { getNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"
import { getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { collectInputForFertilizerApplicationFilling } from "./nl/2025/filling/input"
import { getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm } from "./nl/2025/filling/stikstofgebruiksnorm"
import type { NormFilling } from "./nl/2025/filling/types"
import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/value/dierlijke-mest-gebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/value/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/value/input"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/value/stikstofgebruiksnorm"

export function createFunctionsForNorms(b_region: "NL", year: "2025") {
    if (b_region === "NL") {
        if (year === "2025") {
            return {
                collectInputForNorms: collectNL2025InputForNorms,
                calculateNormForNitrogen: getNL2025StikstofGebruiksNorm,
                calculateNormForManure: getNL2025DierlijkeMestGebruiksNorm,
                calculateNormForPhosphate: getNL2025FosfaatGebruiksNorm,
                aggregateNormsToFarmLevel: aggregateNormsToFarmLevel,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}

export function createFunctionsForFertilizerApplicationFilling(
    b_region: "NL",
    year: "2025",
) {
    if (b_region === "NL") {
        if (year === "2025") {
            return {
                collectInputForFertilizerApplicationFilling:
                    collectInputForFertilizerApplicationFilling,
                calculateFertilizerApplicationFillingForNitrogen:
                    getNL2025FertilizerApplicationFillingForStikstofGebruiksNorm,
                calculateFertilizerApplicationFillingForManure:
                    getNL2025FertilizerApplicationFillingForDierlijkeMestGebruiksNorm,
                calculateFertilizerApplicationFillingForPhosphate:
                    getNL2025FertilizerApplicationFillingForFosfaatGebruiksNorm,
                aggregateNormFillingsToFarmLevel:
                    aggregateNormFillingsToFarmLevel,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}
export type { NormFilling }
