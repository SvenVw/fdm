import {
    aggregateNormsToFarmLevel,
    aggregateNormFillingsToFarmLevel,
} from "./farm"
import { calculateNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/value/dierlijke-mest-gebruiksnorm"
import { calculateNL2025FertilizerApplicationFillingForManure } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"
import { calculateNL2025FertilizerApplicationFillingForPhosphate } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { collectInputForFertilizerApplicationFilling } from "./nl/2025/filling/input"
import { calculateNL2025FertilizerApplicationFillingForNitrogen } from "./nl/2025/filling/stikstofgebruiksnorm"
import { calculateNL2025FosfaatGebruiksNorm } from "./nl/2025/value/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/value/input"
import { calculateNL2025StikstofGebruiksNorm } from "./nl/2025/value/stikstofgebruiksnorm"
import type { NormFilling } from "./nl/2025/filling/types"

export function createFunctionsForNorms(b_region: "NL", year: "2025") {
    if (b_region === "NL") {
        if (year === "2025") {
            return {
                collectInputForNorms: collectNL2025InputForNorms,
                calculateNormForNitrogen: calculateNL2025StikstofGebruiksNorm,
                calculateNormForManure: calculateNL2025DierlijkeMestGebruiksNorm,
                calculateNormForPhosphate: calculateNL2025FosfaatGebruiksNorm,
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
                    calculateNL2025FertilizerApplicationFillingForNitrogen,
                calculateFertilizerApplicationFillingForManure:
                    calculateNL2025FertilizerApplicationFillingForManure,
                calculateFertilizerApplicationFillingForPhosphate:
                    calculateNL2025FertilizerApplicationFillingForPhosphate,
                aggregateNormFillingsToFarmLevel:
                    aggregateNormFillingsToFarmLevel,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}
export type { NormFilling }
