import { getNL2025FosfaatGebruiksNorm } from "./nl/2025/fosfaatgebruiksnorm"
import { getNL2025StikstofGebruiksNorm } from "./nl/2025/stikstofgebruiksnorm"

export function createFunctionsForNorms(b_region: string, year: number) {

    if (b_region == 'NL') {
        if (year === 2025) {
            return {
                calculateNormForNitrogen: getNL2025StikstofGebruiksNorm,
                collectInputForNormForNitrogen: undefined,
                calculateNormForManure: undefined,
                collectInputForNormForManure: undefined,
                calculateNormForPhosphate: getNL2025FosfaatGebruiksNorm,
                collectInputForNormForPhosphate: undefined,
            }
        } else  {
            throw new Error('Year not supported')
        }
    } else {
        throw new Error('Region not supported')
    }
}

export function createFunctionsForFertilizerApplicationFilling(b_region: string, year: number) {

    if (b_region == 'NL') {
        if (year === 2025) {
            return {
                calculateFertilizerApplicationFillingForNitrogen: undefined,
                collectInputForFertilizerApplicationFillingForNitrogen: undefined,
                calculateFertilizerApplicationFillingForManure: undefined,
                collectInputForFertilizerApplicationFillingForManure: undefined,
                calculateFertilizerApplicationFillingForPhosphate: undefined,
                collectInputForFertilizerApplicationFillingForPhosphate: undefined,
            }
        } else  {
            throw new Error('Year not supported')
        }
    } else {
        throw new Error('Region not supported')
    }
}