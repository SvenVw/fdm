import { aggregateNormsToFarmLevel } from "./farm"
import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/dierlijke-mest-gebruiksnorm"
import { calculateFertilizerApplicationFillingForManure } from "./nl/2025/filling/dierlijke-mest-gebruiksnorm"
import { calculateFertilizerApplicationFillingForPhosphate } from "./nl/2025/filling/fosfaatgebruiksnorm"
import { calculateFertilizerApplicationFillingForNitrogen } from "./nl/2025/filling/stikstofgebruiksnorm"
import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/fosfaatgebruiksnorm"
import { collectNL2025InputForNorms } from "./nl/2025/input"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/stikstofgebruiksnorm"

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
            // TODO: Implement fertilizer application filling functions for NL 2025
            return {
                collectInputForFertilizerApplicationFilling: () => {
                    throw new Error(
                        "collectInputForFertilizerApplicationFilling is not implemented yet",
                    )
                },
                calculateFertilizerApplicationFillingForNitrogen:
                    calculateFertilizerApplicationFillingForNitrogen,
                calculateFertilizerApplicationFillingForManure:
                    calculateFertilizerApplicationFillingForManure,
                calculateFertilizerApplicationFillingForPhosphate:
                    calculateFertilizerApplicationFillingForPhosphate,
            }
        }
        throw new Error("Year not supported")
    }
    throw new Error("Region not supported")
}
