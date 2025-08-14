import { FdmCalculatorError } from "../error"
import { aggregateNormsToFarmLevel } from "./farm"
import { getNL2025DierlijkeMestGebruiksNorm } from "./nl/2025/dierlijke-mest-gebruiksnorm"
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
        throw new FdmCalculatorError("Year not supported", "YEAR_NOT_SUPPORTED", {
            year,
        })
    }
    throw new FdmCalculatorError("Region not supported", "REGION_NOT_SUPPORTED", {
        b_region,
    })
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
                    throw new FdmCalculatorError(
                        "collectInputForFertilizerApplicationFilling is not implemented yet",
                        "NOT_IMPLEMENTED",
                    )
                },
                calculateFertilizerApplicationFillingForNitrogen: () => {
                    throw new FdmCalculatorError(
                        "calculateFertilizerApplicationFillingForNitrogen is not implemented yet",
                        "NOT_IMPLEMENTED",
                    )
                },
                calculateFertilizerApplicationFillingForManure: () => {
                    throw new FdmCalculatorError(
                        "calculateFertilizerApplicationFillingForManure is not implemented yet",
                        "NOT_IMPLEMENTED",
                    )
                },
                calculateFertilizerApplicationFillingForPhosphate: () => {
                    throw new FdmCalculatorError(
                        "calculateFertilizerApplicationFillingForPhosphate is not implemented yet",
                        "NOT_IMPLEMENTED",
                    )
                },
            }
        }
        throw new FdmCalculatorError("Year not supported", "YEAR_NOT_SUPPORTED", {
            year,
        })
    }
    throw new FdmCalculatorError("Region not supported", "REGION_NOT_SUPPORTED", {
        b_region,
    })
}