import type { fdmSchema } from "@svenvw/fdm-core"
import { differenceInCalendarDays } from "date-fns"
import Decimal from "decimal.js"
import { FdmCalculatorError } from "../../../error"
import type {
    NitrogenBalanceInput,
    NitrogenSupplyMineralization,
    SoilAnalysisPicked,
} from "../types"

/**
 * Calculates the amount of nitrogen supplied through soil mineralization using Minip.
 *
 * This function determines the mineralization based on the soil analyses conducted.
 * @param soilAnalysis - Combined soil analysis data for the field.
 * @param timeFrame - The timeframe for which to calculate the nitrogen mineralization.
 * @returns The NitrogenSupplyMineralization object containing the total amount of Nitrogen mineralized.
 */
export function calculateNitrogenSupplyBySoilMineralization(
    soilAnalysis: SoilAnalysisPicked,
    timeFrame: NitrogenBalanceInput["timeFrame"],
): NitrogenSupplyMineralization {
    let mineralizationValue =
        calculateNitrogenSupplyBySoilMineralizationUsingMinip(
            soilAnalysis.a_c_of,
            soilAnalysis.a_cn_fr,
            soilAnalysis.a_density_sa,
        )

    // Limit the min and max values for the mineralization
    if (mineralizationValue.greaterThan(250)) {
        mineralizationValue = new Decimal(250)
    }
    if (mineralizationValue.lessThan(5)) {
        mineralizationValue = new Decimal(5)
    }

    // Adjust for the number of days
    const timeFrameDays = new Decimal(
        differenceInCalendarDays(timeFrame.end, timeFrame.start),
    )
    // Ensure timeFrameDays is positive
    if (timeFrameDays.lessThanOrEqualTo(0)) {
        return { total: new Decimal(0) }
    }
    const timeFrameFraction = timeFrameDays.add(1).dividedBy(365)
    const mineralization = mineralizationValue.times(timeFrameFraction)

    return {
        total: mineralization,
    }
}

/**
 * Calculates the amount of nitrogen supplied through soil mineralization by using the MINIP model
 *
 * This function applies a specific formula to calculate nitrogen mineralization based on organic carbon content,
 * C/N ratio, and soil bulk density.
 * @param a_c_of - The organic carbon content of the soil (g C / kg soil).
 * @param a_cn_fr - The C/N ratio of the soil organic matter.
 * @param a_density_sa - The soil bulk density (kg / m³).
 * @returns The amount of nitrogen mineralized in kg N / ha.
 * @throws Throws an error if required soil analysis data is missing or average yearly temperature is too high.
 */
export function calculateNitrogenSupplyBySoilMineralizationUsingMinip(
    a_c_of: fdmSchema.soilAnalysisTypeSelect["a_c_of"],
    a_cn_fr: fdmSchema.soilAnalysisTypeSelect["a_cn_fr"],
    a_density_sa: fdmSchema.soilAnalysisTypeSelect["a_density_sa"],
): Decimal {
    // Average yearly temperature
    const w_temp_mean = new Decimal(10.6)

    // Depth of bouwvoor (cm)
    const bouwvoor = new Decimal(20)

    // Calculate temperature correction
    let temperatureCorrection = new Decimal(0)
    if (w_temp_mean.gt(-1) && w_temp_mean.lte(9)) {
        temperatureCorrection = w_temp_mean.times(0.1)
    } else if (w_temp_mean.gt(9) && w_temp_mean.lte(27)) {
        const a = w_temp_mean.minus(9).dividedBy(9)
        temperatureCorrection = new Decimal(2).pow(a)
    } else if (w_temp_mean.gt(27)) {
        throw new FdmCalculatorError(
            "Average yearly temperature is too high",
            "CALCULATION_FAILED",
            { w_temp_mean },
        )
    }

    if (a_c_of === null || a_c_of === undefined) {
        throw new FdmCalculatorError(
            "No a_c_of value found in soil analysis for arable",
            "MISSING_SOIL_PARAMETER",
            { parameter: "a_c_of" },
        )
    }
    if (a_cn_fr === null || a_cn_fr === undefined) {
        throw new FdmCalculatorError(
            "No a_cn_fr value found in soil analysis for arable",
            "MISSING_SOIL_PARAMETER",
            { parameter: "a_cn_fr" },
        )
    }
    if (a_density_sa === null || a_density_sa === undefined) {
        throw new FdmCalculatorError(
            "No a_density_sa value found in soil analysis for arable",
            "MISSING_SOIL_PARAMETER",
            { parameter: "a_density_sa" },
        )
    }

    // Calculate Cdec
    const b = temperatureCorrection.times(10).add(17).pow(-0.6)
    const c = new Decimal(17).pow(-0.6)
    const d = b.minus(c).times(4.7).exp()
    const e = new Decimal(1).minus(d)
    const cDec = new Decimal(a_c_of).times(e).dividedBy(10)

    // Calculate the mineralization
    const f = new Decimal(1.5).times(cDec).dividedBy(a_cn_fr)
    const g = cDec.dividedBy(bouwvoor)
    const mineralization = f
        .minus(g)
        .times(10000)
        .times(bouwvoor.dividedBy(100))
        .times(a_density_sa)

    return mineralization
}
